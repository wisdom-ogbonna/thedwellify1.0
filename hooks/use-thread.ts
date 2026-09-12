import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

import { useAuth } from "../context/AuthContext";
import * as chatApi from "../services/chatApi";
import type { UploadableFile } from "../services/chatApi";
import { readCachedMessages, writeCachedMessages } from "../services/chatCache";
import * as outbox from "../services/chatOutbox";
import {
  setTypingFlag,
  subscribeToMessages,
  subscribeToPresence,
  subscribeToTyping,
} from "../services/chatStream";
import type {
  Conversation,
  Message,
  Presence,
  ReplyPreview,
} from "../services/chatTypes";
import {
  emitTyping,
  joinConversationRoom,
  leaveConversationRoom,
} from "../services/socket";

const TYPING_THROTTLE_MS = 3000;
const TYPING_IDLE_MS = 4000;
const HEARTBEAT_MS = 60000;

/** Unresolved serverTimestamp sorts last — correct for a message just sent. */
const sortKey = (m: Message) => m.createdAt ?? Number.MAX_SAFE_INTEGER;

/**
 * Merge history, the live tail, and pending sends into one ordered list.
 *
 * Because the API uses clientMessageId as the message document id, an optimistic
 * outbox item and its confirmed message share an id — so de-duplicating by id
 * automatically swaps the placeholder for the real thing with no flicker.
 */
const mergeMessages = (...groups: Message[][]) => {
  const byId = new Map<string, Message>();

  for (const group of groups) {
    for (const message of group) {
      const existing = byId.get(message.id);

      // Confirmed always wins over a local placeholder.
      if (existing) {
        const existingLocal =
          existing.status === "sending" || existing.status === "failed";
        const incomingLocal =
          message.status === "sending" || message.status === "failed";

        if (existingLocal && !incomingLocal) byId.set(message.id, message);
        else if (!existingLocal && incomingLocal) continue;
        else byId.set(message.id, { ...existing, ...message });
      } else {
        byId.set(message.id, message);
      }
    }
  }

  return [...byId.values()].sort((a, b) => sortKey(a) - sortKey(b));
};

export const useThread = (conversationId?: string) => {
  const { user } = useAuth();
  const userId = user?.uid;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [history, setHistory] = useState<Message[]>([]);
  const [tail, setTail] = useState<Message[]>([]);
  const [pending, setPending] = useState<Message[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [peerTyping, setPeerTyping] = useState(false);
  const [presence, setPresence] = useState<Presence>({
    isOnline: false,
    lastSeen: null,
  });
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const mounted = useRef(true);
  const lastTypingSentAt = useRef(0);
  const typingIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const signingRef = useRef<Set<string>>(new Set());
  const deliveredRef = useRef<Set<string>>(new Set());

  const peerId = conversation?.otherUser?.id ?? null;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /* ------------------------------ conversation ------------------------------ */

  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;

    (async () => {
      try {
        const data = await chatApi.fetchConversation(conversationId);
        if (!cancelled && mounted.current) {
          setConversation(data);
          setPresence({
            isOnline: Boolean(data.otherUser?.isOnline),
            lastSeen: data.otherUser?.lastSeen ?? null,
          });
        }
      } catch (err: any) {
        if (!cancelled && mounted.current) {
          setError(err?.response?.data?.error || "Couldn't open this chat");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  /* --------------------------------- history -------------------------------- */

  // Cache first so the thread paints instantly, even offline.
  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;

    void readCachedMessages(conversationId).then((cached) => {
      if (cancelled || !cached.length) return;
      setHistory((current) => (current.length ? current : cached));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  const loadFirstPage = useCallback(async () => {
    if (!conversationId) return;

    try {
      const page = await chatApi.fetchMessages(conversationId);
      if (!mounted.current) return;

      setHistory(page.items);
      setNextCursor(page.nextCursor);
      setError(null);
      void writeCachedMessages(conversationId, page.items);
    } catch (err: any) {
      if (mounted.current) {
        setError(err?.response?.data?.error || "Couldn't load messages");
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  const loadOlder = useCallback(async () => {
    if (!conversationId || !nextCursor || loadingMore) return;

    setLoadingMore(true);
    try {
      const page = await chatApi.fetchMessages(conversationId, nextCursor);
      if (!mounted.current) return;

      setHistory((current) => mergeMessages(page.items, current));
      setNextCursor(page.nextCursor);
    } catch {
      /* keep what we have */
    } finally {
      if (mounted.current) setLoadingMore(false);
    }
  }, [conversationId, nextCursor, loadingMore]);

  /* -------------------------------- live tail ------------------------------- */

  useEffect(() => {
    if (!conversationId || !userId) return;

    const unsubscribe = subscribeToMessages(
      conversationId,
      userId,
      (live) => {
        if (mounted.current) setTail(live);
      },
      () => {
        // Rules not deployed, or offline. REST already gave us a page.
      }
    );

    joinConversationRoom(conversationId);

    return () => {
      unsubscribe();
      leaveConversationRoom(conversationId);
    };
  }, [conversationId, userId]);

  /* --------------------------------- outbox --------------------------------- */

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = outbox.subscribeToOutbox((items) => {
      if (!mounted.current) return;

      const mine = items.filter((i) => i.conversationId === conversationId);
      setPending(mine.map(outbox.outboxToMessage));

      // Feeds the progress veil on image bubbles.
      setUploadProgress(
        mine.reduce<Record<string, number>>((acc, item) => {
          if (item.progress !== undefined) acc[item.clientMessageId] = item.progress;
          return acc;
        }, {})
      );
    });

    return unsubscribe;
  }, [conversationId]);

  /* -------------------------- combined message list ------------------------- */

  const messages = useMemo(() => {
    const merged = mergeMessages(history, tail, pending);

    // Media from the listener has a path but no URL; splice in whatever we've signed.
    return merged.map((m) =>
      !m.mediaUrl && m.mediaPath && signedUrls[m.mediaPath]
        ? { ...m, mediaUrl: signedUrls[m.mediaPath] }
        : m
    );
  }, [history, tail, pending, signedUrls]);

  // Persist the tail for offline reads.
  useEffect(() => {
    if (!conversationId || !messages.length) return;
    void writeCachedMessages(
      conversationId,
      messages.filter((m) => m.status !== "sending" && m.status !== "failed")
    );
  }, [conversationId, messages]);

  /* ---------------------------- signed media URLs --------------------------- */

  useEffect(() => {
    if (!conversationId) return;

    const needed = messages
      .filter((m) => m.mediaPath && !m.mediaUrl)
      .map((m) => m.mediaPath as string)
      .filter((p) => !signingRef.current.has(p));

    if (!needed.length) return;

    needed.forEach((p) => signingRef.current.add(p));

    void chatApi
      .signMediaPaths(conversationId, needed)
      .then((urls) => {
        if (mounted.current && Object.keys(urls).length) {
          setSignedUrls((current) => ({ ...current, ...urls }));
        }
      })
      .catch(() => {
        // Allow a later retry rather than permanently blocking these paths.
        needed.forEach((p) => signingRef.current.delete(p));
      });
  }, [conversationId, messages]);

  /* --------------------------------- typing --------------------------------- */

  useEffect(() => {
    if (!conversationId || !peerId) return;
    return subscribeToTyping(conversationId, peerId, (typing) => {
      if (mounted.current) setPeerTyping(typing);
    });
  }, [conversationId, peerId]);

  const stopTyping = useCallback(() => {
    if (!conversationId || !userId || !isTypingRef.current) return;

    isTypingRef.current = false;
    lastTypingSentAt.current = 0;
    void setTypingFlag(conversationId, userId, false);
    emitTyping(conversationId, false);
  }, [conversationId, userId]);

  /** Call on every keystroke — throttled internally to one write per 3s. */
  const onInputChange = useCallback(
    (text: string) => {
      if (!conversationId || !userId) return;

      if (typingIdleTimer.current) clearTimeout(typingIdleTimer.current);

      if (!text.trim()) {
        stopTyping();
        return;
      }

      const now = Date.now();
      if (now - lastTypingSentAt.current > TYPING_THROTTLE_MS) {
        lastTypingSentAt.current = now;
        isTypingRef.current = true;
        void setTypingFlag(conversationId, userId, true);
        emitTyping(conversationId, true);
      }

      typingIdleTimer.current = setTimeout(stopTyping, TYPING_IDLE_MS);
    },
    [conversationId, userId, stopTyping]
  );

  useEffect(
    () => () => {
      if (typingIdleTimer.current) clearTimeout(typingIdleTimer.current);
      stopTyping();
    },
    [stopTyping]
  );

  /* -------------------------------- presence -------------------------------- */

  useEffect(() => {
    if (!peerId) return;
    return subscribeToPresence(peerId, (next) => {
      if (mounted.current) setPresence(next);
    });
  }, [peerId]);

  // Heartbeat while this thread is on screen, so the peer sees us online and the
  // server can skip push for a message we're already looking at.
  useEffect(() => {
    if (!conversationId) return;

    void chatApi.sendHeartbeat(conversationId).catch(() => {});
    const interval = setInterval(() => {
      if (AppState.currentState === "active") {
        void chatApi.sendHeartbeat(conversationId).catch(() => {});
      }
    }, HEARTBEAT_MS);

    return () => {
      clearInterval(interval);
      void chatApi.clearOpenThread().catch(() => {});
    };
  }, [conversationId]);

  /* -------------------------------- receipts -------------------------------- */

  // Anything addressed to us that is still "sent" has now reached the device.
  useEffect(() => {
    if (!conversationId || !userId) return;

    const undelivered = messages
      .filter(
        (m) =>
          m.receiverId === userId &&
          m.status === "sent" &&
          !deliveredRef.current.has(m.id)
      )
      .map((m) => m.id);

    if (!undelivered.length) return;

    undelivered.forEach((id) => deliveredRef.current.add(id));
    void chatApi.markDelivered(conversationId, undelivered).catch(() => {
      undelivered.forEach((id) => deliveredRef.current.delete(id));
    });
  }, [conversationId, userId, messages]);

  const markRead = useCallback(async () => {
    if (!conversationId) return;
    try {
      await chatApi.markRead(conversationId);
      setConversation((c) => (c ? { ...c, unreadCount: 0 } : c));
    } catch {
      /* retried next focus */
    }
  }, [conversationId]);

  /* ---------------------------------- send ---------------------------------- */

  const sendText = useCallback(
    async (text: string, replyTo?: ReplyPreview | null) => {
      const trimmed = text.trim();
      if (!trimmed || !conversationId || !userId || !peerId) return;

      stopTyping();

      await outbox.enqueue({
        clientMessageId: outbox.newClientMessageId(),
        conversationId,
        senderId: userId,
        receiverId: peerId,
        kind: "text",
        text: trimmed,
        replyTo: replyTo ?? null,
      });
    },
    [conversationId, userId, peerId, stopTyping]
  );

  const sendAttachments = useCallback(
    async (files: UploadableFile[], caption?: string) => {
      if (!conversationId || !userId || !peerId || !files.length) return;

      for (const [index, file] of files.entries()) {
        await outbox.enqueue({
          clientMessageId: outbox.newClientMessageId(),
          conversationId,
          senderId: userId,
          receiverId: peerId,
          kind: "media",
          file,
          caption: index === 0 ? caption : undefined,
        });
      }
    },
    [conversationId, userId, peerId]
  );

  const sendProperty = useCallback(
    async (propertyCard: Record<string, unknown>, text?: string) => {
      if (!conversationId || !userId || !peerId) return;

      await outbox.enqueue({
        clientMessageId: outbox.newClientMessageId(),
        conversationId,
        senderId: userId,
        receiverId: peerId,
        kind: "property",
        propertyCard,
        text,
      });
    },
    [conversationId, userId, peerId]
  );

  const retry = useCallback((clientMessageId: string) => {
    void outbox.retryItem(clientMessageId);
  }, []);

  const discard = useCallback((clientMessageId: string) => {
    void outbox.discardItem(clientMessageId);
  }, []);

  const removeMessage = useCallback(
    async (messageId: string, forEveryone = false) => {
      if (!conversationId) return;

      setHistory((c) => c.filter((m) => m.id !== messageId));
      setTail((c) => c.filter((m) => m.id !== messageId));

      try {
        await chatApi.deleteMessage(conversationId, messageId, forEveryone);
      } catch {
        void loadFirstPage();
      }
    },
    [conversationId, loadFirstPage]
  );

  return {
    conversation,
    messages,
    loading,
    error,
    loadingMore,
    hasMore: Boolean(nextCursor),
    peerTyping,
    presence,
    uploadProgress,
    setUploadProgress,

    loadOlder,
    refresh: loadFirstPage,
    markRead,
    onInputChange,
    stopTyping,
    sendText,
    sendAttachments,
    sendProperty,
    retry,
    discard,
    removeMessage,
  };
};

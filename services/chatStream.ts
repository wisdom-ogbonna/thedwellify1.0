import {
  collection,
  doc,
  limit as fsLimit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from "firebase/firestore";

import { firestore } from "../config/firebase";
import type { Conversation, Message, Presence } from "./chatTypes";

/**
 * Firestore realtime layer.
 *
 * This is the primary transport for live chat: it works regardless of hosting
 * (the API runs on Vercel serverless, which cannot hold websockets), and gives
 * ordering and reconnect handling for free. Writes are NOT done here — they go
 * through services/chatApi.ts so the server stays authoritative. The single
 * exception is the typing flag, which firestore.rules scopes to the caller's own
 * field so a keystroke needs no API round trip.
 */

const TYPING_TTL_MS = 6000;

/** Firestore Timestamp -> epoch millis, so no {_seconds} shape reaches the UI. */
const ts = (value: unknown): number | null => {
  if (!value) return null;
  const maybe = value as Timestamp;
  if (typeof maybe?.toMillis === "function") return maybe.toMillis();
  if (typeof value === "number") return value;
  return null;
};

/* ------------------------------- conversations ------------------------------- */

const mapConversation = (
  snap: QueryDocumentSnapshot<DocumentData>,
  userId: string
): Conversation => {
  const data = snap.data();
  const participants: string[] = data.participants ?? [];
  const peerId = participants.find((id) => id !== userId) ?? null;

  return {
    id: snap.id,
    productId: data.productId,
    productTitle: data.productTitle ?? null,
    productImage: data.productImage ?? null,
    productPrice: data.productPrice ?? null,
    productLocation: data.productLocation ?? null,
    agentId: data.agentId,
    clientId: data.clientId,
    // The listener has no access to the peer's profile (users/* is API-only), so
    // this is null here and merged in from the REST payload by the hook.
    otherUser: peerId ? ({ id: peerId } as Conversation["otherUser"]) : null,
    lastMessage: data.lastMessage ?? null,
    lastMessageType: data.lastMessageType ?? null,
    lastMessageAt: ts(data.lastMessageAt),
    lastMessageSenderId: data.lastMessageSenderId ?? null,
    unreadCount: data.unreadCount?.[userId] ?? 0,
    isArchived: (data.archivedFor ?? []).includes(userId),
    isMuted: (data.mutedFor ?? []).includes(userId),
    createdAt: ts(data.createdAt),
    updatedAt: ts(data.updatedAt),
  };
};

export const subscribeToConversations = (
  userId: string,
  onChange: (conversations: Conversation[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(
    collection(firestore, "conversations"),
    where("participants", "array-contains", userId),
    orderBy("lastMessageAt", "desc"),
    fsLimit(50)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const visible = snapshot.docs
        .filter((d) => !(d.data().deletedFor ?? []).includes(userId))
        .filter((d) => d.data().status === "active")
        .map((d) => mapConversation(d, userId));

      onChange(visible);
    },
    (error) => {
      console.log("conversations listener error:", error.message);
      onError?.(error);
    }
  );
};

/* --------------------------------- messages --------------------------------- */

const mapMessage = (snap: QueryDocumentSnapshot<DocumentData>): Message => {
  const data = snap.data();

  return {
    id: snap.id,
    conversationId: data.conversationId,
    clientMessageId: data.clientMessageId ?? null,
    senderId: data.senderId,
    receiverId: data.receiverId,
    text: data.text ?? "",
    type: data.type ?? "text",
    status: data.status ?? (data.read ? "read" : "sent"),
    read: Boolean(data.read),
    propertyCard: data.propertyCard ?? null,
    replyTo: data.replyTo ?? null,
    mediaType: data.mediaType ?? null,
    mediaUrl: null, // resolved separately via chatApi.signMediaPaths
    mediaPath: data.mediaPath ?? null,
    mimeType: data.mimeType ?? null,
    fileName: data.fileName ?? null,
    fileSize: data.fileSize ?? null,
    width: data.width ?? null,
    height: data.height ?? null,
    deletedFor: data.deletedFor ?? [],
    deletedForEveryone: Boolean(data.deletedForEveryone),
    createdAt: ts(data.createdAt),
    deliveredAt: ts(data.deliveredAt),
    readAt: ts(data.readAt),
  };
};

/**
 * Live tail of a thread. Only the most recent `pageSize` messages are watched —
 * older history is paged in over REST — so a long thread does not open an
 * unbounded listener.
 */
export const subscribeToMessages = (
  conversationId: string,
  userId: string,
  onChange: (messages: Message[]) => void,
  onError?: (error: Error) => void,
  pageSize = 40
) => {
  const q = query(
    collection(firestore, "conversations", conversationId, "messages"),
    orderBy("createdAt", "desc"),
    fsLimit(pageSize)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs
        .filter((d) => !(d.data().deletedFor ?? []).includes(userId))
        .map(mapMessage)
        // serverTimestamp() resolves as null on the writer's own optimistic
        // snapshot; keep those pinned to the newest end rather than dropping them.
        .reverse();

      onChange(messages);
    },
    (error) => {
      console.log("messages listener error:", error.message);
      onError?.(error);
    }
  );
};

/* ---------------------------------- typing ---------------------------------- */

const typingDocRef = (conversationId: string) =>
  doc(firestore, "conversations", conversationId, "state", "typing");

/**
 * Publish our typing flag. Callers must throttle (use-thread does, at 3s) — the
 * rules allow this write but it should not fire per keystroke.
 */
export const setTypingFlag = async (
  conversationId: string,
  userId: string,
  isTyping: boolean
) => {
  try {
    await setDoc(
      typingDocRef(conversationId),
      { [userId]: isTyping ? serverTimestamp() : null },
      { merge: true }
    );
  } catch (error) {
    // Typing is cosmetic; never surface a failure.
    console.log("setTypingFlag skipped:", (error as Error).message);
  }
};

/**
 * Watch whether the peer is typing. Stale flags are ignored client-side so a
 * killed app cannot leave "typing…" on screen forever.
 */
export const subscribeToTyping = (
  conversationId: string,
  peerId: string,
  onChange: (isTyping: boolean) => void
) => {
  let expiry: ReturnType<typeof setTimeout> | null = null;

  const unsubscribe = onSnapshot(
    typingDocRef(conversationId),
    (snapshot) => {
      if (expiry) clearTimeout(expiry);

      const at = ts(snapshot.data()?.[peerId]);
      const age = at ? Date.now() - at : Infinity;
      const typing = age < TYPING_TTL_MS;

      onChange(typing);

      // Expire locally, since the peer may never send the "stopped" write.
      if (typing) {
        expiry = setTimeout(() => onChange(false), TYPING_TTL_MS - age);
      }
    },
    (error) => console.log("typing listener error:", error.message)
  );

  return () => {
    if (expiry) clearTimeout(expiry);
    unsubscribe();
  };
};

/* --------------------------------- presence --------------------------------- */

export const subscribeToPresence = (
  userId: string,
  onChange: (presence: Presence) => void
) =>
  onSnapshot(
    doc(firestore, "presence", userId),
    (snapshot) => {
      const data = snapshot.data();
      onChange({
        isOnline: Boolean(data?.isOnline),
        lastSeen: ts(data?.lastSeen),
      });
    },
    (error) => console.log("presence listener error:", error.message)
  );

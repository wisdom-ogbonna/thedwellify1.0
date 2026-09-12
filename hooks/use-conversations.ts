import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "../context/AuthContext";
import * as chatApi from "../services/chatApi";
import { setUnreadTotal } from "../services/chatBadge";
import { readCachedConversations, writeCachedConversations } from "../services/chatCache";
import { subscribeToConversations } from "../services/chatStream";
import type { ChatUser, Conversation } from "../services/chatTypes";

/**
 * Conversation list.
 *
 * Two sources, merged:
 *  - REST supplies peer profiles (users/* is API-only, so the Firestore listener
 *    cannot resolve names) plus history pagination.
 *  - The Firestore listener supplies live lastMessage / unreadCount / ordering.
 *
 * The AsyncStorage cache is rendered first so the list is never blank on a cold
 * or offline start.
 */
export const useConversations = () => {
  const { user } = useAuth();
  const userId = user?.uid;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Peer profiles keyed by uid, held across listener updates.
  const profiles = useRef<Record<string, ChatUser>>({});
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const rememberProfiles = useCallback((list: Conversation[]) => {
    for (const c of list) {
      if (c.otherUser?.name) profiles.current[c.otherUser.id] = c.otherUser;
    }
  }, []);

  /** Attach the cached profile to a listener-sourced conversation. */
  const hydrate = useCallback(
    (list: Conversation[]) =>
      list.map((c) => {
        const peerId = c.otherUser?.id;
        const known = peerId ? profiles.current[peerId] : undefined;
        return known ? { ...c, otherUser: { ...known, ...c.otherUser } } : c;
      }),
    []
  );

  const load = useCallback(
    async (isRefresh = false) => {
      if (!userId) return;

      if (isRefresh) setRefreshing(true);
      try {
        const page = await chatApi.fetchConversations();
        if (!mounted.current) return;

        rememberProfiles(page.items);
        setConversations(page.items);
        setNextCursor(page.nextCursor);
        setError(null);
        void writeCachedConversations(page.items);
      } catch (err: any) {
        if (!mounted.current) return;
        // A cached list is already on screen; surface the error without wiping it.
        setError(err?.response?.data?.error || "Couldn't load chats");
      } finally {
        if (mounted.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [userId, rememberProfiles]
  );

  // Cache first, so the list paints immediately.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    void readCachedConversations().then((cached) => {
      if (cancelled || !cached.length) return;
      rememberProfiles(cached);
      setConversations((current) => (current.length ? current : cached));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [userId, rememberProfiles]);

  useEffect(() => {
    void load();
  }, [load]);

  // Live updates.
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToConversations(
      userId,
      (live) => {
        if (!mounted.current) return;
        const merged = hydrate(live);
        setConversations(merged);
        void writeCachedConversations(merged);

        // A conversation the listener knows but REST hasn't named yet.
        const unnamed = merged.some((c) => c.otherUser && !c.otherUser.name);
        if (unnamed) void load();
      },
      () => {
        // Permission-denied here almost always means firestore.rules is not
        // deployed yet. REST still works, so fall back to it silently.
        void load();
      }
    );

    return unsubscribe;
  }, [userId, hydrate, load]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;

    setLoadingMore(true);
    try {
      const page = await chatApi.fetchConversations(nextCursor);
      if (!mounted.current) return;

      rememberProfiles(page.items);
      setConversations((current) => {
        const seen = new Set(current.map((c) => c.id));
        return [...current, ...page.items.filter((c) => !seen.has(c.id))];
      });
      setNextCursor(page.nextCursor);
    } catch {
      /* keep what we have */
    } finally {
      if (mounted.current) setLoadingMore(false);
    }
  }, [nextCursor, loadingMore, rememberProfiles]);

  const remove = useCallback(async (conversationId: string) => {
    setConversations((current) => current.filter((c) => c.id !== conversationId));
    try {
      await chatApi.deleteConversation(conversationId);
    } catch {
      void load(); // restore truth if the delete failed
    }
  }, [load]);

  const setMuted = useCallback(async (conversationId: string, muted: boolean) => {
    setConversations((current) =>
      current.map((c) => (c.id === conversationId ? { ...c, isMuted: muted } : c))
    );
    try {
      await chatApi.updateConversationSettings(conversationId, { muted });
    } catch {
      void load();
    }
  }, [load]);

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    [conversations]
  );

  // Publish for the Messages tab badge (see services/chatBadge.ts).
  useEffect(() => {
    setUnreadTotal(totalUnread);
  }, [totalUnread]);

  return {
    conversations,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore: Boolean(nextCursor),
    totalUnread,
    refresh: () => load(true),
    loadMore,
    remove,
    setMuted,
  };
};

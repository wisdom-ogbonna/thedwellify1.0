import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

import * as chatApi from "./chatApi";
import type { Message, ReplyPreview } from "./chatTypes";

/**
 * Offline send queue.
 *
 * A tapped Send must never be lost, and must never produce a duplicate when the
 * network returns mid-flight. Each item carries a clientMessageId which the API
 * uses as the message document id, so a replayed send is idempotent server-side
 * (see persistMessage in chatController.js).
 *
 * Follows the same shape as the proven offline queue in services/locationTracker.ts:
 * AsyncStorage-backed items, a NetInfo listener, and a single-flight drain.
 */

const QUEUE_KEY = "@chat_outbox";
const MAX_ATTEMPTS = 5;

export interface OutboxItem {
  clientMessageId: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  kind: "text" | "media" | "property";
  text?: string;
  replyTo?: ReplyPreview | null;
  propertyCard?: Record<string, unknown> | null;
  file?: chatApi.UploadableFile;
  caption?: string;
  createdAt: number;
  attempts: number;
  lastError?: string;
  failed?: boolean;
  /** 0–1 while a media upload is in flight. */
  progress?: number;
}

let queue: OutboxItem[] = [];
let hydrated = false;
let draining = false;
let isConnected = true;
let netInfoUnsubscribe: (() => void) | null = null;

type Listener = (items: OutboxItem[]) => void;
const listeners = new Set<Listener>();

/** Monotonic, collision-resistant, and valid as a Firestore document id. */
let counter = 0;
export const newClientMessageId = () => {
  counter = (counter + 1) % 100000;
  return `c${Date.now().toString(36)}${counter.toString(36)}${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

const notify = () => {
  const snapshot = [...queue];
  listeners.forEach((fn) => fn(snapshot));
};

const persist = async () => {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.log("outbox persist failed:", (error as Error).message);
  }
};

const hydrate = async () => {
  if (hydrated) return;
  hydrated = true;

  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    queue = raw ? (JSON.parse(raw) as OutboxItem[]) : [];
  } catch {
    queue = [];
  }

  notify();
};

/** Renders a queued item as a Message so the thread can show it immediately. */
export const outboxToMessage = (item: OutboxItem): Message => ({
  id: item.clientMessageId,
  conversationId: item.conversationId,
  clientMessageId: item.clientMessageId,
  senderId: item.senderId,
  receiverId: item.receiverId,
  text: item.text ?? item.caption ?? "",
  type: item.kind === "media" ? (item.file?.mimeType?.startsWith("image/") ? "image" : "file") : item.kind === "property" ? "property" : "text",
  status: item.failed ? "failed" : "sending",
  read: false,
  propertyCard: item.propertyCard ?? null,
  replyTo: item.replyTo ?? null,
  mediaType: item.kind === "media" ? (item.file?.mimeType?.startsWith("image/") ? "image" : "file") : null,
  mediaUrl: null,
  mediaPath: null,
  localUri: item.file?.uri ?? null,
  mimeType: item.file?.mimeType ?? null,
  fileName: item.file?.name ?? null,
  fileSize: null,
  width: item.file?.width ?? null,
  height: item.file?.height ?? null,
  deletedFor: [],
  createdAt: item.createdAt,
  deliveredAt: null,
  readAt: null,
  error: item.lastError,
});

const sendOne = async (item: OutboxItem) => {
  switch (item.kind) {
    case "text":
      await chatApi.sendTextMessage(item.conversationId, {
        text: item.text ?? "",
        clientMessageId: item.clientMessageId,
        replyTo: item.replyTo ?? undefined,
      });
      return;

    case "property":
      await chatApi.sendPropertyMessage(item.conversationId, {
        clientMessageId: item.clientMessageId,
        propertyCard: item.propertyCard ?? {},
        text: item.text,
      });
      return;

    case "media":
      if (!item.file) throw new Error("Missing file");
      await chatApi.uploadMedia(item.conversationId, item.file, {
        clientMessageId: item.clientMessageId,
        caption: item.caption,
        onProgress: (fraction) => {
          // Report in ~10% steps; every chunk would thrash the thread's renders.
          const stepped = Math.min(1, Math.round(fraction * 10) / 10);
          const current = queue.find(
            (q) => q.clientMessageId === item.clientMessageId
          );
          if (!current || current.progress === stepped) return;

          queue = queue.map((q) =>
            q.clientMessageId === item.clientMessageId
              ? { ...q, progress: stepped }
              : q
          );
          notify();
        },
      });
      return;
  }
};

/** A 4xx (other than 408/429) will never succeed on retry. */
const isPermanent = (error: any) => {
  const status = error?.response?.status;
  if (!status) return false;
  if (status === 408 || status === 429) return false;
  return status >= 400 && status < 500;
};

export const flushOutbox = async () => {
  await hydrate();

  if (draining || !isConnected) return;
  draining = true;

  try {
    // Oldest first, so ordering within a thread is preserved.
    const pending = [...queue].sort((a, b) => a.createdAt - b.createdAt);

    for (const item of pending) {
      if (item.failed) continue;

      try {
        await sendOne(item);
        queue = queue.filter((q) => q.clientMessageId !== item.clientMessageId);
        await persist();
        notify();
      } catch (error: any) {
        const permanent = isPermanent(error);
        const attempts = item.attempts + 1;

        queue = queue.map((q) =>
          q.clientMessageId === item.clientMessageId
            ? {
                ...q,
                attempts,
                lastError:
                  error?.response?.data?.error || error?.message || "Send failed",
                failed: permanent || attempts >= MAX_ATTEMPTS,
              }
            : q
        );
        await persist();
        notify();

        // Stop on a transient failure — the network is likely gone, and continuing
        // would burn through every queued item's retry budget at once.
        if (!permanent) break;
      }
    }
  } finally {
    draining = false;
  }
};

export const enqueue = async (
  item: Omit<OutboxItem, "createdAt" | "attempts">
) => {
  await hydrate();

  queue = [...queue, { ...item, createdAt: Date.now(), attempts: 0 }];
  await persist();
  notify();

  void flushOutbox();
};

export const retryItem = async (clientMessageId: string) => {
  await hydrate();
  queue = queue.map((q) =>
    q.clientMessageId === clientMessageId
      ? { ...q, failed: false, attempts: 0, lastError: undefined }
      : q
  );
  await persist();
  notify();
  void flushOutbox();
};

export const discardItem = async (clientMessageId: string) => {
  await hydrate();
  queue = queue.filter((q) => q.clientMessageId !== clientMessageId);
  await persist();
  notify();
};

export const getOutboxFor = (conversationId: string) =>
  queue.filter((q) => q.conversationId === conversationId);

export const subscribeToOutbox = (listener: Listener) => {
  listeners.add(listener);
  void hydrate().then(() => listener([...queue]));
  return () => {
    listeners.delete(listener);
  };
};

/** Mounted once from app/_layout.tsx. */
export const startOutboxWatcher = () => {
  if (netInfoUnsubscribe) return netInfoUnsubscribe;

  netInfoUnsubscribe = NetInfo.addEventListener((state) => {
    const next = state.isConnected ?? true;
    const reconnected = !isConnected && next;
    isConnected = next;
    if (reconnected) void flushOutbox();
  });

  void flushOutbox();
  return netInfoUnsubscribe;
};

export const stopOutboxWatcher = () => {
  netInfoUnsubscribe?.();
  netInfoUnsubscribe = null;
};

/** Called on logout. */
export const clearOutbox = async () => {
  queue = [];
  hydrated = true;
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
  } catch {
    /* non-fatal */
  }
  notify();
};

import { API } from "./api";
import type {
  Conversation,
  Message,
  Paged,
  Presence,
} from "./chatTypes";

/**
 * REST surface for chat.
 *
 * Every write goes through here. The axios instance in services/api.ts already
 * attaches a fresh Firebase ID token on each request, so nothing here handles auth.
 *
 * Reads are duplicated between this module and services/chatStream.ts on purpose:
 * REST gives a fast first page and history pagination, the Firestore listener
 * gives live updates.
 */

/* ----------------------------- conversations ----------------------------- */

export const startConversation = async (
  productId: string,
  clientId?: string
): Promise<{ conversationId: string; isNew: boolean }> => {
  const { data } = await API.post(
    `/chat/start/${productId}`,
    clientId ? { clientId } : {}
  );
  return { conversationId: data.conversationId, isNew: data.isNew };
};

export const fetchConversations = async (
  cursor?: string | null,
  limit = 20
): Promise<Paged<Conversation>> => {
  const { data } = await API.get("/chat/conversations", {
    params: { limit, ...(cursor ? { cursor } : {}) },
  });
  return {
    items: data.conversations ?? [],
    nextCursor: data.nextCursor ?? null,
    hasMore: Boolean(data.hasMore),
  };
};

export const fetchConversation = async (
  conversationId: string
): Promise<Conversation> => {
  const { data } = await API.get(`/chat/conversations/${conversationId}`);
  return data.conversation;
};

export const deleteConversation = (conversationId: string) =>
  API.delete(`/chat/${conversationId}`);

export const updateConversationSettings = (
  conversationId: string,
  settings: { archived?: boolean; muted?: boolean }
) => API.patch(`/chat/${conversationId}/settings`, settings);

/* -------------------------------- messages -------------------------------- */

export const fetchMessages = async (
  conversationId: string,
  cursor?: string | null,
  limit = 30
): Promise<Paged<Message>> => {
  const { data } = await API.get(`/chat/${conversationId}/messages`, {
    params: { limit, ...(cursor ? { cursor } : {}) },
  });
  return {
    items: data.messages ?? [],
    nextCursor: data.nextCursor ?? null,
    hasMore: Boolean(data.hasMore),
  };
};

export const sendTextMessage = async (
  conversationId: string,
  payload: {
    text: string;
    clientMessageId: string;
    replyTo?: Message["replyTo"];
  }
): Promise<Message> => {
  const { data } = await API.post(`/chat/${conversationId}/messages`, {
    type: "text",
    ...payload,
  });
  return data.message;
};

export const sendPropertyMessage = async (
  conversationId: string,
  payload: {
    clientMessageId: string;
    propertyCard: Record<string, unknown>;
    text?: string;
  }
): Promise<Message> => {
  const { data } = await API.post(`/chat/${conversationId}/messages`, {
    type: "property",
    ...payload,
  });
  return data.message;
};

export interface UploadableFile {
  uri: string;
  name: string;
  mimeType: string;
  width?: number;
  height?: number;
}

export const uploadMedia = async (
  conversationId: string,
  file: UploadableFile,
  opts: {
    clientMessageId: string;
    caption?: string;
    onProgress?: (fraction: number) => void;
  }
): Promise<Message[]> => {
  const form = new FormData();

  // React Native's FormData takes this {uri,name,type} shape rather than a Blob.
  form.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.mimeType,
  } as unknown as Blob);

  form.append("clientMessageId", opts.clientMessageId);
  if (opts.caption) form.append("caption", opts.caption);
  if (file.width) form.append("width", String(file.width));
  if (file.height) form.append("height", String(file.height));

  const { data } = await API.post(`/chat/${conversationId}/media`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (opts.onProgress && event.total) {
        opts.onProgress(event.loaded / event.total);
      }
    },
  });

  return data.messages ?? [];
};

export const deleteMessage = (
  conversationId: string,
  messageId: string,
  forEveryone = false
) =>
  API.delete(`/chat/${conversationId}/messages/${messageId}`, {
    params: forEveryone ? { forEveryone: "true" } : undefined,
  });

/**
 * Messages arriving over the Firestore listener carry a mediaPath but no signed
 * URL (signing needs the admin credential). Exchange paths for short-lived URLs.
 */
export const signMediaPaths = async (
  conversationId: string,
  paths: string[]
): Promise<Record<string, string>> => {
  if (!paths.length) return {};
  const { data } = await API.post(`/chat/${conversationId}/media/sign`, { paths });
  return data.urls ?? {};
};

/* -------------------------------- receipts -------------------------------- */

export const markDelivered = (conversationId: string, messageIds?: string[]) =>
  API.post(`/chat/${conversationId}/delivered`, messageIds ? { messageIds } : {});

export const markRead = (conversationId: string) =>
  API.patch(`/chat/${conversationId}/read`);

export const fetchUnreadTotal = async (): Promise<number> => {
  const { data } = await API.get("/chat/unread-count");
  return data.total ?? 0;
};

/* -------------------------------- presence -------------------------------- */

export const sendHeartbeat = (conversationId?: string | null, online = true) =>
  API.post("/chat/presence/heartbeat", { conversationId, online });

export const clearOpenThread = () => API.post("/chat/presence/blur");

export const fetchPresence = async (userId: string): Promise<Presence> => {
  const { data } = await API.get(`/chat/presence/${userId}`);
  return data.presence;
};

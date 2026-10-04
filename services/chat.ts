import { API } from "./api";

export type ChatPerson = {
  id: string;
  name: string;
  agencyName?: string;
};

export type ChatProperty = {
  id: string;
  title: string;
  image?: string;
  location?: string;
  price?: string | number;
  purpose?: string;
  propertyType?: string;
};

export type Conversation = {
  id: string;
  productId: string;
  agentId: string;
  clientId: string;
  property: ChatProperty | null;
  agent: ChatPerson | null;
  client: ChatPerson | null;
  lastMessage: string;
  lastMessageAt: string | null;
  lastSenderId: string | null;
  unreadCount: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ChatMessageStatus = "pending" | "sent" | "delivered" | "read" | "failed";

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: "agent" | "client" | string;
  text: string;
  type?: string;
  nonce?: string | null;
  status?: ChatMessageStatus;
  deliveredAt?: string | null;
  readAt?: string | null;
  createdAt: string;
};

export const chatApi = {
  start: async (productId: string) => {
    const res = await API.post<Conversation>("/chat/conversations", { productId });
    return res.data;
  },

  list: async () => {
    const res = await API.get<{ conversations: Conversation[]; total: number }>(
      "/chat/conversations",
    );
    return res.data?.conversations || [];
  },

  get: async (id: string) => {
    const res = await API.get<Conversation>(`/chat/conversations/${id}`);
    return res.data;
  },

  messages: async (id: string) => {
    const res = await API.get<{ messages: ChatMessage[] }>(
      `/chat/conversations/${id}/messages`,
    );
    return res.data?.messages || [];
  },

  send: async (id: string, text: string, nonce?: string) => {
    const res = await API.post<ChatMessage>(`/chat/conversations/${id}/messages`, {
      text,
      nonce,
    });
    return res.data;
  },

  markRead: async (id: string) => {
    const res = await API.post<Conversation>(`/chat/conversations/${id}/read`);
    return res.data;
  },
};

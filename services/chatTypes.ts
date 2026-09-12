/**
 * Shared chat types.
 *
 * All timestamps crossing into the app are epoch milliseconds (numbers). The API
 * normalizes them, and services/chatStream.ts converts Firestore Timestamps at
 * the boundary, so no `{_seconds,_nanoseconds}` shape ever reaches a component.
 */

export type MessageType = "text" | "image" | "file" | "property" | "system";

/** "sending"/"failed" are local-only states for queued outbox messages. */
export type MessageStatus = "sending" | "failed" | "sent" | "delivered" | "read";

export interface ChatUser {
  id: string;
  name: string;
  role: "agent" | "client" | null;
  phone: string | null;
  verified: boolean;
  agencyName: string | null;
  avatar: string | null;
  isOnline?: boolean;
  lastSeen?: number | null;
}

export interface ReplyPreview {
  id: string;
  text: string;
  senderId: string;
  type: MessageType;
}

export interface Message {
  id: string;
  conversationId: string;
  clientMessageId: string | null;
  senderId: string;
  receiverId: string;
  text: string;
  type: MessageType;
  status: MessageStatus;
  read: boolean;
  propertyCard: Record<string, unknown> | null;
  replyTo: ReplyPreview | null;
  mediaType: "image" | "file" | null;
  /** Signed, expiring URL. Null until resolved, or if signing failed. */
  mediaUrl: string | null;
  /** Storage object path, used to re-sign an expired mediaUrl. */
  mediaPath?: string | null;
  /** Local file URI for an outbox message not yet uploaded. */
  localUri?: string | null;
  mimeType: string | null;
  fileName: string | null;
  fileSize: number | null;
  width: number | null;
  height: number | null;
  deletedFor: string[];
  deletedForEveryone?: boolean;
  createdAt: number | null;
  deliveredAt: number | null;
  readAt: number | null;
  /** Set on outbox messages whose send failed, for the retry affordance. */
  error?: string;
}

export interface Conversation {
  id: string;
  productId: string;
  productTitle: string | null;
  productImage: string | null;
  productPrice: string | number | null;
  productLocation: string | null;
  agentId: string;
  clientId: string;
  otherUser: ChatUser | null;
  lastMessage: string | null;
  lastMessageType: MessageType | null;
  lastMessageAt: number | null;
  lastMessageSenderId: string | null;
  unreadCount: number;
  isArchived: boolean;
  isMuted: boolean;
  createdAt: number | null;
  updatedAt: number | null;
}

export interface Presence {
  isOnline: boolean;
  lastSeen: number | null;
}

export interface Paged<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

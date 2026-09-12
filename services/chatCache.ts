import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Conversation, Message } from "./chatTypes";

/**
 * Cold-start / offline cache.
 *
 * The Firebase JS SDK's persistent cache is IndexedDB-backed and IndexedDB does
 * not exist in React Native, so Firestore's own offline persistence cannot be
 * enabled here (see config/firebase.ts). Without this module, opening the app
 * without a network shows an empty chat list and an empty thread.
 *
 * Bounded on purpose: a conversation list snapshot plus the tail of each thread.
 */

const CONVERSATIONS_KEY = "@chat_conversations";
const messagesKey = (conversationId: string) => `@chat_messages:${conversationId}`;
const MAX_CACHED_MESSAGES = 50;
const MAX_CACHED_CONVERSATIONS = 50;

export const readCachedConversations = async (): Promise<Conversation[]> => {
  try {
    const raw = await AsyncStorage.getItem(CONVERSATIONS_KEY);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
};

export const writeCachedConversations = async (conversations: Conversation[]) => {
  try {
    await AsyncStorage.setItem(
      CONVERSATIONS_KEY,
      JSON.stringify(conversations.slice(0, MAX_CACHED_CONVERSATIONS))
    );
  } catch (error) {
    console.log("conversation cache write failed:", (error as Error).message);
  }
};

export const readCachedMessages = async (
  conversationId: string
): Promise<Message[]> => {
  try {
    const raw = await AsyncStorage.getItem(messagesKey(conversationId));
    return raw ? (JSON.parse(raw) as Message[]) : [];
  } catch {
    return [];
  }
};

export const writeCachedMessages = async (
  conversationId: string,
  messages: Message[]
) => {
  try {
    // Keep the newest tail; that is what the thread renders on open.
    await AsyncStorage.setItem(
      messagesKey(conversationId),
      JSON.stringify(messages.slice(-MAX_CACHED_MESSAGES))
    );
  } catch (error) {
    console.log("message cache write failed:", (error as Error).message);
  }
};

export const clearCachedMessages = async (conversationId: string) => {
  try {
    await AsyncStorage.removeItem(messagesKey(conversationId));
  } catch {
    /* non-fatal */
  }
};

/** Called on logout so a shared device does not leak the previous user's chats. */
export const clearAllChatCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const chatKeys = keys.filter(
      (k) => k === CONVERSATIONS_KEY || k.startsWith("@chat_messages:")
    );
    if (chatKeys.length) await AsyncStorage.multiRemove(chatKeys);
  } catch (error) {
    console.log("chat cache clear failed:", (error as Error).message);
  }
};

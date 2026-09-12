import React from "react";

import { ConversationListScreen } from "@/components/chat/conversation-list-screen";

/**
 * Client Messages tab — the real conversation list.
 *
 * The previous implementation was a mock UI (hardcoded chats + a story rail) that
 * never called the chat API. The shared component in components/chat now backs
 * both this and the agent tab, so there is one implementation instead of two
 * near-identical copies.
 */
export default function ClientMessagesScreen() {
  return <ConversationListScreen title="Chats" />;
}

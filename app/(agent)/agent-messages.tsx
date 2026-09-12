import React from "react";

import { ConversationListScreen } from "@/components/chat/conversation-list-screen";

/**
 * Agent Messages tab — the real conversation list.
 *
 * Shares the implementation with the client tab; the conversation list is
 * role-agnostic because the API scopes it by the caller's uid.
 */
export default function AgentMessagesScreen() {
  return <ConversationListScreen title="Messages" />;
}

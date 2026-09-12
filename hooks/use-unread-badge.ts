import { useEffect, useState } from "react";

import { getUnreadTotal, subscribeToUnreadTotal } from "../services/chatBadge";

/**
 * Reads the unread total published by useConversations.
 * Returns undefined when zero, which is what Tabs.Screen `tabBarBadge` expects in
 * order to render nothing.
 */
export const useUnreadBadge = () => {
  const [total, setTotal] = useState(getUnreadTotal());

  useEffect(() => {
    return subscribeToUnreadTotal(setTotal);
  }, []);

  if (!total) return undefined;
  return total > 99 ? "99+" : total;
};

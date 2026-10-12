import { inboxApi } from "@/services/inbox";
import { connectSocket, getSocket } from "@/services/socket";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

type InboxContextType = {
  unreadCount: number;
  refresh: () => Promise<void>;
};

const InboxContext = createContext<InboxContextType>({
  unreadCount: 0,
  refresh: async () => undefined,
});

export function InboxProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      setUnreadCount(await inboxApi.unreadCount());
    } catch {
      // Keep the last count if the request fails.
    }
  }, [user]);

  useEffect(() => {
    refresh();
    if (!user) return;
    let detach: (() => void) | undefined;
    connectSocket()
      .then(() => {
        const socket = getSocket();
        const onNew = () => {
          refresh();
        };
        socket?.on("notification:new", onNew);
        detach = () => socket?.off("notification:new", onNew);
      })
      .catch(() => undefined);
    const timer = setInterval(refresh, 20000);
    return () => {
      clearInterval(timer);
      detach?.();
    };
  }, [refresh, user]);

  const value = useMemo(
    () => ({ unreadCount, refresh }),
    [refresh, unreadCount],
  );

  return (
    <InboxContext.Provider value={value}>{children}</InboxContext.Provider>
  );
}

export const useInbox = () => useContext(InboxContext);

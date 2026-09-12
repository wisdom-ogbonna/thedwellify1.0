import { io, type Socket } from "socket.io-client";
import { auth } from "../config/firebase";

/**
 * Socket.IO client — strictly an accelerator, never a dependency.
 *
 * The API is deployed on Vercel serverless, which cannot hold a persistent
 * websocket, so this will usually fail to connect in production. That is fine:
 * Firestore listeners already deliver messages, typing, and presence. When the
 * backend does run somewhere with real websocket support (Render/Railway/Fly),
 * this starts contributing instant receipts and typing with no other changes.
 *
 * Nothing here throws or blocks. Every consumer must work with the socket absent.
 */

// Derived from the axios baseURL in services/api.ts, minus the /api suffix.
const SOCKET_URL = "https://dwellify-backend-six.vercel.app";

let socket: Socket | null = null;
let connecting = false;

export const getSocket = () => socket;
export const isSocketConnected = () => Boolean(socket?.connected);

export const connectSocket = async (): Promise<Socket | null> => {
  if (socket?.connected || connecting) return socket;

  const user = auth.currentUser;
  if (!user) return null;

  connecting = true;

  try {
    const token = await user.getIdToken();

    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      // Give up quickly rather than hanging the UI on a host that cannot upgrade.
      timeout: 8000,
      autoConnect: true,
    });

    socket.on("connect", () => console.log("chat socket connected"));

    socket.on("connect_error", (error) => {
      // Expected on serverless hosting — log quietly and carry on.
      console.log("chat socket unavailable:", error.message);
    });

    // Token expiry mid-session: refresh and reconnect once.
    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        void refreshSocketAuth();
      }
    });

    return socket;
  } catch (error) {
    console.log("connectSocket failed:", (error as Error).message);
    return null;
  } finally {
    connecting = false;
  }
};

const refreshSocketAuth = async () => {
  const user = auth.currentUser;
  if (!user || !socket) return;

  try {
    const token = await user.getIdToken(true);
    socket.auth = { token };
    socket.connect();
  } catch {
    /* leave disconnected; Firestore still covers realtime */
  }
};

export const disconnectSocket = () => {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
};

export const joinConversationRoom = (conversationId: string) => {
  socket?.emit("join_conversation", conversationId);
};

export const leaveConversationRoom = (conversationId: string) => {
  socket?.emit("leave_conversation", conversationId);
};

export const emitTyping = (conversationId: string, isTyping: boolean) => {
  socket?.emit(isTyping ? "typing_start" : "typing_stop", conversationId);
};

/** Subscribe to a socket event, returning a no-op unsubscribe if absent. */
export const onSocketEvent = <T,>(
  event: string,
  handler: (payload: T) => void
) => {
  socket?.on(event, handler as (...args: unknown[]) => void);
  return () => {
    socket?.off(event, handler as (...args: unknown[]) => void);
  };
};

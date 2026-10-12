import { io, type Socket } from "socket.io-client";
import { auth } from "../config/firebase";
import { API } from "./api";

let socket: Socket | null = null;
let connecting: Promise<Socket | null> | null = null;

const socketOrigin = () =>
  String(API.defaults.baseURL || "").replace(/\/api\/?$/, "");

const authPayload = async () => {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { token };
};

export const getSocket = () => socket;

export const isSocketConnected = () => Boolean(socket?.connected);

export const connectSocket = async () => {
  if (socket?.connected) return socket;
  if (connecting) return connecting;

  connecting = (async () => {
    const user = auth.currentUser;
    if (!user) return null;

    const origin = socketOrigin();
    if (!origin) return null;

    if (!socket) {
      socket = io(origin, {
        autoConnect: false,
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 500,
        reconnectionDelayMax: 4000,
        timeout: 12000,
        extraHeaders: {
          "ngrok-skip-browser-warning": "true",
        },
      });
      socket.on("reconnect_attempt", async () => {
        if (socket) socket.auth = await authPayload();
      });
    }

    socket.auth = await authPayload();
    if (!socket.connected) socket.connect();

    if (socket.connected) return socket;

    await new Promise<void>((resolve) => {
      const done = () => {
        socket?.off("connect", done);
        socket?.off("connect_error", done);
        resolve();
      };
      socket?.once("connect", done);
      socket?.once("connect_error", done);
      setTimeout(done, 8000);
    });

    return socket;
  })();

  try {
    return await connecting;
  } finally {
    connecting = null;
  }
};

export const disconnectSocket = () => {
  connecting = null;
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
};

export const joinConversation = async (conversationId: string) => {
  const live = await connectSocket();
  if (!live?.connected || !conversationId) {
    return { ok: false, peerOnline: false };
  }
  return await new Promise<{ ok: boolean; peerOnline?: boolean }>((resolve) => {
    let done = false;
    const finish = (value: { ok: boolean; peerOnline?: boolean }) => {
      if (done) return;
      done = true;
      resolve(value);
    };
    live.emit("conversation:join", conversationId, (res: any) => {
      finish(res || { ok: false, peerOnline: false });
    });
    setTimeout(() => finish({ ok: false, peerOnline: false }), 4000);
  });
};

export const leaveConversation = (conversationId: string) => {
  if (!conversationId || !socket?.connected) return;
  socket.emit("conversation:leave", conversationId);
};

export const emitTyping = (conversationId: string, isTyping: boolean) => {
  if (!conversationId || !socket?.connected) return;
  socket.emit("typing", { conversationId, isTyping });
};

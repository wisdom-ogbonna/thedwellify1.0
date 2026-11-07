import { io, type Socket } from "socket.io-client";
import { AppState, type AppStateStatus } from "react-native";
import { auth } from "../config/firebase";
import { API } from "./api";
import type { ChatMessage } from "./chat";

let socket: Socket | null = null;
let connecting: Promise<Socket | null> | null = null;
let appStateBound = false;

const socketOrigin = () =>
  String(API.defaults.baseURL || "").replace(/\/api\/?$/, "");

const authPayload = async () => {
  const user = auth.currentUser;
  if (!user) return {};
  try {
    const token = await user.getIdToken();
    return { token };
  } catch {
    return {};
  }
};

export const getSocket = () => socket;

export const isSocketConnected = () => Boolean(socket?.connected);

const bindAppState = () => {
  if (appStateBound) return;
  appStateBound = true;
  AppState.addEventListener("change", (state: AppStateStatus) => {
    if (state === "active" && auth.currentUser) {
      connectSocket().catch(() => undefined);
    }
  });
};

export const connectSocket = async () => {
  if (socket?.connected) return socket;
  if (connecting) return connecting;

  connecting = (async () => {
    const user = auth.currentUser;
    if (!user) return null;

    const origin = socketOrigin();
    if (!origin) return null;

    bindAppState();

    if (!socket) {
      socket = io(origin, {
        autoConnect: false,
        transports: ["polling", "websocket"],
        upgrade: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 400,
        reconnectionDelayMax: 3000,
        timeout: 15000,
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
      setTimeout(done, 6000);
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

export const sendLiveMessage = (
  conversationId: string,
  text: string,
  nonce: string,
): Promise<ChatMessage> =>
  new Promise((resolve, reject) => {
    const live = socket;
    if (!live?.connected) {
      reject(new Error("socket_offline"));
      return;
    }
    let settled = false;
    const finish = (err: Error | null, message?: ChatMessage) => {
      if (settled) return;
      settled = true;
      if (err || !message) reject(err || new Error("send_failed"));
      else resolve(message);
    };
    live.emit(
      "message:send",
      { conversationId, text, nonce },
      (res: { ok?: boolean; message?: ChatMessage; error?: string }) => {
        if (res?.ok && res.message) finish(null, res.message);
        else finish(new Error(res?.error || "send_failed"));
      },
    );
    setTimeout(() => finish(new Error("socket_timeout")), 5000);
  });

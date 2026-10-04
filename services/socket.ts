type Handler = (...args: any[]) => void;

const listeners = new Map<string, Set<Handler>>();

const bus = {
  connected: true,
  on(event: string, handler: Handler) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)?.add(handler);
    return bus;
  },
  off(event: string, handler?: Handler) {
    if (!handler) {
      listeners.delete(event);
      return bus;
    }
    listeners.get(event)?.delete(handler);
    return bus;
  },
  emit(_event: string, ..._args: any[]) {
    return bus;
  },
  removeAllListeners() {
    listeners.clear();
    return bus;
  },
  disconnect() {
    return bus;
  },
};

export const getSocket = () => bus;

export const connectSocket = async () => bus;

export const disconnectSocket = () => {
  listeners.clear();
};

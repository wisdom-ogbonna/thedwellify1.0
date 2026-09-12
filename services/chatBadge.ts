/**
 * Unread-count store for the Messages tab badge.
 *
 * The tab badge lives in app/(client)/_layout.tsx and app/(agent)/_layout.tsx,
 * which are mounted above the screens that own the conversation listener. Rather
 * than opening a second Firestore listener just for a number, useConversations
 * publishes its total here and the layouts subscribe.
 */

let total = 0;
const listeners = new Set<(value: number) => void>();

export const setUnreadTotal = (value: number) => {
  const next = Math.max(0, value);
  if (next === total) return;

  total = next;
  listeners.forEach((fn) => fn(total));
};

export const getUnreadTotal = () => total;

export const subscribeToUnreadTotal = (listener: (value: number) => void) => {
  listeners.add(listener);
  listener(total);
  return () => {
    listeners.delete(listener);
  };
};

export const resetUnreadTotal = () => setUnreadTotal(0);

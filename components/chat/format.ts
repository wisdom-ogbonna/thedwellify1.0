/**
 * Date/time formatting for chat, matching common messenger conventions.
 * All inputs are epoch millis (see services/chatTypes.ts).
 */

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (ms: number) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** "9:41 AM" */
export const formatTime = (ms?: number | null) => {
  if (!ms) return "";
  return new Date(ms).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

/** Row timestamp: time today, "Yesterday", weekday this week, else date. */
export const formatListTimestamp = (ms?: number | null) => {
  if (!ms) return "";

  const today = startOfDay(Date.now());
  const then = startOfDay(ms);
  const diffDays = Math.round((today - then) / DAY_MS);

  if (diffDays <= 0) return formatTime(ms);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return new Date(ms).toLocaleDateString([], { weekday: "short" });

  return new Date(ms).toLocaleDateString([], { day: "numeric", month: "short" });
};

/** Separator label between day groups. */
export const formatDateSeparator = (ms?: number | null) => {
  if (!ms) return "";

  const today = startOfDay(Date.now());
  const then = startOfDay(ms);
  const diffDays = Math.round((today - then) / DAY_MS);

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return new Date(ms).toLocaleDateString([], { weekday: "long" });

  return new Date(ms).toLocaleDateString([], {
    day: "numeric",
    month: "long",
    year: then < startOfDay(Date.now() - 365 * DAY_MS) ? "numeric" : undefined,
  });
};

/** "Online" / "Last seen just now" / "Last seen 5m ago" / "Last seen yesterday" */
export const formatPresence = (
  isOnline: boolean,
  lastSeen?: number | null
): string => {
  if (isOnline) return "Online";
  if (!lastSeen) return "";

  const diff = Date.now() - lastSeen;

  if (diff < 60_000) return "Last seen just now";
  if (diff < 60 * 60_000) return `Last seen ${Math.floor(diff / 60_000)}m ago`;
  if (diff < DAY_MS) return `Last seen ${Math.floor(diff / (60 * 60_000))}h ago`;
  if (diff < 2 * DAY_MS) return "Last seen yesterday";

  return `Last seen ${new Date(lastSeen).toLocaleDateString([], {
    day: "numeric",
    month: "short",
  })}`;
};

/** True when `current` starts a new calendar day relative to `previous`. */
export const startsNewDay = (
  current?: number | null,
  previous?: number | null
) => {
  if (!current) return false;
  if (!previous) return true;
  return startOfDay(current) !== startOfDay(previous);
};

/** Initials for the avatar fallback — no profile in Dwellify stores a photo. */
export const initialsOf = (name?: string | null) => {
  if (!name) return "?";

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

/** Deterministic hue per user so an avatar keeps the same colour everywhere. */
export const colorForId = (id?: string | null) => {
  const palette = [
    "#2563EB",
    "#7C3AED",
    "#DB2777",
    "#DC2626",
    "#EA580C",
    "#059669",
    "#0891B2",
    "#4F46E5",
  ];

  if (!id) return palette[0];

  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 100000;
  }

  return palette[hash % palette.length];
};

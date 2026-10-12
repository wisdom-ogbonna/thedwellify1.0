import { API } from "./api";

export type InboxStatus = "unattended" | "attended";

export type InboxItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  actorId: string;
  actorName: string;
  actorAvatar: string;
  data: Record<string, string>;
  status: InboxStatus;
  createdAt: string | null;
  attendedAt: string | null;
};

export type InboxResponse = {
  success: boolean;
  unreadCount: number;
  unattended: InboxItem[];
  attended: InboxItem[];
  notifications: InboxItem[];
};

export const inboxApi = {
  list: async () => {
    const res = await API.get<InboxResponse>("/notifications/inbox");
    return res.data;
  },

  unreadCount: async () => {
    const res = await API.get<{ unreadCount: number }>(
      "/notifications/inbox/unread-count",
    );
    return Number(res.data?.unreadCount || 0);
  },

  attend: async (id: string) => {
    const res = await API.post(`/notifications/inbox/${id}/attend`);
    return res.data;
  },

  attendAll: async () => {
    const res = await API.post("/notifications/inbox/attend-all");
    return res.data;
  },
};

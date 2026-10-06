import { API } from "./api";
import type { PickedMedia } from "./media-picker";

export const agentApi = {
  profile: async () => {
    const res = await API.get("/agent/profile");
    return res.data;
  },

  uploadAvatar: async (file: PickedMedia) => {
    const form = new FormData();
    form.append("avatar", {
      uri: file.uri,
      name: file.name || "avatar.jpg",
      type: file.type || "image/jpeg",
    } as any);
    const res = await API.post("/agent/profile/avatar", form);
    return res.data as { success: boolean; avatar: string; message?: string };
  },
};

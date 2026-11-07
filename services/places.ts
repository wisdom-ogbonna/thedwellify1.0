import {
  STATE_NAMES,
  lgasForState,
} from "@/constants/nigeria-locations";
import { API } from "@/services/api";

export const placesApi = {
  states: async () => {
    try {
      const res = await API.get<{ states: string[] }>("/location/states", {
        skipErrorLog: true,
      });
      if (Array.isArray(res.data?.states) && res.data.states.length) {
        return res.data.states;
      }
    } catch {
      // Use the bundled Nigeria list until the backend is deployed.
    }
    return STATE_NAMES;
  },

  lgas: async (state: string) => {
    if (!state) return [];
    try {
      const res = await API.get<{ state: string; lgas: string[] }>(
        "/location/lgas",
        { params: { state }, skipErrorLog: true },
      );
      if (Array.isArray(res.data?.lgas) && res.data.lgas.length) {
        return res.data.lgas;
      }
    } catch {
      // Use the bundled Nigeria list until the backend is deployed.
    }
    return lgasForState(state);
  },
};

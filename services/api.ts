import axios from "axios";
import { auth } from "../config/firebase";

// ✅ Create Axios instance
export const API = axios.create({

  baseURL: "https://dwellify-backend-bq39.onrender.com/api",
  timeout: 15000,
});


// ✅ Attach Firebase token automatically (AUTO REFRESH 🔥)
API.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;

      if (user) {

        const token = await user.getIdToken(); // 🔥 AUTO REFRESH HERE
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    } catch (error) {
      console.log("Request interceptor error:", error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ Handle global response errors
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log("Unauthorized - user may be logged out");

      // ❗ DO NOT clear AsyncStorage blindly anymore
      // Firebase manages session, not you

      // OPTIONAL: you can trigger logout from context if needed
    }

    return Promise.reject(error);
  }
);


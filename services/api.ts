import axios from "axios";
import { auth } from "../config/firebase";

export const API = axios.create({
  baseURL: "https://dwellify-backend-six.vercel.app/api",
  timeout: 120000,
});

API.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;

    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API request failed:", {
      message: error.message,
      code: error.code,
      baseURL: error.config?.baseURL,
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      response: error.response?.data,
    });

    if (error.response?.status === 401) {
      console.warn("Unauthorized: check Firebase authentication.");
    }

    return Promise.reject(error);
  },
);

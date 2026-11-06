import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosError } from "axios";
import { auth } from "../config/firebase";

declare module "axios" {
  interface AxiosRequestConfig {
    skipErrorLog?: boolean;
  }
}

export const API = axios.create({
  baseURL: "https://dwellify-backend-six.vercel.app/api",
  timeout: 120000,
});

const isNetworkFailure = (error: AxiosError) =>
  !error.response &&
  (error.code === "ERR_NETWORK" ||
    error.code === "ECONNABORTED" ||
    error.message === "Network Error");

API.interceptors.request.use(
  async (config) => {
    if (config.headers?.Authorization) {
      return config;
    }

    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      }
    } catch {
      // Headless / offline token refresh often fails. Use the cached token.
    }

    const stored = await AsyncStorage.getItem("@secure_auth_token");
    if (stored) {
      config.headers.Authorization = `Bearer ${stored}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

API.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (!error.config?.skipErrorLog && !isNetworkFailure(error)) {
      console.error("API request failed:", {
        message: error.message,
        code: error.code,
        baseURL: error.config?.baseURL,
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        response: error.response?.data,
      });
    }

    if (error.response?.status === 401) {
      console.warn("Unauthorized: check Firebase authentication.");
    }

    return Promise.reject(error);
  },
);

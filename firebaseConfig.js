// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";

const app = initializeApp({
  apiKey: "AIzaSyAZg4h_fbaslTTIn3FRlhrXwdYb4WEHNL8",
  authDomain: "dwellify-dbbd6.firebaseapp.com",
  projectId: "dwellify-dbbd6",
  storageBucket: "dwellify-dbbd6.firebasestorage.app",
  messagingSenderId: "696670443433",
  appId: "1:696670443433:web:937fecaa8ffc3b4080d6b8",
});

// Use SecureStore instead of AsyncStorage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(),
});

export { auth };

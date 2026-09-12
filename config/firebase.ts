import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp, getApps } from "firebase/app";
import { initializeAuth, getAuth } from "firebase/auth";
import { initializeFirestore, memoryLocalCache } from "firebase/firestore";

// React Native persistence lives on the RN build of @firebase/auth.
// The web typings for `firebase/auth` intentionally omit this export.
// @ts-expect-error RN-only export
import { getReactNativePersistence } from "@firebase/auth/dist/rn/index.js";

const firebaseConfig = {
  apiKey: "AIzaSyAZg4h_fbaslTTIn3FRlhrXwdYb4WEHNL8",
  authDomain: "dwellify-dbbd6.firebaseapp.com",
  projectId: "dwellify-dbbd6",
  storageBucket: "dwellify-dbbd6.firebasestorage.app",
  messagingSenderId: "696670443433",
  appId: "1:696670443433:web:937fecaa8ffc3b4080d6b8",
};

const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Already initialized (Fast Refresh / hot reload)
  authInstance = getAuth(app);
}

export const auth = authInstance;

/**
 * Firestore is used read-only from the app: onSnapshot drives realtime chat, and
 * every write still goes through the Express API. See firestore.rules.
 *
 * - experimentalAutoDetectLongPolling: React Native's networking stack does not
 *   reliably support the default streaming transport.
 * - memoryLocalCache: IndexedDB persistence is unavailable in React Native;
 *   cold-start/offline reads come from services/chatCache.ts instead.
 */
export const firestore = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  localCache: memoryLocalCache(),
});

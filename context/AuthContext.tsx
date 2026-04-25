import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API } from "../services/api";

import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "../config/firebase";

/* =========================
   TYPES
========================= */
type UserType = {
  uid: string;
  phone?: string;
};

type RoleType = "agent" | "client";

type AuthContextType = {
  user: UserType | null;
  role: RoleType | null;
  isVerified: boolean;
  loading: boolean;
  isOnline: boolean;

  login: (data: { uid: string; phone?: string }) => Promise<void>;
  setUserRole: (role: RoleType) => Promise<void>;
  checkProfile: (roleParam?: RoleType) => Promise<void>;
  logout: () => Promise<void>;

  goOnline: () => Promise<void>;
  goOffline: () => Promise<void>;
};

/* =========================
   CONTEXT
========================= */
const AuthContext = createContext<AuthContextType>({} as AuthContextType);

/* =========================
   PROVIDER
========================= */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [role, setRole] = useState<RoleType | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  /* =========================
     AUTH STATE LISTENER
  ========================= */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: User | null) => {
        try {
          setLoading(true);

          if (firebaseUser) {
            // 🔐 Firebase user (source of truth)
            const userData: UserType = {
              uid: firebaseUser.uid,
              phone: firebaseUser.phoneNumber || "",
            };

            setUser(userData);

            const storedStatus = await AsyncStorage.getItem("isOnline");

            if (storedStatus === "true") {
              setIsOnline(true);
            } else {
              setIsOnline(false);
            }

            // 📦 Load stored role
            const storedRole = await AsyncStorage.getItem("role");

            if (storedRole) {
              const roleValue = storedRole as RoleType;
              setRole(roleValue);

              // ✅ IMPORTANT: pass role directly (avoid race condition)
              await checkProfile(roleValue);
            } else {
              setRole(null);
              setIsVerified(false);
            }
          } else {
            // 🚪 No user
            setUser(null);
            setRole(null);
            setIsVerified(false);
          }
        } catch (error) {
          console.log("Auth state error:", error);
        } finally {
          setLoading(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  /* =========================
     LOGIN (AFTER FIREBASE AUTH)
  ========================= */
  const login = async ({ uid, phone }: { uid: string; phone?: string }) => {
    // ⚠️ No need to store user in AsyncStorage anymore
    setUser({ uid, phone });
    setRole(null);
    setIsVerified(false);
  };

  /* =========================
     SET ROLE
  ========================= */
  const setUserRole = async (role: RoleType) => {
    await AsyncStorage.setItem("role", role);
    setRole(role);
  };

  /* =========================
     CHECK PROFILE (SECURE)
  ========================= */
  const checkProfile = async (roleParam?: RoleType) => {
    try {
      const roleToUse = roleParam || role;

      if (!roleToUse) return;

      if (roleToUse === "agent") {
        await API.get("/agent/profile");
      } else {
        await API.get("/client/profile");
      }

      setIsVerified(true);
    } catch (error: any) {
      const status = error?.response?.status;

      // 🔐 Token invalid / expired
      if (status === 401) {
        await logout();
        return;
      }

      // 👤 Profile not created yet
      if (status === 404) {
        setIsVerified(false);
        return;
      }

      console.log("Profile check error:", error?.response || error);
      setIsVerified(false);
    }
  };

  /* =========================
   ONLINE / OFFLINE
========================= */
  const goOnline = async () => {
    try {
      await API.post("/location/online");
      setIsOnline(true);
      await AsyncStorage.setItem("isOnline", "true");
    } catch (error) {
      console.log("Go online error:", error);
    }
  };

  const goOffline = async () => {
    try {
      await API.post("/location/offline");
      setIsOnline(false);
      await AsyncStorage.setItem("isOnline", "false");
    } catch (error) {
      console.log("Go offline error:", error);
    }
  };
  /* =========================
     LOGOUT
  ========================= */
const logout = async () => {
  try {
    await API.post("/location/offline"); // 🔴 force offline
    await signOut(auth);
    await AsyncStorage.removeItem("role");
    await AsyncStorage.removeItem("isOnline");
  } catch (error) {
    console.log("Logout error:", error);
  } finally {
    setUser(null);
    setRole(null);
    setIsVerified(false);
    setIsOnline(false);
  }
};

  /* =========================
     PROVIDER VALUE
  ========================= */
  return (
<AuthContext.Provider
  value={{
    user,
    role,
    isVerified,
    loading,
    isOnline,
    login,
    setUserRole,
    checkProfile,
    logout,
    goOnline,
    goOffline,
  }}
>
      {children}
    </AuthContext.Provider>
  );
};

/* =========================
   HOOK
========================= */
export const useAuth = () => useContext(AuthContext);

import { createContext, useContext, useEffect, useState } from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

import { API } from "../services/api";

import { onAuthStateChanged, signOut, User } from "firebase/auth";

import { auth } from "../config/firebase";

import * as Location from "expo-location";

import NetInfo from "@react-native-community/netinfo";

import {
  startLocationTracking,
  stopLocationTracking,
} from "../services/locationTracker";

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

  isConnected: boolean;

  login: (data: { uid: string; phone?: string }) => Promise<void>;

  setUserRole: (role: RoleType) => Promise<void>;

  checkProfile: (role?: RoleType) => Promise<void>;

  logout: () => Promise<void>;

  goOnline: () => Promise<void>;

  goOffline: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserType | null>(null);

  const [role, setRole] = useState<RoleType | null>(null);

  const [isVerified, setIsVerified] = useState(false);

  const [loading, setLoading] = useState(true);

  const [isOnline, setIsOnline] = useState(false);

  const [isConnected, setIsConnected] = useState(true);

  /*
=========================
RESTORE ONLINE STATE
=========================
*/

  const restoreAgentOnline = async () => {
    try {
      const saved = await AsyncStorage.getItem("isOnline");

      if (saved !== "true") return;

      await API.post("/location/online");

      await startLocationTracking();

      setIsOnline(true);

      console.log("Agent restored online");
    } catch (error) {
      console.log("Restore failed", error);

      setIsOnline(false);
    }
  };

  /*
=========================
AUTH LISTENER
=========================
*/

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setLoading(true);

        if (firebaseUser) {
          const data = {
            uid: firebaseUser.uid,

            phone: firebaseUser.phoneNumber || "",
          };

          setUser(data);

          const storedRole = await AsyncStorage.getItem("role");

          if (storedRole) {
            setRole(storedRole as RoleType);

            await checkProfile(storedRole as RoleType);
          }

          await restoreAgentOnline();
        } else {
          setUser(null);

          setRole(null);

          setIsVerified(false);
        }
      } catch (error) {
        console.log("Auth error", error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  /*
=========================
NETWORK LISTENER
=========================
*/

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected ?? false;

      setIsConnected(online);

      if (!online) {
        console.log("Internet lost");

        stopLocationTracking();

        setIsOnline(false);
      } else {
        console.log("Internet restored");

        restoreAgentOnline();
      }
    });

    return unsubscribe;
  }, []);

  /*
=========================
LOGIN
=========================
*/

  const login = async ({ uid, phone }: { uid: string; phone?: string }) => {
    setUser({
      uid,
      phone,
    });
  };

  /*
=========================
ROLE
=========================
*/

  const setUserRole = async (role: RoleType) => {
    await AsyncStorage.setItem("role", role);

    setRole(role);
  };

  /*
=========================
PROFILE CHECK
=========================
*/

  const checkProfile = async (roleParam?: RoleType) => {
    try {
      const current = roleParam || role;

      if (!current) return;

      if (current === "agent") {
        await API.get("/agent/profile");
      } else {
        await API.get("/client/profile");
      }

      setIsVerified(true);
    } catch (error: any) {
      const status = error?.response?.status;

      if (status === 401) {
        await logout();

        return;
      }

      setIsVerified(false);
    }
  };

  /*
=========================
GO ONLINE
=========================
*/

  const goOnline = async () => {
    try {
      let { status } = await Location.getForegroundPermissionsAsync();

      if (status !== "granted") {
        const result = await Location.requestForegroundPermissionsAsync();

        status = result.status;
      }

      if (status !== "granted") {
        Alert.alert("Permission required", "Enable location access");

        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = location.coords.latitude;

      const lng = location.coords.longitude;

      await API.post("/location/online");

      await API.post("/location/update", {
        lat,
        lng,

        load: 0,

        rating: 5,
      });

      await AsyncStorage.setItem("isOnline", "true");

      setIsOnline(true);

      await startLocationTracking();

      console.log("ONLINE");
    } catch (error) {
      console.log("Online error", error);
    }
  };

  /*
=========================
GO OFFLINE
=========================
*/

  const goOffline = async () => {
    try {
      stopLocationTracking();

      setIsOnline(false);

      await AsyncStorage.setItem("isOnline", "false");

      await API.post("/location/offline");
    } catch (error) {
      console.log("Offline error", error);
    }
  };

  /*
=========================
LOGOUT
=========================
*/

  const logout = async () => {
    try {
      stopLocationTracking();

      await API.post("/location/offline");

      await signOut(auth);

      await AsyncStorage.multiRemove(["role", "isOnline"]);
    } finally {
      setUser(null);

      setRole(null);

      setIsVerified(false);

      setIsOnline(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,

        role,

        isVerified,

        loading,

        isOnline,

        isConnected,

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

export const useAuth = () => useContext(AuthContext);

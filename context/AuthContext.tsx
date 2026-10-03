import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API } from "../services/api";

import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "../config/firebase";
import * as Location from "expo-location";
import {
  startLocationTracking,
  stopLocationTracking,
  bootstrapLocationTracker,
} from "../services/locationTracker";

/* =========================================================================
   TYPES & INTERFACES
   ========================================================================= */
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

  // 🔽 UPDATE THIS LINE to accept the role argument
  login: (data: {
    uid: string;
    phone?: string;
    role: RoleType | null;
  }) => Promise<void>;
  setUserRole: (role: RoleType) => Promise<void>;
  checkProfile: (roleParam?: RoleType) => Promise<void>;
  logout: () => Promise<void>;

  goOnline: () => Promise<void>;
  goOffline: () => Promise<void>;
};

// Internal keys mirroring the locationTracker definitions
const KEYS = {
  TRACKING_STATUS: "@tracker_is_online",
  LAST_LOCATION: "@tracker_last_location",
  SECURE_TOKEN: "@secure_auth_token",
  ROLE: "role",
};

/* =========================================================================
   CONTEXT CREATION
   ========================================================================= */
const AuthContext = createContext<AuthContextType>({} as AuthContextType);

/* =========================================================================
   PROVIDER COMPONENT
   ========================================================================= */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [role, setRole] = useState<RoleType | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  /* =========================================================================
     AUTH STATE LISTENER & RECOVERY ENGINE
     ========================================================================= */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: User | null) => {
        try {
          setLoading(true);

          if (firebaseUser) {
            // 🚀 CRITICAL FIX: Fetch fresh idToken & write to disk for the headless background thread
            const token = await firebaseUser.getIdToken(true);
            await AsyncStorage.setItem(KEYS.SECURE_TOKEN, token);

            const userData: UserType = {
              uid: firebaseUser.uid,
              phone: firebaseUser.phoneNumber || "",
            };
            setUser(userData);

            // Fetch structural storage tracking rules
            const storedStatus = await AsyncStorage.getItem(
              KEYS.TRACKING_STATUS
            );
            const userWantsOnline = storedStatus === "true";

            const storedRole = await AsyncStorage.getItem(KEYS.ROLE);
            const roleValue = storedRole as RoleType;

            if (roleValue) {
              setRole(roleValue);
              await checkProfile(roleValue);

              // 🔄 AUTOMATED BACKGROUND AGENT RESTART RECOVERY STATE HANDSHAKE
              if (roleValue === "agent" && userWantsOnline) {
                try {
                  console.log(
                    "🔄 Recovery engine starting tracker module setup..."
                  );
                  await bootstrapLocationTracker();
                  setIsOnline(true);
                } catch (bootstrapErr: any) {
                  // ✅ FIX: Catch the backend rejection safely here so it doesn't throw globally!
                  console.log(
                    "⚠️ Background recovery blocked by backend status checks:",
                    bootstrapErr?.response?.data || bootstrapErr.message
                  );
                  setIsOnline(false);
                  await AsyncStorage.setItem(KEYS.TRACKING_STATUS, "false");
                }
              }
            } else {
              setRole(null);
              setIsVerified(false);
            }
          } else {
            // No authenticated session found -> Flush all volatile states immediately
            setUser(null);
            setRole(null);
            setIsVerified(false);
            setIsOnline(false);
            await AsyncStorage.removeItem(KEYS.SECURE_TOKEN);
          }
        } catch (error) {
          console.error("Auth global layout state listener error:", error);
        } finally {
          setLoading(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  /* =========================================================================
     LOGIN PROXY HANDLER
     ========================================================================= */
  const login = async ({
    uid,
    phone,
    role: initialRole,
  }: {
    uid: string;
    phone?: string;
    role: RoleType | null;
  }) => {
    try {
      setLoading(true); // 🔒 Lock navigation logic matching while updating
      setUser({ uid, phone });

      if (initialRole) {
        await AsyncStorage.setItem(KEYS.ROLE, initialRole);
        setRole(initialRole);
        // Wait for backend validation to complete entirely while still loading
        await checkProfile(initialRole);
      } else {
        await AsyncStorage.removeItem(KEYS.ROLE);
        setRole(null);
        setIsVerified(false);
      }
    } catch (error) {
      console.error("Login initialization update failed:", error);
    } finally {
      setLoading(false); // 🔓 Release navigation safely once all states match perfectly
    }
  };

  /* =========================================================================
     ROLE CONFIGURATION MUTATION
     ========================================================================= */
  const setUserRole = async (selectedRole: RoleType) => {
    await AsyncStorage.setItem(KEYS.ROLE, selectedRole);
    setRole(selectedRole);
  };

  /* =========================================================================
     REMOTE PROFILE SANITY SYNC
     ========================================================================= */
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
      const errorMessage = error?.response?.data?.error;

      if (status === 401) {
        await logout();
        return;
      }

      // ✅ FIX: If the profile is missing (404) OR they haven't completed setup (400),
      // mark them cleanly as unverified so the router sends them to the setup screen.
      if (
        status === 404 ||
        (status === 400 && errorMessage === "User is not an agent")
      ) {
        setIsVerified(false);
        return;
      }

      console.log(
        "Profile verification handle error:",
        error?.response || error
      );
      setIsVerified(false);
    }
  };

  /* =========================================================================
     ONLINE DISPATCH PIPELINE (GEOLOCATION PRIMING ENTRYWAY)
     ========================================================================= */
/* =========================================================================
     ONLINE DISPATCH PIPELINE (GEOLOCATION PRIMING ENTRYWAY)
     ========================================================================= */
const goOnline = async () => {
    try {
      // 1. Hardware Availability Pipeline Validations
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert("GPS Disabled", "Please activate device hardware location features before connecting.");
        return { success: false, message: "GPS is disabled." };
      }

      // 2. Foreground Permissions Guard
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") {
        const res = await Location.requestForegroundPermissionsAsync();
        status = res.status;
      }

      if (status !== "granted") {
        Alert.alert("Permission Required", "Foreground location configurations are missing.");
        return { success: false, message: "Foreground permission denied." };
      }

      // 3. Background Isolation Verification Guard
      const { status: bgStatus } = await Location.getBackgroundPermissionsAsync();
      if (bgStatus !== "granted") {
        const bgRes = await Location.requestBackgroundPermissionsAsync();
        if (bgRes.status !== "granted") {
          Alert.alert(
            "Background Location Required",
            "Change location settings selection to 'Allow all the time' to continue working when backgrounded."
          );
          return { success: false, message: "Background permission denied." };
        }
      }

      // 4. Fetch seed positioning data
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      await AsyncStorage.setItem(KEYS.LAST_LOCATION, JSON.stringify({ lat, lng }));

      // 5. Connect Status Signals with Remote Datastore Endpoint API Routes
      await API.post("/location/online");
      await API.post("/location/update", { lat, lng, load: 0, rating: 5 });

      // 6. Spin Up Native Core Tracking Loop Machinery 
      await startLocationTracking();

      setIsOnline(true);
      await AsyncStorage.setItem(KEYS.TRACKING_STATUS, "true");
      console.log("✅ Agent registration online pipeline validated cleanly.");
      
      return { success: true };
    } catch (error: any) {
      console.log("❌ Error setting state online:", error?.response?.data || error);
      
      setIsOnline(false);
      await AsyncStorage.setItem(KEYS.TRACKING_STATUS, "false");
      
      // ✅ FIX: Extract the backend message if available to return to the component
      const backendError = error?.response?.data?.error || "Your account is pending approval or suspended";
      
      return { 
        success: false, 
        message: backendError 
      };
      
      // 🚫 REMOVED: throw error;  <--- This was causing the unhandled crash
    }
  };

  /* =========================================================================
     OFFLINE TEARDOWN DISPATCH PIPELINE
     ========================================================================= */
  const goOffline = async () => {
    try {
      // Unsubscribe listeners and stop background engines cleanly to avoid leaks
      await stopLocationTracking();

      try {
        await API.post("/location/offline");
      } catch (apiErr) {
        console.warn(
          "⚠️ Remote logout update offline alert skipped (likely offline):",
          apiErr
        );
      }

      setIsOnline(false);
      await AsyncStorage.setItem(KEYS.TRACKING_STATUS, "false");
      console.log("🔴 Agent successfully turned offline.");
    } catch (error) {
      console.error("Critical issue shifting system profile offline:", error);
    }
  };

  /* =========================================================================
     LOGOUT LIFECYCLE ROUTINE
     ========================================================================= */
  const logout = async () => {
    try {
      await goOffline();
      await signOut(auth);

      // Wipe structural disk profiles to ensure clean states on subsequent logins
      await AsyncStorage.removeItem(KEYS.ROLE);
      await AsyncStorage.removeItem(KEYS.TRACKING_STATUS);
      await AsyncStorage.removeItem(KEYS.LAST_LOCATION);
      await AsyncStorage.removeItem(KEYS.SECURE_TOKEN);
    } catch (error) {
      console.error("Logout execution layer crash trace:", error);
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

/* =========================================================================
   CONSUMER HOOK
   ========================================================================= */
export const useAuth = () => useContext(AuthContext);

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { auth } from "../config/firebase";
import { API } from "./api";

/**
 * ✅ SETUP NOTIFICATION CHANNELS
 */
export const setupNotifications = async () => {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("requests_v3", {
      name: "Incoming Requests",

      importance: Notifications.AndroidImportance.MAX,

      sound: "ringtone",

      vibrationPattern: [0, 500, 500, 500],

      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
};

/**
 * ✅ REGISTER ANDROID FCM TOKEN
 */
export const registerForPushNotificationsAsync = async () => {
  if (!Device.isDevice) {
    alert("Must use physical device for Push Notifications");

    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;
  let deviceToken: string | null = null;
  try {
    const native = await Notifications.getDevicePushTokenAsync();
    deviceToken =
      typeof native.data === "string"
        ? native.data
        : JSON.stringify(native.data);
  } catch (err) {
    console.log("Native device token unavailable:", err);
  }

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();

    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    alert("Permission not granted");

    return null;
  }

  try {
    let token = null;

    if (Platform.OS === "android") {
      // ✅ REAL FCM TOKEN
      const tokenData = await Notifications.getDevicePushTokenAsync();

      token = tokenData.data;

      console.log("✅ FCM Token:", token);
    }

    return {
      token,
      platform: Platform.OS,
      deviceToken,
    };
  } catch (error) {
    console.log("❌ Error getting FCM token:", error);

    return null;
  }
};

export const syncPushToken = async (role?: "agent" | "client" | null) => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const pushData = await registerForPushNotificationsAsync();
    if (!pushData) return null;

    const payload = {
      platform: pushData.platform,
      expoPushToken: pushData.token,
      fcmToken: pushData.deviceToken,
    };

    if (role === "agent") {
      await API.post("/notifications/agent", payload);
    } else if (role === "client") {
      await API.post("/notifications/client", payload);
    }

    try {
      await API.post(
        "/device",
        {
          deviceId:
            Device.osInternalBuildId || Device.modelId || pushData.token,
          platform: pushData.platform,
          pushToken: pushData.token,
          expoPushToken: pushData.token,
          fcmToken: pushData.deviceToken,
          deviceName: Device.modelName,
          osVersion: Device.osVersion,
          appVersion: Device.osBuildId,
        },
        { skipErrorLog: true },
      );
    } catch {
      // Older backends do not expose POST /device. Agent/client token save is enough.
    }

    return pushData;
  } catch (err) {
    console.log("Push token sync failed:", err);
    return null;
  }
};

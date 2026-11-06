import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { auth } from "../config/firebase";
import { API } from "./api";

/** Bump this if the Android channel must be recreated (channels are immutable). */
export const REQUEST_CHANNEL_ID = "requests_v5";
export const DEFAULT_CHANNEL_ID = "default";

export const setupNotifications = async () => {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(REQUEST_CHANNEL_ID, {
    name: "Incoming Requests",
    description: "Rings when a client books you, even if Dwellify is closed.",
    importance: Notifications.AndroidImportance.MAX,
    sound: "ringtone.wav",
    vibrationPattern: [0, 500, 500, 500, 500, 500, 500],
    enableVibrate: true,
    enableLights: true,
    bypassDnd: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    audioAttributes: {
      usage:
        Notifications.AndroidAudioUsage?.NOTIFICATION_RINGTONE ??
        Notifications.AndroidAudioUsage?.ALARM,
      contentType:
        Notifications.AndroidAudioContentType?.SONIFICATION ??
        Notifications.AndroidAudioContentType?.MUSIC,
    },
  });

  await Notifications.setNotificationChannelAsync(DEFAULT_CHANNEL_ID, {
    name: "General",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
  });
};

export const registerForPushNotificationsAsync = async () => {
  if (!Device.isDevice) {
    console.log("Push skipped: must use a physical device");
    return null;
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowCriticalAlerts: false,
      },
      android: {},
    });
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Push permission not granted");
    return null;
  }

  await setupNotifications();

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ||
    Constants?.easConfig?.projectId;

  if (!projectId) {
    console.log("❌ Missing projectId");
    return null;
  }

  let deviceToken: string | null = null;
  try {
    const native = await Notifications.getDevicePushTokenAsync();
    deviceToken =
      typeof native.data === "string" ? native.data : JSON.stringify(native.data);
  } catch (err) {
    console.log("Native device token unavailable:", err);
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  console.log("✅ Expo Push Token:", tokenData.data);

  return {
    token: tokenData.data,
    deviceToken,
    platform: Platform.OS,
  };
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
          deviceId: Device.osInternalBuildId || Device.modelId || pushData.token,
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

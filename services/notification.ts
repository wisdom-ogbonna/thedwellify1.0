import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

/**
 * ✅ SETUP NOTIFICATION CHANNELS
 */
export const setupNotifications = async () => {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("requests_v2", {
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
    };
  } catch (error) {
    console.log("❌ Error getting FCM token:", error);

    return null;
  }
};

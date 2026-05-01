import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

export const registerForPushNotificationsAsync = async () => {
  if (!Device.isDevice) {
    alert("Must use physical device for Push Notifications");
    return null;
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

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
      // ✅ ANDROID → FCM TOKEN
      const tokenData = await Notifications.getDevicePushTokenAsync();
      token = tokenData.data;

      console.log("✅ FCM Token:", token);

      // REQUIRED for Android notifications
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        sound: "default",
        vibrationPattern: [0, 250, 250, 250],
      });
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
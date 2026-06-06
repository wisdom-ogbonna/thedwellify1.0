import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * ✅ SETUP NOTIFICATION CHANNELS
 */
export const setupNotifications = async () => {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(
      "requests_v2",
      {
        name: "Incoming Requests",

        importance:
          Notifications.AndroidImportance.MAX,

        sound: "ringtone.wav",

        vibrationPattern: [0, 500, 500, 500],

        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility
            .PUBLIC,
      }
    );
  }
};

/**
 * ✅ REGISTER PUSH TOKEN
 */
export const registerForPushNotificationsAsync =
  async () => {
    if (!Device.isDevice) {
      alert(
        "Must use physical device for Push Notifications"
      );

      return null;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } =
        await Notifications.requestPermissionsAsync();

      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      alert("Permission not granted");

      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId;

    if (!projectId) {
      console.log("❌ Missing projectId");

      return null;
    }

    const tokenData =
      await Notifications.getExpoPushTokenAsync({
        projectId,
      });

    const token = tokenData.data;

    console.log("✅ Expo Push Token:", token);

    return {
      token,
      platform: Platform.OS,
    };
  };
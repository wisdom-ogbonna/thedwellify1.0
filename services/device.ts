import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { auth } from "../config/firebase"; // your firebase config
import { API } from "./api";

export const registerDevice = async () => {
  try {
    const user = auth.currentUser;

    if (!user) {
      console.log("No logged in user");
      return;
    }

    // Firebase token
    const firebaseToken = await user.getIdToken();

    // Expo notification token
    const expoToken = (await Notifications.getExpoPushTokenAsync()).data;

    await API.post(
      "/device",
      {
        deviceId: Device.osInternalBuildId,

        platform: Device.osName,

        pushToken: expoToken,

        deviceName: Device.modelName,

        osVersion: Device.osVersion,

        appVersion: Device.osBuildId,
      },
      {
        headers: {
          Authorization: `Bearer ${firebaseToken}`,
        },
      }
    );

    console.log("Device registered");
  } catch (error) {
    console.log("Device registration error", error);
  }
};

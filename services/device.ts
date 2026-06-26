import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as Application from "expo-application";
import { Platform } from "react-native";
import { auth } from "../config/firebase"; 
import { API } from "./api";

export const registerDevice = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    // 1. Check & Request Notification Permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== "granted") {
      console.log("Notification permissions denied.");
      return;
    }

    // 2. Fetch the PURE NATIVE device token (FCM for Android, APNs for iOS)
    const deviceTokenResponse = await Notifications.getDevicePushTokenAsync();
    const nativeToken = deviceTokenResponse.data; 

    // 3. Generate a robust unique device ID
    const uniqueDeviceId = Platform.OS === 'android' 
      ? Application.androidId 
      : await Application.getIosIdForVendorAsync() || Device.osInternalBuildId;

    if (!uniqueDeviceId) return;

    const firebaseToken = await user.getIdToken();

    await API.post(
      "/device",
      {
        deviceId: uniqueDeviceId,
        platform: Platform.OS, 
        pushToken: nativeToken, // Raw FCM Token sent here
        deviceName: Device.modelName || "Unknown Device",
        osVersion: Device.osVersion || "Unknown OS",
        appVersion: Application.nativeApplicationVersion || "1.0.0",
      },
      {
        headers: {
          Authorization: `Bearer ${firebaseToken}`,
        },
      }
    );

    console.log("Device synchronized successfully with raw FCM token.");
  } catch (error) {
    console.error("Device registration error:", error);
  }
};
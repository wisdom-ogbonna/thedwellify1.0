import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { playRingtone } from "./ringtone";

export const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND-NOTIFICATION-TASK";

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) {
    console.log("Background notification task error:", error);
    return;
  }

  const notification = (data as { notification?: any })?.notification;
  const payload =
    notification?.request?.content?.data || notification?.data || {};

  if (payload?.type === "incoming_request") {
    try {
      await playRingtone();
    } catch (err) {
      console.log("Background ringtone failed:", err);
    }
  }
});

Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch((err) => {
  console.log("Failed to register background notification task:", err);
});

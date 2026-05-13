import { Audio } from "expo-av";

let sound = null;
let timeoutRef = null;

/**
 * ✅ PLAY RINGTONE
 */
export const playRingtone = async () => {
  try {
    // stop existing sound first
    if (sound) {
      await sound.unloadAsync();
      sound = null;
    }

    const { sound: newSound } = await Audio.Sound.createAsync(
      require("../assets/sounds/ringtone.mp3"),
      {
        shouldPlay: true,
        isLooping: true,
        volume: 1.0,
      }
    );

    sound = newSound;

    await sound.playAsync();

    // ✅ AUTO STOP AFTER 30s
    timeoutRef = setTimeout(async () => {
      await stopRingtone();
    }, 30000);
  } catch (error) {
    console.log("Play ringtone error:", error);
  }
};

/**
 * ✅ STOP RINGTONE
 */
export const stopRingtone = async () => {
  try {
    if (timeoutRef) {
      clearTimeout(timeoutRef);
      timeoutRef = null;
    }

    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      sound = null;
    }
  } catch (error) {
    console.log("Stop ringtone error:", error);
  }
};
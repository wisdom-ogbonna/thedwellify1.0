import { Audio } from "expo-av";

let ringtone: Audio.Sound | null = null;
let starting = false;

export const playRingtone = async () => {
  if (starting) return;
  starting = true;

  try {
    await stopRingtone();

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    const { sound } = await Audio.Sound.createAsync(
      require("../assets/sounds/ringtone.wav"),
      {
        shouldPlay: true,
        isLooping: true,
        volume: 1,
      },
    );

    ringtone = sound;
  } catch (error) {
    console.log("RINGTONE PLAY ERROR:", error);
  } finally {
    starting = false;
  }
};

export const stopRingtone = async () => {
  try {
    if (!ringtone) return;

    await ringtone.stopAsync();
    await ringtone.unloadAsync();
  } catch (error) {
    console.log("RINGTONE STOP ERROR:", error);
  } finally {
    ringtone = null;
  }
};

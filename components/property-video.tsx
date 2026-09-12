import { useVideoPlayer, VideoView } from "expo-video";
import React from "react";
import { StyleProp, ViewStyle } from "react-native";

type Props = {
  uri: string;
  style?: StyleProp<ViewStyle>;
  contentFit?: "contain" | "cover" | "fill";
  nativeControls?: boolean;
  loop?: boolean;
};

/**
 * Property listing video player using expo-video
 * (replaces deprecated expo-av Video).
 *
 * Note: requires a rebuild of the Expo dev client after adding expo-video.
 */
export function PropertyVideo({
  uri,
  style,
  contentFit = "cover",
  nativeControls = true,
  loop = true,
}: Props) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = loop;
    p.pause();
  });

  return (
    <VideoView
      style={style}
      player={player}
      nativeControls={nativeControls}
      contentFit={contentFit}
      fullscreenOptions={{ enable: true }}
    />
  );
}

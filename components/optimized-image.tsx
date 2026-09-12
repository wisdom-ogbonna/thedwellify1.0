import { Image, type ImageContentFit, type ImageProps } from "expo-image";
import React, { memo } from "react";
import { StyleProp, View, ViewStyle } from "react-native";

type Props = {
  uri?: string | null;
  style?: StyleProp<ViewStyle>;
  contentFit?: ImageContentFit;
  recyclingKey?: string;
  /** Priority for near-viewport images */
  priority?: ImageProps["priority"];
  placeholderColor?: string;
};

/**
 * Cached, recycled listing image. Uses expo-image disk+memory cache and
 * only downloads when mounted (FlatList virtualization keeps offscreen
 * rows unmounted).
 */
function OptimizedImageComponent({
  uri,
  style,
  contentFit = "cover",
  recyclingKey,
  priority = "normal",
  placeholderColor = "#E8EEF5",
}: Props) {
  if (!uri) {
    return <View style={[{ backgroundColor: placeholderColor }, style]} />;
  }

  return (
    <Image
      source={{ uri }}
      style={style as any}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      recyclingKey={recyclingKey || uri}
      priority={priority}
      transition={180}
      placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
      placeholderContentFit="cover"
    />
  );
}

export const OptimizedImage = memo(OptimizedImageComponent);
OptimizedImage.displayName = "OptimizedImage";

/** Best card preview URL — prefer server thumbnail/cover over full gallery. */
export const listingCoverUrl = (item?: {
  coverImage?: string | null;
  thumbnails?: string[] | null;
  images?: string[] | null;
  image?: string | null;
} | null) =>
  item?.coverImage ||
  item?.thumbnails?.[0] ||
  item?.images?.[0] ||
  item?.image ||
  null;

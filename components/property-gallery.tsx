import { useTheme } from "@/hooks/use-theme";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  View,
  ViewToken,
} from "react-native";

const { width: SCREEN_W } = Dimensions.get("window");

type Props = {
  images: string[];
  height?: number;
  fallback?: string;
};

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800";

export function PropertyGallery({
  images,
  height = 320,
  fallback = PLACEHOLDER,
}: Props) {
  const { colors } = useTheme();
  const list = images?.length ? images : [fallback];
  const [index, setIndex] = useState(0);
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems?.[0]?.index != null) {
        setIndex(viewableItems[0].index);
      }
    }
  ).current;

  return (
    <View style={{ height, width: SCREEN_W, backgroundColor: colors.disabled }}>
      <FlatList
        data={list}
        keyExtractor={(uri, i) => `${uri}-${i}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfig}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={{ width: SCREEN_W, height }}
            resizeMode="cover"
          />
        )}
        onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
          if (next >= 0 && next < list.length) setIndex(next);
        }}
      />

      {list.length > 1 ? (
        <View className="absolute bottom-4 left-0 right-0 flex-row justify-center items-center gap-1.5">
          {list.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === index ? 18 : 6,
                height: 6,
                borderRadius: 999,
                backgroundColor: i === index ? "#FFFFFF" : "rgba(255,255,255,0.45)",
              }}
            />
          ))}
        </View>
      ) : null}

      {list.length > 1 ? (
        <View className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-black/45">
          <Text className="text-white text-[11px] font-semibold">
            {index + 1}/{list.length}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

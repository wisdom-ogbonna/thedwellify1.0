// app/(tabs)/discover.tsx
import { useTheme } from "@/hooks/use-theme";
import { router } from "expo-router";
import {
  Bathtub,
  Bed,
  Bell,
  CaretDown,
  Faders,
  Heart,
  MagnifyingGlass,
  MapPin,
  SquaresFour,
  Triangle,
} from "phosphor-react-native";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const SAVED_CARD_WIDTH = width * 0.72;

const savedProperties = [
  {
    id: "1",
    title: "Victoria Island Apartment",
    location: "Victoria Island, Lagos",
    price: "₦4,500,000",
    period: " / year",
    beds: 3,
    baths: 3,
    size: "180 sqm",
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=600",
    isFeatured: true,
  },
  {
    id: "2",
    title: "Luxury Duplex",
    location: "Lekki Phase 1, Lagos",
    price: "₦8,000,000",
    period: " / year",
    beds: 4,
    baths: 4,
    size: "250 sqm",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600",
    isFeatured: false,
  },
];

const recommendedListings = [
  {
    id: "1",
    title: "3 Bedroom Apartment",
    location: "Ikoyi, Lagos",
    price: "₦12,000,000",
    period: " / year",
    beds: 3,
    baths: 3,
    image:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=300",
  },
  {
    id: "2",
    title: "Terraced Duplex",
    location: "Ajah, Lagos",
    price: "₦3,200,000",
    period: " / year",
    beds: 2,
    baths: 2,
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=300",
  },
  {
    id: "3",
    title: "Prime Land Plot",
    location: "Epe, Lagos",
    price: "₦15,000,000",
    period: "",
    size: "600 sqm",
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=300",
  },
];

export default function DiscoverMarketplaceScreen() {
  const { colors } = useTheme();
  const [activeCategory, setActiveCategory] = useState("All");
  const categories = ["All", "Apartment", "Rent", "Land"];

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      {/* 1. App Bar Header */}
      <View
        className="flex-row items-center justify-between px-5 py-4"
        style={{ backgroundColor: colors.background }}
      >
        <View className="flex-row items-center gap-1.5">
          <MapPin weight="fill" size={20} color={colors.primary} />
          <Text
            className="text-[15px] font-semibold"
            style={{ color: colors.text }}
          >
            Lagos, Nigeria
          </Text>
          <CaretDown color={colors.text} weight="bold" size={13} />
        </View>
        <View className="flex-row gap-3 items-center">
          <TouchableOpacity
            className="w-10 h-10 rounded-full border items-center justify-center"
            style={{ borderColor: `${colors.border}80` }}
          >
            <Bell color={colors.text} size={20} weight="regular" />
          </TouchableOpacity>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150",
            }}
            className="w-10 h-10 rounded-full"
          />
        </View>
      </View>

      {/* Main Scrollable Canvas */}
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Search Input Bar */}
        <View className="px-5 mt-2 mb-6">
          <View
            className="flex-row items-center border rounded-full px-4 py-2.5 shadow-sm shadow-black/5"
            style={{
              backgroundColor: colors.background,
              borderColor: `${colors.border}80`,
            }}
          >
            <MagnifyingGlass
              size={20}
              color={colors.placeholder}
              weight="regular"
            />
            <TextInput
              placeholder="Search location, property..."
              placeholderTextColor={colors.placeholder}
              className="flex-1 text-[15px] font-normal ml-3 p-0"
              style={{ color: colors.text }}
            />
            <TouchableOpacity
              className="pl-3 border-l"
              style={{ borderColor: `${colors.border}80` }}
            >
              <Faders size={20} color={colors.primary} weight="regular" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Category Pill Selector Row */}
        <View className="mb-7">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }}
            className="flex-row"
          >
            {categories.map((cat) => {
              const isSelected = activeCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  className={`flex-row items-center px-6 py-3.5 rounded-full mr-3 ${
                    isSelected ? "shadow-md shadow-blue-500/30" : ""
                  }`}
                  style={{
                    backgroundColor: isSelected
                      ? colors.primary
                      : colors.disabled,
                  }}
                >
                  {cat === "All" && (
                    <SquaresFour
                      size={18}
                      color={"#FFFFFF"}
                      weight={isSelected ? "fill" : "regular"}
                      style={{ marginRight: 8 }}
                    />
                  )}
                  <Text className="text-[15px] font-semibold text-white">
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 4. Saved Large Carousel Cards Section */}
        <View className="mb-8">
          <View className="flex-row justify-between items-center px-5 mb-4">
            <Text
              className="text-[18px] font-bold tracking-tight"
              style={{ color: colors.text }}
            >
              Saved
            </Text>
            <TouchableOpacity onPress={() => router.push("/(client)/saved")}>
              <Text
                className="text-[13px] font-semibold"
                style={{ color: colors.primary }}
              >
                See all
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={SAVED_CARD_WIDTH + 16}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {savedProperties.map((item) => (
              <View
                key={item.id}
                style={{
                  width: SAVED_CARD_WIDTH,
                  marginRight: 16,
                  backgroundColor: colors.background,
                  borderColor: `${colors.border}80`,
                }}
                className="border rounded-3xl overflow-hidden shadow-sm shadow-black/5"
              >
                {/* Showcase Media */}
                <View className="relative h-48 w-full">
                  <Image
                    source={{ uri: item.image }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  {item.isFeatured && (
                    <View
                      className="absolute top-4 left-4 px-3 py-1 rounded-full"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <Text
                        className="text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: colors.background }}
                      >
                        Featured
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity className="absolute top-4 right-4 w-9 h-9 bg-black/20 backdrop-blur-md rounded-full items-center justify-center border border-white/30">
                    <Heart size={18} color="#FFFFFF" weight="regular" />
                  </TouchableOpacity>
                </View>

                {/* Info Segment */}
                <View className="p-4">
                  <Text
                    className="text-[16px] font-semibold mb-1"
                    style={{ color: colors.text }}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <View className="flex-row items-center mb-2.5">
                    <MapPin
                      size={14}
                      color={colors.placeholder}
                      weight="regular"
                    />
                    <Text
                      className="text-[13px] ml-1"
                      style={{ color: colors.placeholder }}
                    >
                      {item.location}
                    </Text>
                  </View>

                  <View className="flex-row items-baseline mb-3.5">
                    <Text
                      className="text-[16px] font-bold"
                      style={{ color: colors.primary }}
                    >
                      {item.price}
                    </Text>
                    <Text
                      className="text-[13px] font-medium"
                      style={{ color: colors.primary }}
                    >
                      {item.period}
                    </Text>
                  </View>

                  {/* Horizontal Meta */}
                  <View
                    className="flex-row items-center gap-4 pt-2 border-t"
                    style={{ borderColor: `${colors.border}40` }}
                  >
                    {item.beds && (
                      <View className="flex-row items-center">
                        <Bed
                          size={15}
                          color={colors.placeholder}
                          weight="regular"
                        />
                        <Text
                          className="text-[13px] ml-1.5 font-medium"
                          style={{ color: colors.placeholder }}
                        >
                          {item.beds}
                        </Text>
                      </View>
                    )}
                    {item.baths && (
                      <View className="flex-row items-center">
                        <Bathtub
                          size={15}
                          color={colors.placeholder}
                          weight="regular"
                        />
                        <Text
                          className="text-[13px] ml-1.5 font-medium"
                          style={{ color: colors.placeholder }}
                        >
                          {item.baths}
                        </Text>
                      </View>
                    )}
                    {item.size && (
                      <View className="flex-row items-center">
                        <Triangle
                          size={15}
                          color={colors.placeholder}
                          weight="regular"
                        />
                        <Text
                          className="text-[13px] ml-1.5 font-medium"
                          style={{ color: colors.placeholder }}
                        >
                          {item.size}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 5. Vertical Recommended Listings Section */}
        <View className="px-5 mb-10">
          <View className="flex-row justify-between items-center mb-4">
            <Text
              className="text-[18px] font-bold tracking-tight"
              style={{ color: colors.text }}
            >
              Recommended for you
            </Text>
            <TouchableOpacity>
              <Text
                className="text-[13px] font-semibold"
                style={{ color: colors.primary }}
              >
                See all
              </Text>
            </TouchableOpacity>
          </View>

          {recommendedListings.map((list) => (
            <TouchableOpacity
              key={list.id}
              className="border rounded-3xl p-3 flex-row mb-4 items-center shadow-sm shadow-black/5"
              style={{
                backgroundColor: colors.background,
                borderColor: `${colors.border}80`,
              }}
            >
              <Image
                source={{ uri: list.image }}
                className="w-24 h-24 rounded-2xl"
              />

              <View className="flex-1 ml-3.5 justify-between py-0.5">
                <View>
                  <Text
                    className="text-[15px] font-semibold mb-1"
                    style={{ color: colors.text }}
                    numberOfLines={1}
                  >
                    {list.title}
                  </Text>
                  <View className="flex-row items-center">
                    <MapPin
                      size={13}
                      color={colors.placeholder}
                      weight="regular"
                    />
                    <Text
                      className="text-[12px] ml-1"
                      style={{ color: colors.placeholder }}
                    >
                      {list.location}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-end justify-between mt-3">
                  <View className="flex-row items-baseline">
                    <Text
                      className="text-[15px] font-bold"
                      style={{ color: colors.primary }}
                    >
                      {list.price}
                    </Text>
                    {!!list.period && (
                      <Text
                        className="text-[11px] font-medium"
                        style={{ color: colors.primary }}
                      >
                        {list.period}
                      </Text>
                    )}
                  </View>

                  <View className="flex-row items-center gap-2.5">
                    {list.beds && (
                      <View className="flex-row items-center">
                        <Bed
                          size={14}
                          color={colors.placeholder}
                          weight="regular"
                        />
                        <Text
                          className="text-[12px] ml-1 font-medium"
                          style={{ color: colors.placeholder }}
                        >
                          {list.beds}
                        </Text>
                      </View>
                    )}
                    {list.baths && (
                      <View className="flex-row items-center">
                        <Bathtub
                          size={14}
                          color={colors.placeholder}
                          weight="regular"
                        />
                        <Text
                          className="text-[12px] ml-1 font-medium"
                          style={{ color: colors.placeholder }}
                        >
                          {list.baths}
                        </Text>
                      </View>
                    )}
                    {list.size && (
                      <View className="flex-row items-center">
                        <Triangle
                          size={14}
                          color={colors.placeholder}
                          weight="regular"
                        />
                        <Text
                          className="text-[12px] ml-1 font-medium"
                          style={{ color: colors.placeholder }}
                        >
                          {list.size}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

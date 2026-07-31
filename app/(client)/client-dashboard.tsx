// app/(tabs)/discover.tsx
import { router } from "expo-router";
import {
  BedDouble,
  ChevronRight,
  Heart,
  MapPin,
  Maximize,
  Search,
  ShowerHead,
  SlidersHorizontal,
} from "lucide-react-native";
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
const RECOMMENDED_CARD_WIDTH = width * 0.78;

const recommendedProperties = [
  {
    id: "1",
    title: "The Glass Pavilion",
    location: "Hollywood Hills, CA",
    price: "$4,250,000",
    beds: 4,
    baths: 5,
    size: "4,390 sqft",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914",
  },
  {
    id: "2",
    title: "Azure Horizon Estate",
    location: "Malibu, CA",
    price: "$6,180,000",
    beds: 5,
    baths: 6,
    size: "5,500 sqft",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914",
  },
];

const featuredListings = [
  {
    id: "1",
    title: "Hamptons Haven",
    location: "Southampton, NY",
    price: "$2,850,000",
    beds: 5,
    baths: 4,
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914",
  },
  {
    id: "2",
    title: "Mirage Desert Oasis",
    location: "Joshua Tree, CA",
    price: "$1,920,000",
    beds: 3,
    baths: 2,
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914",
  },
  {
    id: "3",
    title: "Cobble Hill Brownstone",
    location: "Brooklyn, NY",
    price: "$5,400,000",
    beds: 4,
    baths: 3.5,
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914",
  },
];

export default function DiscoverMarketplaceScreen() {
  const [activeCategory, setActiveCategory] = useState("All");
  const isDark = false;
  const categories = ["All", "Villa", "Apartment", "Penthouse"];

  // Enforcing strict hardware level pure theme variables mapping
  const screenBg = isDark ? "#000000" : "#F1F5F9";
  const elementBg = isDark ? "#000000" : "#FFFFFF";
  const innerCardBg = isDark ? "#111111" : "#F8FAFC";
  const textColor = isDark ? "#FFFFFF" : "#0F172A";
  const subTextColor = isDark ? "#94A3B8" : "#64748B";
  const borderColor = isDark ? "#222222" : "#E2E8F0";

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: screenBg }}
      edges={["top"]}
    >
      {/* 1. App Bar Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingVertical: 12,
          backgroundColor: elementBg,
          borderBottomWidth: 1,
          borderBottomColor: borderColor,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "900",
            color: "#2563EB",
            letterSpacing: -0.5,
          }}
        >
          Dwellify
        </Text>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
          }}
          className="w-9 h-9 rounded-full"
        />
      </View>

      {/* Main Scrollable Canvas */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* 2. Search Input Bar */}
        <View className="px-5 mt-4 mb-4">
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: innerCardBg,
              borderWidth: 1,
              borderColor: borderColor,
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <Search
              size={18}
              color={subTextColor}
              style={{ marginRight: 10 }}
            />
            <TextInput
              placeholder="Search Location"
              placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
              style={{
                flex: 1,
                fontSize: 14,
                color: textColor,
                fontWeight: "500",
                padding: 0,
              }}
            />
            <TouchableOpacity
              style={{
                paddingLeft: 12,
                borderLeftWidth: 1,
                borderLeftColor: borderColor,
              }}
            >
              <SlidersHorizontal size={18} color="#2563EB" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Category Pill Selector Row */}
        <View className="mb-5">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row px-5"
          >
            {categories.map((cat) => {
              const isSelected = activeCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  style={{
                    paddingHorizontal: 24,
                    paddingVertical: 10,
                    borderRadius: 99,
                    marginRight: 12,
                    borderWidth: 1,
                    borderColor: isSelected ? "#2563EB" : borderColor,
                    backgroundColor: isSelected ? "#2563EB" : innerCardBg,
                  }}
                  className="shadow-none"
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: isSelected ? "#FFFFFF" : subTextColor,
                    }}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 4. Recommended Large Carousel Cards Section */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center px-5 mb-4">
            <Text
              style={{
                fontSize: 18,
                fontWeight: "900",
                color: textColor,
                letterSpacing: -0.5,
              }}
            >
              Saved Properties
            </Text>
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => router.push("/(client)/saved")}
            >
              <Text
                style={{ fontSize: 12, color: "#2563EB", fontWeight: "700" }}
              >
                View all
              </Text>
              <ChevronRight size={14} color="#2563EB" />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={RECOMMENDED_CARD_WIDTH + 16}
            decelerationRate="fast"
            className="flex-row px-5"
          >
            {recommendedProperties.map((item) => (
              <View
                key={item.id}
                style={{
                  width: RECOMMENDED_CARD_WIDTH,
                  backgroundColor: elementBg,
                  borderWidth: 1,
                  borderColor: borderColor,
                  borderRadius: 28,
                  overflow: "hidden",
                  marginRight: 16,
                  marginBottom: 8,
                }}
              >
                {/* Showcase Media Aspect Box */}
                <View className="relative h-48 w-full bg-slate-100 dark:bg-neutral-900">
                  <Image
                    source={{ uri: item.image }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />

                  {/* Floating Top-Left Price Badge */}
                  <View className="absolute top-4 left-4 bg-blue-600 px-3 py-1.5 rounded-xl">
                    <Text className="text-xs font-black text-white">
                      {item.price}
                    </Text>
                  </View>

                  {/* Top-Right Favorite Circle Toggle */}
                  <TouchableOpacity
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      width: 36,
                      height: 36,
                      backgroundColor: "rgba(255,255,255,0.9)",
                      borderRadius: 18,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Heart size={16} color="#EF4444" fill="#EF4444" />
                  </TouchableOpacity>
                </View>

                {/* Info Segment */}
                <View className="p-4">
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "900",
                      color: textColor,
                      lineHeight: 20,
                    }}
                  >
                    {item.title}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 6,
                    }}
                  >
                    <MapPin size={12} color={subTextColor} />
                    <Text
                      style={{
                        fontSize: 12,
                        color: subTextColor,
                        marginLeft: 4,
                      }}
                    >
                      {item.location}
                    </Text>
                  </View>

                  {/* Horizontal Meta Specifications Line */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 12,
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: borderColor,
                      gap: 16,
                    }}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <BedDouble size={14} color={subTextColor} />
                      <Text
                        style={{
                          fontSize: 11,
                          color: subTextColor,
                          marginLeft: 4,
                        }}
                      >
                        {item.beds} Beds
                      </Text>
                    </View>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <ShowerHead size={14} color={subTextColor} />
                      <Text
                        style={{
                          fontSize: 11,
                          color: subTextColor,
                          marginLeft: 4,
                        }}
                      >
                        {item.baths} Baths
                      </Text>
                    </View>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Maximize size={14} color={subTextColor} />
                      <Text
                        style={{
                          fontSize: 11,
                          color: subTextColor,
                          marginLeft: 4,
                        }}
                      >
                        {item.size}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 5. Vertical Featured Listings Section */}
        <View className="px-5 mb-28">
          <Text
            style={{
              fontSize: 18,
              fontWeight: "900",
              color: textColor,
              letterSpacing: -0.5,
              marginBottom: 16,
            }}
          >
            Recommended for you
          </Text>

          {featuredListings.map((list) => (
            <TouchableOpacity
              key={list.id}
              style={{
                backgroundColor: innerCardBg,
                borderWidth: 1,
                borderColor: borderColor,
                borderRadius: 16,
                padding: 12,
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <Image
                source={{ uri: list.image }}
                className="w-20 h-20 rounded-xl"
              />

              <View className="flex-1 ml-4 justify-between py-0.5">
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "900",
                      color: textColor,
                    }}
                    numberOfLines={1}
                  >
                    {list.title}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 4,
                    }}
                  >
                    <MapPin size={10} color={subTextColor} />
                    <Text
                      style={{
                        fontSize: 11,
                        color: subTextColor,
                        marginLeft: 4,
                      }}
                    >
                      {list.location}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between mt-3">
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "900",
                      color: "#2563EB",
                    }}
                  >
                    {list.price}
                  </Text>
                  <View className="flex-row items-center space-x-3">
                    <View className="flex-row items-center">
                      <BedDouble size={12} color={subTextColor} />
                      <Text
                        style={{
                          fontSize: 10,
                          color: subTextColor,
                          marginLeft: 3,
                        }}
                      >
                        {list.beds}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <ShowerHead size={12} color={subTextColor} />
                      <Text
                        style={{
                          fontSize: 10,
                          color: subTextColor,
                          marginLeft: 3,
                        }}
                      >
                        {list.baths}
                      </Text>
                    </View>
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

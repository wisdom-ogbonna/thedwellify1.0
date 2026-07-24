// app/(tabs)/listings.tsx
import { Stack, router } from "expo-router";
import {
  Bell,
  Building2,
  MapPin,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ListingItem {
  id: string;
  title: string;
  location: string;
  price: string;
  period?: string; // e.g., "/ Year", "/ Night"
  tag: "For Sale" | "For Rent" | "Shortlet";
  views: number;
  inquiries: number;
  status: "Active" | "Inactive";
}

export default function MyListingsScreen() {
  const isDark = false;
  const [activeTab, setActiveTab] = useState("All Listings");
  const [searchQuery, setSearchQuery] = useState("");

  // Theme Styling Rules
  const bgMain = isDark ? "#000000" : "#F8FAFC";
  const bgCard = isDark ? "#111111" : "#FFFFFF";
  const textPrimary = isDark ? "#FFFFFF" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";
  const borderRegular = isDark ? "#222222" : "#F1F5F9";
  const searchBg = isDark ? "#111111" : "#F1F5F9";
  const textMuted = isDark ? "#64748B" : "#94A3B8";

  const tabs = ["All Listings", "For Sale", "For Rent", "Sold"];

  const listings: ListingItem[] = [
    {
      id: "1",
      title: "4 Bedroom Duplex with BQ",
      location: "Lekki Phase 1, Lagos",
      price: "₦120,000,000",
      tag: "For Sale",
      views: 245,
      inquiries: 18,
      status: "Active",
    },
    {
      id: "2",
      title: "3 Bedroom Apartment",
      location: "Victoria Island, Lagos",
      price: "₦6,500,000",
      period: "/ Year",
      tag: "For Rent",
      views: 132,
      inquiries: 7,
      status: "Active",
    },
    {
      id: "3",
      title: "1500 Sqm Residential Plot",
      location: "Chevron Drive, Lekki",
      price: "₦45,000,000",
      tag: "For Sale",
      views: 89,
      inquiries: 3,
      status: "Active",
    },
    {
      id: "4",
      title: "2 Bedroom Shortlet Apartment",
      location: "Ikoyi, Lagos",
      price: "₦120,000",
      period: "/ Night",
      tag: "Shortlet",
      views: 58,
      inquiries: 12,
      status: "Active",
    },
    {
      id: "5",
      title: "5 Bedroom Detached House",
      location: "Lekki County, Lagos",
      price: "₦250,000,000",
      tag: "For Sale",
      views: 310,
      inquiries: 25,
      status: "Active",
    },
  ];

  // Map active status categories for proper tag design styles
  const getTagBg = (tag: string) => {
    switch (tag) {
      case "For Sale":
        return "#2563EB";
      case "For Rent":
        return "#1E40AF";
      case "Shortlet":
        return "#0284C7";
      default:
        return "#475569";
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor: bgMain, flex: 1 }} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* 1. Top Navigation bar */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: bgCard,
          borderBottomWidth: 1,
          borderBottomColor: borderRegular,
        }}
      >
        <TouchableOpacity
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Menu size={20} color={textPrimary} />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 18,
            fontWeight: "800",
            color: textPrimary,
            fontFamily: "Poppins",
          }}
        >
          My Listings
        </Text>

        <TouchableOpacity
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isDark ? "#1E293B" : "#EFF6FF",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Bell size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* 2. Top Navigation Tabs Row */}
      <View
        style={{
          backgroundColor: bgCard,
          borderBottomWidth: 1,
          borderBottomColor: borderRegular,
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            height: 48,
            alignItems: "center",
            gap: 24,
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  height: "100%",
                  justifyContent: "center",
                  borderBottomWidth: isActive ? 3 : 0,
                  borderBottomColor: "#2563EB",
                  paddingHorizontal: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: isActive ? "800" : "500",
                    color: isActive ? "#2563EB" : textSecondary,
                  }}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Search Field & Control Filter Trigger */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 12,
          alignItems: "center",
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: searchBg,
            borderRadius: 12,
            paddingHorizontal: 12,
            height: 44,
          }}
        >
          <Search size={18} color={textMuted} />
          <TextInput
            placeholder="Search your listings..."
            placeholderTextColor={textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ flex: 1, marginLeft: 8, color: textPrimary, fontSize: 14 }}
          />
        </View>

        <TouchableOpacity
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: isDark ? "#1E293B" : "#EFF6FF",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <SlidersHorizontal size={18} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* 4. Listings Stack Scroll Container */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110 }}
      >
        <View style={{ gap: 16 }}>
          {listings.map((item) => (
            <View
              key={item.id}
              style={{
                backgroundColor: bgCard,
                borderRadius: 20,
                padding: 12,
                flexDirection: "row",
                borderWidth: 1,
                borderColor: borderRegular,
                position: "relative",
              }}
            >
              {/* Dummy Image Placeholder with Tag badge */}
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 16,
                  backgroundColor: isDark ? "#1E293B" : "#EEF2F6",
                  justifyContent: "center",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                <Building2 size={32} color={isDark ? "#475569" : "#CBD5E1"} />

                {/* Sale/Rent Label Tag */}
                <View
                  style={{
                    position: "absolute",
                    top: 6,
                    left: 6,
                    backgroundColor: getTagBg(item.tag),
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 10,
                  }}
                >
                  <Text
                    style={{ color: "#FFFFFF", fontSize: 9, fontWeight: "800" }}
                  >
                    {item.tag}
                  </Text>
                </View>
              </View>

              {/* Text Layout Metadata Info */}
              <View
                style={{
                  flex: 1,
                  marginLeft: 12,
                  justifyContent: "space-between",
                }}
              >
                {/* Title and Settings row */}
                <View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 15,
                        fontWeight: "800",
                        color: textPrimary,
                        flex: 1,
                        paddingRight: 8,
                      }}
                    >
                      {item.title}
                    </Text>
                    <TouchableOpacity style={{ padding: 2 }}>
                      <MoreHorizontal size={18} color={textSecondary} />
                    </TouchableOpacity>
                  </View>

                  {/* Location Row */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 4,
                    }}
                  >
                    <MapPin
                      size={12}
                      color={textSecondary}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: 12, color: textSecondary }}
                    >
                      {item.location}
                    </Text>
                  </View>
                </View>

                {/* Pricing Area */}
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "800",
                    color: "#2563EB",
                    marginTop: 4,
                  }}
                >
                  {item.price}
                  {item.period && (
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "500",
                        color: textSecondary,
                      }}
                    >
                      {" "}
                      {item.period}
                    </Text>
                  )}
                </Text>

                {/* Footer metadata metric tags (Views, Inquiries, and Active status) */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 6,
                  }}
                >
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Text style={{ fontSize: 11, color: textSecondary }}>
                        Views:{" "}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: textPrimary,
                        }}
                      >
                        {item.views}
                      </Text>
                    </View>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Text style={{ fontSize: 11, color: textSecondary }}>
                        Inquiries:{" "}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: textPrimary,
                        }}
                      >
                        {item.inquiries}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      backgroundColor: isDark
                        ? "rgba(34, 197, 94, 0.15)"
                        : "#DCFCE7",
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: "#16A34A",
                        fontSize: 10,
                        fontWeight: "800",
                      }}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 5. Persistent Bottom Layout Button */}
      <View
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
        }}
      >
        <TouchableOpacity
          onPress={() => router.push("/(product)/creater")}
          activeOpacity={0.9}
          style={{
            height: 54,
            borderRadius: 14,
            backgroundColor: "#2563EB",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            shadowColor: "#2563EB",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "800" }}>
            Add New Listing
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

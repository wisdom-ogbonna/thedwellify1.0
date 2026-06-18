import React, { useCallback, useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { ResizeMode, Video } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useTheme } from "@/hooks/use-theme";
import { SafeAreaView } from "react-native-safe-area-context";

import { ArrowLeft, MapPin, PencilSimple } from "phosphor-react-native";

import { API } from "../../services/api";

const PropertyView = () => {
  const router = useRouter();
  const { colors } = useTheme();

  const { propertyId } = useLocalSearchParams<any>();

  const videoRef = useRef<Video>(null);

  const [property, setProperty] = useState<any>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const userRole:string = "client";

  const fetchProperty = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await API.get(`/agentid/property/${propertyId}`);

      setProperty(res.data);
    } catch (err: any) {
      console.log(
        "❌ Property Fetch Error:",
        err?.response?.data || err.message,
      );

      setError("Failed to load property");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    if (propertyId) {
      fetchProperty();
    }
  }, [fetchProperty, propertyId]);

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
          backgroundColor: colors.background,
        }}
      >
        <Text
          style={{
            color: colors.text,
            textAlign: "center",
          }}
        >
          {error}
        </Text>

        <TouchableOpacity
          onPress={fetchProperty}
          style={{
            marginTop: 15,
            backgroundColor: colors.primary,
            padding: 14,
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontWeight: "bold",
            }}
          >
            Retry
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!property) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <Text
          style={{
            color: colors.text,
          }}
        >
          Not found
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: colors.background,
      }}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          top: Platform.OS === "ios" ? 60 : 40,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 5,
          elevation: 10,
        }}
        className="absolute left-6 z-50 h-12 w-12 items-center justify-center rounded-full bg-white/90"
      >
        <ArrowLeft size={22} color="#000" weight="bold" />
      </TouchableOpacity>

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 140,
        }}
      >
        {/* HERO */}
        <View className="relative h-100 w-full">
          <Image
            source={{
              uri: property?.images?.[0] || "https://via.placeholder.com/600",
            }}
            className="h-full w-full"
            resizeMode="cover"
          />

          <View
            className="absolute right-5 top-13 flex-row items-center rounded-sm border-[0.5px] px-3 py-3"
            style={{
              backgroundColor: "rgba(255,255,255,0.8)",
              borderColor: "rgba(0,0,0,0.1)",
            }}
          >
            <Text
              className="text-[10px] font-bold uppercase tracking-[2px]"
              style={{
                color: "#000",
              }}
            >
              {property?.propertyType}
            </Text>
          </View>
        </View>

        {/* CONTENT */}
        <View
          className="rounded-t-[45px] px-6 pt-10 -mt-12"
          style={{
            backgroundColor: colors.background,
          }}
        >
          {/* TITLE */}
          <Text
            className="mb-2 text-3xl font-black leading-tight"
            style={{
              color: colors.text,
            }}
          >
            {property?.title || "Untitled Property"}
          </Text>

          {/* LOCATION */}
          <View className="mb-8 flex-row items-center">
            <View className="rounded-lg bg-blue-500/10 p-1.5">
              <MapPin size={16} color={colors.text} weight="bold" />
            </View>

            <Text
              className="ml-2 text-sm font-bold opacity-50"
              style={{
                color: colors.text,
              }}
            >
              {property?.location}
            </Text>
          </View>

          {/* VIDEO */}
          {property?.video && (
            <View className="mb-10">
              <Text
                className="mb-5 text-xs font-black uppercase tracking-[2px] opacity-40"
                style={{
                  color: colors.text,
                }}
              >
                Virtual Tour
              </Text>

              <View
                style={{
                  shadowColor: colors.text,
                  shadowOffset: {
                    width: 0,
                    height: 10,
                  },
                  shadowOpacity: 0.15,
                  shadowRadius: 20,
                  elevation: 10,
                }}
                className="h-60 overflow-hidden rounded-[35px] bg-black"
              >
                <Video
                  ref={videoRef}
                  source={{
                    uri: property.video,
                  }}
                  style={{
                    flex: 1,
                  }}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={false}
                  isLooping
                  useNativeControls
                />
              </View>
            </View>
          )}

          {/* DESCRIPTION */}
          <Text
            className="mb-4 text-xs font-black uppercase tracking-[2px] opacity-40"
            style={{
              color: colors.text,
            }}
          >
            About the property
          </Text>

          <Text
            className="text-[15px] font-medium leading-7 opacity-70"
            style={{
              color: colors.text,
            }}
          >
            {property?.description || "No description available"}
          </Text>
        </View>
      </ScrollView>

      {/* ACTION BAR */}
      <View
        className="absolute bottom-0 left-0 right-0 flex-row items-center justify-between border-t border-gray-100 px-8 pb-5 pt-5 dark:border-gray-800"
        style={{
          backgroundColor:
            Platform.OS === "ios" ? "rgba(255,255,255,0.9)" : colors.background,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -10,
          },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        }}
      >
        <View className="mr-6 flex-1">
          <Text
            className="text-[10px] font-black uppercase tracking-widest opacity-30"
            style={{
              color: colors.text,
            }}
          >
            TOTAL PRICE
          </Text>

          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            className="text-2xl font-black tracking-tighter"
            style={{
              color: colors.text,
            }}
          >
            ₦{Number(property?.price || 0).toLocaleString()}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          style={{ backgroundColor: colors.primary }}
          className="h-15 flex-row items-center justify-center rounded-2x px-10 shadow-lg"
          activeOpacity={0.9}
        >
          {userRole === "agent" && (
            <View className="mr-2">
              <PencilSimple size={18} color={colors.background} weight="bold" />
            </View>
          )}

          <Text
            className="text-sm font-black uppercase tracking-widest"
            style={{
              color: "#ffffff",
            }}
          >
            {userRole === "agent" ? "Edit Listing" : "View Listings"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PropertyView;

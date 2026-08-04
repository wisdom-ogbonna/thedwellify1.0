// app/(tabs)/chats.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SquarePen, Search, Plus } from "lucide-react-native";
import { Stack, router } from "expo-router";
import { useTheme } from "@/hooks/use-theme";

interface StoryItem {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
}

interface ChatItem {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  isOnline: boolean;
  isGroupOrProperty?: boolean;
}

export default function ChatsScreen() {
  const { colors, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  // Mock Data mimicking your provided reference image layout
  const stories: StoryItem[] = [
    {
      id: "1",
      name: "John Samuel",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150",
      isOnline: true,
    },
    {
      id: "2",
      name: "Mary Johnson",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150",
      isOnline: true,
    },
    {
      id: "3",
      name: "3 Bedroom Apartment",
      avatar:
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=150",
      isOnline: false,
    },
    {
      id: "4",
      name: "Alex Brown",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150",
      isOnline: false,
    },
  ];

  const chats: ChatItem[] = [
    {
      id: "1",
      name: "John Samuel",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150",
      lastMessage: "Hi, is this property still available?",
      time: "9:41 AM",
      unreadCount: 2,
      isOnline: true,
    },
    {
      id: "2",
      name: "Mary Johnson",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150",
      lastMessage: "Thank you for your interest. Would you...",
      time: "9:30 AM",
      unreadCount: 1,
      isOnline: true,
    },
    {
      id: "3",
      name: "3 Bedroom Apartment",
      avatar:
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=150",
      lastMessage: "You: Thanks! I'll check it out.",
      time: "9:02 AM",
      unreadCount: 0,
      isOnline: false,
      isGroupOrProperty: true,
    },
    {
      id: "4",
      name: "Alex Brown",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150",
      lastMessage: "Alright, I will send you the details.",
      time: "8:45 AM",
      unreadCount: 0,
      isOnline: true,
    },
    {
      id: "5",
      name: "The Oakview Villa",
      avatar:
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=150",
      lastMessage: "You: When can we discuss the price?",
      time: "Yesterday",
      unreadCount: 0,
      isOnline: false,
      isGroupOrProperty: true,
    },
    {
      id: "6",
      name: "Susan Williams",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150",
      lastMessage: "Sure, let me know a convenient time.",
      time: "Yesterday",
      unreadCount: 0,
      isOnline: true,
    },
    {
      id: "7",
      name: "1500 Sqm Land",
      avatar:
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=150",
      lastMessage: "You: Please send me the survey plan.",
      time: "2 days ago",
      unreadCount: 0,
      isOnline: false,
      isGroupOrProperty: true,
    },
  ];

  return (
    <SafeAreaView
      style={{ backgroundColor: colors.background, flex: 1 }}
      edges={["top"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* 1. Header Area Section */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "800",
            color: colors.text,
            fontFamily: "Poppins",
          }}
        >
          Chats
        </Text>
        <TouchableOpacity
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <SquarePen size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 2. Search Input Bar */}
      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: `${colors.placeholder}70`,
            borderRadius: 24,
            paddingHorizontal: 12,
            height: 50,
          }}
        >
          <Search size={18} color={`${colors.text}90`} />
          <TextInput
            placeholder="Search"
            placeholderTextColor={`${colors.text}90`}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              flex: 1,
              marginLeft: 8,
              color: colors.background,
              fontSize: 16,
            }}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* 3. Horizontal Stories / Active Channel Rows */}
        <View style={{ marginBottom: 16 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
          >
            {/* Create Room Interactive Node */}
            <View style={{ alignItems: "center", width: 68 }}>
              <TouchableOpacity
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: `${colors.placeholder}70`,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <Plus size={22} color={colors.text} />
              </TouchableOpacity>
              <Text
                numberOfLines={2}
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: `${colors.text}90`,
                  textAlign: "center",
                  lineHeight: 14,
                }}
              >
                Create room
              </Text>
            </View>

            {/* Stories Mapping Output list */}
            {stories.map((story) => (
              <TouchableOpacity
                key={story.id}
                style={{ alignItems: "center", width: 68 }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    position: "relative",
                    marginBottom: 6,
                  }}
                >
                  <Image
                    source={{ uri: story.avatar }}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      borderWidth: 2,
                      borderColor: colors.primary,
                    }}
                  />
                  {story.isOnline && (
                    <View
                      style={{
                        position: "absolute",
                        bottom: 2,
                        right: 2,
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: colors.success,
                        borderWidth: 2,
                        borderColor: colors.background,
                      }}
                    />
                  )}
                </View>
                <Text
                  numberOfLines={2}
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: colors.placeholder,
                    textAlign: "center",
                    lineHeight: 14,
                  }}
                >
                  {story.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 4. Active Threads Messaging Conversations List Stack Layout */}
        <View style={{ paddingHorizontal: 16 }}>
          {chats.map((chat) => (
            <TouchableOpacity
              key={chat.id}
              onPress={() => router.push(`/(utilities)/chats/?id=${chat.id}`)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
              }}
            >
              <View style={{ position: "relative", marginRight: 14 }}>
                <Image
                  source={{ uri: chat.avatar }}
                  style={{ width: 52, height: 52, borderRadius: 26 }}
                />
                {chat.isOnline && (
                  <View
                    style={{
                      position: "absolute",
                      bottom: 1,
                      right: 1,
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: colors.success,
                      borderWidth: 2,
                      borderColor: colors.background,
                    }}
                  />
                )}
              </View>

              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 4,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: colors.text,
                    }}
                  >
                    {chat.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color:
                        chat.unreadCount > 0
                          ? colors.primary
                          : colors.placeholder,
                      fontWeight: chat.unreadCount > 0 ? "700" : "400",
                    }}
                  >
                    {chat.time}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 14,
                      color:
                        chat.unreadCount > 0 ? colors.text : colors.placeholder,
                      fontWeight: chat.unreadCount > 0 ? "600" : "400",
                      flex: 1,
                      paddingRight: 8,
                    }}
                  >
                    {chat.lastMessage}
                  </Text>

                  {chat.unreadCount > 0 ? (
                    <View
                      style={{
                        backgroundColor: colors.primary,
                        minWidth: 20,
                        height: 20,
                        borderRadius: 10,
                        justifyContent: "center",
                        alignItems: "center",
                        paddingHorizontal: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.background,
                          fontSize: 11,
                          fontWeight: "700",
                        }}
                      >
                        {chat.unreadCount}
                      </Text>
                    </View>
                  ) : (
                    chat.isGroupOrProperty && (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: colors.primary,
                        }}
                      />
                    )
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

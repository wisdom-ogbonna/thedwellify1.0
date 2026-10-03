import { useTheme } from "@/hooks/use-theme";
import * as Icons from "phosphor-react-native";
import React from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MiniProfile from "./components/mini-profile";

const { width } = Dimensions.get("window");

type SidebarItem = {
  label: string;
  icon: keyof typeof Icons;
  onPress?: () => void;
  isActive?: boolean;
};

type SidebarProps = {
  visible: boolean;
  name: string;
  rating: number | null;
  translateX: Animated.Value;
  onOverlayPress: () => void;
  items: SidebarItem[];
};

const Sidebar: React.FC<SidebarProps> = ({
  visible,
  name,
  rating,
  translateX,
  onOverlayPress,
  items,
}) => {
  const { colors } = useTheme();

  if (!visible) return null;

  const primaryItems = items.filter((item) =>
    ["Home", "Discover", "Search", "Explore", "Properties", "Saved"].includes(
      item.label,
    ),
  );
  const utilityItems = items.filter((item) => !primaryItems.includes(item));

  const getAlphaColor = (hex: string, alphaHex: string) => {
    return hex.startsWith("#") && hex.length === 7 ? `${hex}${alphaHex}` : hex;
  };

  return (
    <View className="absolute inset-0 z-50 h-screen">
      <TouchableOpacity
        className="absolute inset-0 bg-black/60"
        onPress={onOverlayPress}
      />

      <Animated.View
        style={[
          { transform: [{ translateX }] },
          { width: width * 0.85 },
          {
            backgroundColor: colors.background,
            borderRightWidth: 1,
            borderRightColor: colors.border,
            shadowColor: "#000",
            shadowOffset: { width: 15, height: 0 },
            shadowOpacity: 0.15,
            shadowRadius: 30,
            elevation: 24,
          },
        ]}
        className="absolute left-0 top-0 bottom-0 flex flex-col"
      >
        {/* Profile Section */}
        <View className="flex-row items-center gap-4 px-6 pt-16 pb-6">
          <MiniProfile name={name} rating={rating} />
        </View>

        {/* Dynamic Divider Line */}
        <View style={{ height: 1, backgroundColor: colors.border }} />

        {/* Scrollable Navigation */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingVertical: 16,
            paddingHorizontal: 14,
            paddingBottom: 80,
          }}
        >
          {/* Primary Navigation */}
          <View style={{ gap: 6 }}>
            {primaryItems.map((item, index) => {
              const IconComponent = Icons[
                item.icon
              ] as React.ComponentType<any>;
              const isCurrent = item.isActive;

              return (
                <TouchableOpacity
                  key={index}
                  onPress={item.onPress}
                  activeOpacity={0.75}
                  className="flex-row items-center rounded-2xl overflow-hidden"
                  style={{
                    gap: 16,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    backgroundColor: isCurrent
                      ? getAlphaColor(colors.primary, "24") // ~14% Opacity Surface Accent
                      : "transparent",
                    borderWidth: 1,
                    borderColor: isCurrent
                      ? getAlphaColor(colors.primary, "4D")
                      : "transparent",
                  }}
                >
                  {/* Active Indicator Bar */}
                  {isCurrent && (
                    <View
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 12,
                        bottom: 12,
                        width: 4,
                        borderRadius: 4,
                        backgroundColor: colors.primary,
                      }}
                    />
                  )}

                  {/* Icon Container */}
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isCurrent
                        ? getAlphaColor(colors.primary, "33")
                        : getAlphaColor(colors.border, "66"),
                    }}
                  >
                    {IconComponent && (
                      <IconComponent
                        size={22}
                        color={isCurrent ? colors.primary : colors.placeholder}
                        weight={isCurrent ? "duotone" : "regular"}
                      />
                    )}
                  </View>

                  {/* Label */}
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 16,
                      color: isCurrent
                        ? colors.text
                        : getAlphaColor(colors.text, "CC"),
                      fontWeight: isCurrent ? "700" : "600",
                    }}
                  >
                    {item.label}
                  </Text>

                  <Icons.ArrowUpRight
                    size={16}
                    color={isCurrent ? colors.primary : colors.placeholder}
                    weight="bold"
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Utility/Preferences Section */}
          {utilityItems.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "800",
                  color: colors.placeholder,
                  letterSpacing: 2.5,
                  textTransform: "uppercase",
                  marginTop: 24,
                  marginBottom: 8,
                  paddingHorizontal: 6,
                }}
              >
                Preferences
              </Text>

              <View style={{ gap: 6 }}>
                {utilityItems.map((item, index) => {
                  const IconComponent = Icons[
                    item.icon
                  ] as React.ComponentType<any>;
                  const isCurrent = item.isActive;

                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={item.onPress}
                      activeOpacity={0.75}
                      className="flex-row items-center rounded-2xl"
                      style={{
                        gap: 16,
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        backgroundColor: isCurrent
                          ? getAlphaColor(colors.primary, "24")
                          : "transparent",
                      }}
                    >
                      <View
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: isCurrent
                            ? getAlphaColor(colors.primary, "33")
                            : getAlphaColor(colors.border, "66"),
                        }}
                      >
                        {IconComponent && (
                          <IconComponent
                            size={22}
                            color={
                              isCurrent ? colors.primary : colors.placeholder
                            }
                            weight={isCurrent ? "fill" : "regular"}
                          />
                        )}
                      </View>
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 16,
                          fontWeight: "600",
                          color: isCurrent
                            ? colors.text
                            : getAlphaColor(colors.text, "E6"),
                        }}
                      >
                        {item.label}
                      </Text>
                      <Icons.CaretRight
                        size={18}
                        color={colors.placeholder}
                        weight="bold"
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Dock CTA (Refactored themed fallback structure if uncommented) */}
        {/* <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: 32,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            gap: 20,
            marginBottom: 40,
          }}
        >
          <TouchableOpacity
            onPress={buttonOnPress}
            activeOpacity={0.88}
            className="flex-row items-center justify-center rounded-[14px]"
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 16,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 10,
            }}
          >
            <Text
              style={{
                color: "#fff", // Kept constant for high CTA legibility over solid primary colors
                fontSize: 14,
                fontWeight: "700",
                letterSpacing: 2,
              }}
            >
              {buttonName.toUpperCase()}
            </Text>
          </TouchableOpacity>

          <View style={{ alignItems: "center", justifyContent: "center" }}>
            <SocialIcons />
          </View> 
        </View> 
        */}
      </Animated.View>
    </View>
  );
};

export default Sidebar;

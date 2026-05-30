import React from "react";
import { View, TouchableOpacity } from "react-native";
import {
  FacebookLogo,
  InstagramLogo,
} from "phosphor-react-native";

const SocialIcons = () => {
  return (
    <View className="flex-row items-center justify-center space-x-6 py-2">
      {/* Facebook Icon */}
      <TouchableOpacity
        activeOpacity={0.7}
        className="p-2 rounded-full active:bg-white/5"
      >
        <FacebookLogo
          size={26}
          color="#b3b3b3"
          weight="regular"
        />
      </TouchableOpacity>

      {/* Instagram Icon */}
      <TouchableOpacity
        activeOpacity={0.7}
        className="p-2 rounded-full active:bg-white/5"
      >
        <InstagramLogo size={26} color="#b3b3b3" weight="regular" />
      </TouchableOpacity>
    </View>
  );
};

export default SocialIcons;

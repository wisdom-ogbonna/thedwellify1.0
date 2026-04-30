import React from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { useTheme } from "@react-navigation/native";

interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  onSelect: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  activeCategory,
  onSelect,
}) => {
  const { colors } = useTheme();

  return (
    <View className="py-4">
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={categories}
        keyExtractor={(item) => item}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
        renderItem={({ item }) => {
          const isActive = activeCategory === item;

          return (
            <Pressable
              onPress={() => onSelect(item)}
              style={{
                backgroundColor: isActive ? colors.primary : colors.card,
                borderColor: isActive ? colors.primary : colors.border,
                borderWidth: 1,
              }}
              className="px-6 py-2.5 rounded-2xl active:opacity-80 transition-all"
            >
              <Text
                style={{
                  color: isActive ? "white" : colors.text,
                }}
                className={`text-sm font-bold ${!isActive && "opacity-60"}`}
              >
                {item}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
};

export default CategoryFilter;

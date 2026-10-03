import { Colors } from "@/constants/theme";
import { useColorScheme } from "react-native";

export function useTheme() {
  const scheme = useColorScheme() ?? "light";
  return {
    colors: Colors[scheme],
    isDark: scheme === "dark",
  };
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

type ThemeMode = "system" | "light" | "dark";

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: "system",
  isDark: false,
  setThemeMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    AsyncStorage.getItem("theme_mode").then((val) => {
      if (val === "light" || val === "dark") {
        setThemeModeState(val);
      } else {
        setThemeModeState("system");
        AsyncStorage.setItem("theme_mode", "system");
      }
    });
  }, []);

  const isDark =
    themeMode === "dark" ||
    (themeMode === "system" && systemScheme === "dark");

  async function setThemeMode(mode: ThemeMode) {
    setThemeModeState(mode);
    await AsyncStorage.setItem("theme_mode", mode);
  }

  return (
    <ThemeContext.Provider value={{ themeMode, isDark, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

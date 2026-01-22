import { useAuthStore } from "@/lib/stores/auth-store";
import { useLanguageStore } from "@/lib/stores/language-store";
import { useUIStore } from "@/lib/stores/ui-store";
import { useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText, ThemedView } from "../ui";
import MainDrawer from "./main-drawer";

export function MainNav() {
  const router = useRouter();
  const segments = useSegments();
  const { user, logout } = useAuthStore();
  const { hideThermalPolaroidName } = useUIStore();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const { language } = useLanguageStore();
  // Wait for navigation to be ready
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsNavigationReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleNavigate = (path: string) => {
    if (isNavigationReady) {
      router.push(path as any);
    }
  };

 

  return (
    <ThemedView
      style={{
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outline,
        paddingTop: insets.top + 8,
        backgroundColor: theme.colors.surface,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo/Brand */}

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <MainDrawer />

          <TouchableOpacity
            onPress={() => handleNavigate("/(tabs)")}
            style={{ flexDirection: "row", alignItems: "flex-end" }}
          >
            {/* <Image
              source={require("@/assets/images/ThermalPolaroid-com-new-rgb-314x113.png")}
              style={{
                height: 40,
                width: 111, // Maintain aspect ratio: 314/113 = 2.78, so 40 * 2.78 ≈ 111
                resizeMode: "contain",
              }}
            /> */}
            {!hideThermalPolaroidName && (
              <ThemedText
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: "orange",
                }}
              >
               ThermalPolaroid POS System
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}

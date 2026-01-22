import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { MainNav } from "@/components/shared";
import CustomTabBar from "@/components/shared/custom-tab-bar";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useLanguageStore } from "@/lib/stores/language-store";
import { Redirect } from "expo-router";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated } = useAuthStore();
  const { language } = useLanguageStore();



  return (
    <View className="flex-1">
      <MainNav />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: { display: 'none' }, // Hide default tab bar, we'll use custom one
        }}
      >
        <Tabs.Screen
          name="photo-print"
          options={{
           href: null,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
           href: null,
          }}
        />

       
      </Tabs>
    </View>
  );
}

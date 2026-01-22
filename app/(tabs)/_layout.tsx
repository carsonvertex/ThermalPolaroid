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

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

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
          name="index"
          options={{
            href: null, // Hide from tab bar
          }}
        />

        <Tabs.Screen
          name="dashboard"
          options={{
            href: null, // Hide from tab bar, accessible via swipeable container
          }}
        />

        <Tabs.Screen
          name="simple-order"
          options={{
            href: null, // Hide from tab bar, accessible via swipeable container
          }}
        />

        <Tabs.Screen
          name="order-record"
          options={{
            href: null, // Hide from tab bar, accessible via swipeable container
          }}
        />

        <Tabs.Screen
          name="product-master"
          options={{
           href: null,
          }}
        />
        {/* Hidden tabs */}

        <Tabs.Screen
          name="accounts"
          options={{
           href: null,
          }}
        />

        <Tabs.Screen
          name="admin-photo-print"
          options={{
           href: null,
          }}
        />
        <Tabs.Screen
          name="admin-version-control"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="devices"
          options={{
            href: null,
          }}
        />

        <Tabs.Screen
          name="today-sales"
          options={{
            title: language === "en" ? "Today Sales" : "今日銷售",
            href: null,
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
           href: null,
          }}
        />

        <Tabs.Screen
          name="upload-sales-records"
          options={{
            href: null,
          }}
        />

        <Tabs.Screen
          name="example"
          options={{
            href: null, // Hide from tab bar
          }}
        />
      </Tabs>
      <CustomTabBar />
    </View>
  );
}

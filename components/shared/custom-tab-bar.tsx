import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { isSwipeableTab, SwipeableTab, useTabContext } from "@/lib/contexts/tab-context";
import { useLanguageStore } from "@/lib/stores/language-store";
import { useUIStore } from "@/lib/stores/ui-store";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';
import { useRouter, useSegments } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabConfig = {
  name: string;
  tab: SwipeableTab;
  icon: string;
  label: {
    en: string;
    zh: string;
  };
};

const tabs: TabConfig[] = [
  {
    name: "dashboard",
    tab: "dashboard",
    icon: "dashboard",
    label: { en: "Dashboard", zh: "儀表板" },
  },
  {
    name: "simple-order",
    tab: "simple-order",
    icon: "receipt",
    label: { en: "Simple Order", zh: "簡單訂單" },
  },
  {
    name: "order-record",
    tab: "order-record",
    icon: "history",
    label: { en: "Order Records", zh: "訂單記錄" },
  },
];

export default function CustomTabBar() {
  const { activeTab, setActiveTab } = useTabContext();
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const systemColorScheme = useColorScheme();
  const { theme: uiTheme } = useUIStore();
  const { language } = useLanguageStore();

  // Resolve theme: use UI store theme if set, otherwise fall back to system color scheme
  // If UI theme is 'auto', use system color scheme
  const resolvedColorScheme = useMemo(() => {
    if (uiTheme === 'auto') {
      return systemColorScheme ?? 'light';
    }
    return uiTheme;
  }, [uiTheme, systemColorScheme]);

  // Check if we're currently on a swipeable tab route
  // When on index route, the segment is '(tabs)', and we check if activeTab is a swipeable tab
  const lastSegment = segments[segments.length - 1];
  const isOnSwipeableRoute = lastSegment === '(tabs)' || 
    (lastSegment && isSwipeableTab(lastSegment));

  // Sync activeTab with current route when on a swipeable tab route
  useEffect(() => {
    const currentRoute = segments[segments.length - 1];
    if (currentRoute && isSwipeableTab(currentRoute)) {
      setActiveTab(currentRoute);
    } else if (currentRoute === '(tabs)' && isSwipeableTab(activeTab)) {
      // Already on index route with correct tab, no need to change
    }
  }, [segments, setActiveTab, activeTab]);

  const handleTabPress = (tab: SwipeableTab) => {
    // Haptic feedback
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Set the active tab first
    setActiveTab(tab);

    // If we're on a hidden tab (not swipeable), navigate to index route
    if (!isOnSwipeableRoute) {
      // Use replace to navigate to index, which will show the swipeable container
      router.replace('/(tabs)');
    }
  };

  const activeColor = Colors[resolvedColorScheme].tint;
  const inactiveColor = Colors[resolvedColorScheme].tabIconDefault;

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors[resolvedColorScheme].background,
        borderTopWidth: 1,
        borderTopColor: resolvedColorScheme === 'dark' ? '#333' : '#e0e0e0',
        paddingBottom: insets.bottom,
        paddingTop: 8,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
        }}
      >
        {tabs.map((tabConfig) => {
          const isActive = activeTab === tabConfig.tab && isOnSwipeableRoute;
          const iconColor = isActive ? activeColor : inactiveColor;
          const textColor = isActive ? activeColor : inactiveColor;

          return (
            <TouchableOpacity
              key={tabConfig.name}
              activeOpacity={0.7}
              onPress={() => handleTabPress(tabConfig.tab)}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 4,
              }}
            >
              <MaterialIcons name={tabConfig.icon as any} size={28} color={iconColor} />
              <Text
                style={{
                  color: textColor,
                  fontSize: 10,
                  marginTop: 4,
                  fontWeight: isActive ? '600' : '400',
                }}
              >
                {language === "en" ? tabConfig.label.en : tabConfig.label.zh}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}


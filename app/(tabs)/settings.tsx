import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";

import { BackendConnectionCard } from "@/components/_loginComponents/BackendConnectionCard";
import { DeviceInfoCard } from "@/components/_loginComponents/DeviceInfoCard";
import { AppUpdateCard } from "@/components/_settingsComponents/AppUpdateCard";
import { ThemedText, ThemedView } from "@/components/ui";
import { resetDatabase } from "@/endpoints/sqlite";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useLanguageStore } from "@/lib/stores/language-store";
import { useUIStore } from "@/lib/stores/ui-store";
import { MaterialIcons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Card, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const [busy, setBusy] = useState(false);
  const { logout, user } = useAuthStore();
  const { theme: uiTheme, setTheme, hideThermalPolaroidName, setHideThermalPolaroidName } = useUIStore();
  const { language, setLanguage } = useLanguageStore();
  const paperTheme = useTheme();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const isAdmin = user?.role === "admin" || user?.role === "developer";

  // Calculate tab bar height: paddingTop(8) + icon(28) + text margin(4) + text(~14) + padding(8) + safe area
  const TAB_BAR_HEIGHT = 8 + 28 + 4 + 14 + 8 + insets.bottom;

  const handleReset = async () => {
    Alert.alert(
      language === "en" ? "Reset Database" : "重置資料庫",
      language === "en"
        ? "This will delete all local data. Continue?"
        : "這將刪除所有本地數據。繼續嗎？",
      [
        { text: language === "en" ? "Cancel" : "取消", style: "cancel" },
        {
          text: language === "en" ? "Reset" : "重置",
          style: "destructive",
          onPress: async () => {
            try {
              setBusy(true);
              await resetDatabase();

              // Clear all React Query cache
              queryClient.clear();

              // Immediately log out and go to login screen
              logout();
              router.replace("/login");
              Alert.alert(
                "Done",
                "Database has been reset. You have been signed out."
              );
            } catch (e) {
              Alert.alert("Error", "Failed to reset the database");
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ThemedView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 16 }}
        >
          <View style={{ padding: 16 }}>
            {/* Header */}
            <View style={{ marginBottom: 24 }}>
              <ThemedText
                style={{ fontSize: 28, fontWeight: "bold", marginBottom: 4 }}
              >
                {language === "en" ? "Settings" : "設定"}
              </ThemedText>
              <ThemedText style={{ fontSize: 14, opacity: 0.7 }}>
                {language === "en"
                  ? "Manage your preferences and data"
                  : "管理您的偏好設定和數據"}
              </ThemedText>
            </View>

            {/* Theme Settings */}
            <Card
              style={{
                marginBottom: 16,
                backgroundColor: paperTheme.colors.surface,
              }}
              elevation={2}
            >
              <Card.Content style={{ padding: 16 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flex: 1,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: "#2196F3",
                        padding: 12,
                        borderRadius: 12,
                        marginRight: 16,
                      }}
                    >
                      <MaterialIcons name="palette" size={24} color="#fff" />
                    </View>

                    <View style={{ flex: 1 }}>
                      <ThemedText
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          marginBottom: 4,
                        }}
                      >
                        {language === "en" ? "Theme" : "主題"}
                      </ThemedText>
                      <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                        {uiTheme === "auto"
                          ? language === "en"
                            ? "Auto (follows system)"
                            : "自動 (跟隨系統)"
                          : uiTheme === "dark"
                          ? language === "en"
                            ? "Dark Mode"
                            : "暗色模式"
                          : language === "en"
                          ? "Light Mode"
                          : "亮色模式"}
                      </ThemedText>
                    </View>
                  </View>
                  <Switch
                    value={uiTheme === "dark"}
                    onValueChange={(value) =>
                      setTheme(value ? "dark" : "light")
                    }
                  />
                </View>
              </Card.Content>
            </Card>

            {/* Language Settings */}
            <Card
              style={{
                marginBottom: 16,
                backgroundColor: paperTheme.colors.surface,
              }}
              elevation={2}
            >
              <Card.Content style={{ padding: 16 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flex: 1,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: "#9C27B0",
                        padding: 12,
                        borderRadius: 12,
                        marginRight: 16,
                      }}
                    >
                      <MaterialIcons name="language" size={24} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          marginBottom: 4,
                        }}
                      >
                        {language === "en" ? "Language" : "語言"}
                      </ThemedText>
                      <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                        {language === "en" ? "English" : "中文"}
                      </ThemedText>
                    </View>
                  </View>
                  <Switch
                    value={language === "zh"}
                    onValueChange={(value) => setLanguage(value ? "zh" : "en")}
                  />
                </View>
              </Card.Content>
            </Card>

            {/* Header Display Settings */}
            <Card
              style={{
                marginBottom: 16,
                backgroundColor: paperTheme.colors.surface,
              }}
              elevation={2}
            >
              <Card.Content style={{ padding: 16 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flex: 1,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: "#FF9800",
                        padding: 12,
                        borderRadius: 12,
                        marginRight: 16,
                      }}
                    >
                      <MaterialIcons name="visibility-off" size={24} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          marginBottom: 4,
                        }}
                      >
                        {language === "en" ? "Hide Brand Name" : "隱藏品牌名稱"}
                      </ThemedText>
                      <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                        {language === "en"
                          ? "Hide 'ThermalPolaroid POS System' from header"
                          : "從標題中隱藏 'ThermalPolaroid POS System'"}
                      </ThemedText>
                    </View>
                  </View>
                  <Switch
                    value={hideThermalPolaroidName}
                    onValueChange={setHideThermalPolaroidName}
                  />
                </View>
              </Card.Content>
            </Card>

            {/* Database Settings - Admin Only */}
            {isAdmin && (
              <Card
                style={{
                  marginBottom: 16,
                  backgroundColor: paperTheme.colors.surface,
                }}
                elevation={2}
              >
                <Card.Content style={{ padding: 16 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: "#F44336",
                        padding: 12,
                        borderRadius: 12,
                        marginRight: 16,
                      }}
                    >
                      <MaterialIcons name="storage" size={24} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          marginBottom: 4,
                        }}
                      >
                        {language === "en" ? "Database" : "資料庫"}
                      </ThemedText>
                      <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                        {language === "en"
                          ? "Manage your local data (Admin Only)"
                          : "管理您的本地數據（僅限管理員）"}
                      </ThemedText>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={{
                      backgroundColor: "#F44336",
                      borderRadius: 8,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      opacity: busy ? 0.5 : 1,
                    }}
                    disabled={busy}
                    onPress={handleReset}
                  >
                    <ThemedText
                      style={{
                        color: "#fff",
                        textAlign: "center",
                        fontWeight: "600",
                        fontSize: 14,
                      }}
                    >
                      {language === "en" ? "Reset Database" : "重置資料庫"}
                    </ThemedText>
                  </TouchableOpacity>
                </Card.Content>
              </Card>
            )}

            <AppUpdateCard language={language} />
            <BackendConnectionCard language={language} />
            <DeviceInfoCard language={language} />
          </View>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

import { useAuthStore } from "@/lib/stores/auth-store";
import { useLanguageStore } from "@/lib/stores/language-store";
import { useUIStore } from "@/lib/stores/ui-store";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Modal, Pressable, SafeAreaView, TouchableOpacity, View } from "react-native";
import {
  Divider,
  Drawer,
  IconButton,
  Portal,
  useTheme,
} from "react-native-paper";
import { ThemedText } from "../ui";
import { useTabContext } from "@/lib/contexts/tab-context";

export default function MainDrawer({}: {}) {
  const { user: currentUser, logout } = useAuthStore();
  const theme = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();
  const { language } = useLanguageStore();
  const { setTheme } = useUIStore();
  const { setActiveTab } = useTabContext();
  const handleLogout = () => {
    Alert.alert(
      language === "en" ? "Logout" : "登出",
      language === "en"
        ? "Are you sure you want to logout?"
        : "您確定要登出嗎？",
      [
        {
          text: language === "en" ? "Cancel" : "取消",
          style: "cancel",
        },
        {
          text: language === "en" ? "Logout" : "登出",
          style: "destructive",
          onPress: () => {
            setTheme("light");
            logout();
            router.replace("/login");
          },
        },
      ]
    );
  };
  return (
    <>
      <TouchableOpacity className="" onPress={() => setShowMenu(true)} >
        <IconButton
          icon="menu"
          size={24}
          iconColor="orange"
        />
      </TouchableOpacity>

      <Portal>
        <Modal
          visible={showMenu}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowMenu(false)}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            }}
            onPress={() => setShowMenu(false)}
          >
            <Pressable
              style={{
                width: 280,
                height: "100%",
                backgroundColor: theme.colors.surface,
              }}
              onPress={(e) => e.stopPropagation()}
            >
              <SafeAreaView
                style={{ flex: 1, backgroundColor: theme.colors.surface }}
              >
                {/* Header */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottomWidth: 1,
                    paddingHorizontal: 16,
                    paddingTop: 16,
                    borderBottomColor: theme.colors.outline,
                    backgroundColor: theme.colors.surface,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    {currentUser && (
                      <>
                        {/* User Info */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <View
                            style={{
                              backgroundColor: theme.colors.primaryContainer,
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 9999,
                            }}
                          >
                            <ThemedText
                              style={{
                                fontSize: 12,
                                fontWeight: "600",
                                textTransform: "uppercase",
                                color: theme.colors.onPrimaryContainer,
                              }}
                            >
                              {currentUser.role}
                            </ThemedText>
                          </View>
                          <ThemedText
                            style={{ fontSize: 14, fontWeight: "500" }}
                          >
                            {currentUser.name}
                          </ThemedText>
                        </View>
                      </>
                    )}
                  </View>
                  <IconButton
                    icon="close"
                    size={24}
                    onPress={() => setShowMenu(false)}
                  />
                </View>

                {/* Menu Items */}
                <>
                  <ThemedText
                    style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      paddingHorizontal: 16,
                      paddingTop: 16,
                    }}
                  >
                    {language === "en" ? "General" : "一般"}
                  </ThemedText>
                  <Drawer.Item
                    label={language === "en" ? "Dashboard" : "儀表板"}
                    icon="view-dashboard"
                    onPress={() => {
                      setShowMenu(false);
                      setActiveTab('dashboard');
                      router.push("/(tabs)");
                    }}
                    style={{ backgroundColor: theme.colors.surface }}
                  />
                  <Drawer.Item
                    label={language === "en" ? "Settings" : "設置"}
                    icon="cog"
                    onPress={() => {
                      setShowMenu(false);
                      router.push("/(tabs)/settings");
                    }}
                    style={{ backgroundColor: theme.colors.surface }}
                  />
                  <Drawer.Item
                    label={language === "en" ? "Product " : "產品主檔"}
                    icon="view-list"
                    onPress={() => {
                      setShowMenu(false);
                      router.push("/(tabs)/product-master");
                    }}
                    style={{ backgroundColor: theme.colors.surface }}
                  />
                  <Drawer.Item
                    label={
                      language === "en"
                        ? "Upload Sales Records"
                        : "上傳銷售記錄"
                    }
                    icon="file-upload"
                    onPress={() => {
                      setShowMenu(false);
                      router.push("/(tabs)/upload-sales-records");
                    }}
                    style={{ backgroundColor: theme.colors.surface }}
                  />
                  <Divider />
                </>

                {/* Admin-only menu */}
                {(currentUser?.role === "admin" ||
                  currentUser?.role === "developer") && (
                  <>
                    <ThemedText
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        paddingHorizontal: 16,
                        paddingTop: 16,
                      }}
                    >
                      {language === "en" ? "Administrator" : "管理員"}
                    </ThemedText>

                    {/* Admin-only menu item */}
                    <Drawer.Item
                      label={language === "en" ? "Accounts" : "帳戶"}
                      icon="account-circle"
                      onPress={() => {
                        setShowMenu(false);
                        router.push("/(tabs)/accounts");
                      }}
                      style={{ backgroundColor: theme.colors.surface }}
                    />
                    <Drawer.Item
                      label={language === "en" ? "Photo Print" : "照片列印"}
                      icon="image-edit"
                      onPress={() => {
                        setShowMenu(false);
                        router.push("/(tabs)/admin-photo-print");
                      }}
                      style={{ backgroundColor: theme.colors.surface }}
                    />
                    <Drawer.Item
                      label={language === "en" ? "Version Control" : "版本管理"}
                      icon="update"
                      onPress={() => {
                        setShowMenu(false);
                        router.push("/(tabs)/admin-version-control");
                      }}
                      style={{ backgroundColor: theme.colors.surface }}
                    />
                    <Drawer.Item
                      label={language === "en" ? "Devices" : "設備"}
                      icon="devices"
                      onPress={() => {
                        setShowMenu(false);
                        router.push("/(tabs)/devices");
                      }}
                      style={{ backgroundColor: theme.colors.surface }}
                    />
                    <Divider
                      style={{ backgroundColor: theme.colors.outline }}
                    />
                  </>
                )}

                <Drawer.Item
                  label={language === "en" ? "Logout" : "登出"}
                  icon="logout"
                  onPress={() => {
                    handleLogout();
                  }}
                  style={{ backgroundColor: theme.colors.surface }}
                />
              </SafeAreaView>
            </Pressable>
          </Pressable>
        </Modal>
      </Portal>
    </>
  );
}

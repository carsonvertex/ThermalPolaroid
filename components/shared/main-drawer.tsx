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
                      label={language === "en" ? "Photo Print" : "照片列印"}
                      icon="image-edit"
                      onPress={() => {
                        setShowMenu(false);
                        router.push("/(tabs)/photo-print");
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
                 
                  <Divider />
                </>

             
              </SafeAreaView>
            </Pressable>
          </Pressable>
        </Modal>
      </Portal>
    </>
  );
}

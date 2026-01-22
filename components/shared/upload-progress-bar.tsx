import { useLanguageStore } from "@/lib/stores/language-store";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { IconButton, ProgressBar, useTheme } from "react-native-paper";
import { ThemedText } from "../ui";

export default function UploadProgressBar() {
  const theme = useTheme();
  const { language } = useLanguageStore();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View
      style={{
        position: "absolute",
        top: 60, // Just below main nav
        left: 0,
        right: 0,
        backgroundColor: theme.colors.primaryContainer,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.primary,
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        zIndex: 1000,
      }}
    >
      {/* Compact View */}
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        <MaterialIcons
          name="cloud-upload"
          size={20}
          color={theme.colors.primary}
          style={{ marginRight: 8 }}
        />
        <View style={{ flex: 1 }}>
          <ProgressBar
            progress={0}
            color={theme.colors.primary}
            style={{ height: 4, borderRadius: 2 }}
          />
        </View>
        <ThemedText
          style={{
            fontSize: 11,
            color: theme.colors.primary,
            fontWeight: "600",
            marginLeft: 8,
            marginRight: 4,
          }}
        >
          {Math.round(0 * 100)}%
        </ThemedText>
        <MaterialIcons
          name={isExpanded ? "expand-less" : "expand-more"}
          size={20}
          color={theme.colors.primary}
        />
      </TouchableOpacity>

      {/* Expanded View */}
      {isExpanded && (
        <View
          style={{
            paddingHorizontal: 12,
            paddingBottom: 12,
            borderTopWidth: 1,
            borderTopColor: theme.colors.primary + "30",
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <ThemedText
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: theme.colors.primary,
              }}
            >
              {language === "en" ? "Uploading Orders..." : "上傳訂單中..."}
            </ThemedText>
            <ThemedText
              style={{
                fontSize: 11,
                color: theme.colors.primary,
                opacity: 0.8,
              }}
            >
              {0}/{0}
            </ThemedText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <ThemedText
              style={{
                fontSize: 11,
                color: theme.colors.primary,
                opacity: 0.8,
              }}
            >
              ✓ {0} {language === "en" ? "Success" : "成功"} • ✗ {0} {language === "en" ? "Failed" : "失敗"}
            </ThemedText>
          
          </View>
        </View>
      )}
    </View>
  );
}


import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import { Snackbar, useTheme } from "react-native-paper";
import { ThemedText } from "../ui";

interface AppSnackbarProps {
  visible: boolean;
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
  onDismiss: () => void;
}

export default function AppSnackbar({
  visible,
  message,
  type = "success",
  duration = 1000,
  onDismiss,
}: AppSnackbarProps) {
  const theme = useTheme();

  // Get icon and color based on type
  const getTypeConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: "check-circle" as const,
          backgroundColor: theme.colors.primary,
          color: "#fff",
        };
      case "error":
        return {
          icon: "error" as const,
          backgroundColor: theme.colors.error,
          color: "#fff",
        };
      case "warning":
        return {
          icon: "warning" as const,
          backgroundColor: "#FF9800",
          color: "#fff",
        };
      case "info":
        return {
          icon: "info" as const,
          backgroundColor: "#2196F3",
          color: "#fff",
        };
      default:
        return {
          icon: "check-circle" as const,
          backgroundColor: theme.colors.primary,
          color: "#fff",
        };
    }
  };

  const config = getTypeConfig();

  return (
    <Snackbar
      visible={visible}
      onDismiss={onDismiss}
      duration={duration}
      style={{
        backgroundColor: config.backgroundColor,
      }}
      wrapperStyle={{
        top: 0,
        bottom: undefined,
      }}
      action={{
        label: "",
        onPress: onDismiss,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <MaterialIcons
          name={config.icon}
          size={20}
          color={config.color}
          style={{ marginRight: 8 }}
        />
        <ThemedText
          style={{
            fontSize: 14,
            color: config.color,
            fontWeight: "600",
            flex: 1,
          }}
        >
          {message}
        </ThemedText>
      </View>
    </Snackbar>
  );
}


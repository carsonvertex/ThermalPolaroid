import { useDeviceInfo } from "@/hooks/use-device-info";
import { MaterialIcons } from "@expo/vector-icons";
import { View } from "react-native";
import { Modal, Portal, useTheme, Button } from "react-native-paper";
import QRCode from 'react-native-qrcode-svg';
import { ThemedText } from "../ui";

interface DeviceRegistrationModalProps {
  visible: boolean;
  onDismiss: () => void;
  deviceStatus: {
    isRegistered: boolean | null;
    isLoading: boolean;
    deviceId: string | null;
  };
  onRecheck?: () => void;
}

export default function DeviceRegistrationModal({
  visible,
  onDismiss,
  deviceStatus,
  onRecheck,
}: DeviceRegistrationModalProps) {
  const deviceInfo = useDeviceInfo();
  const theme = useTheme();

  const getStatusInfo = () => {
    if (deviceStatus.isLoading) {
      return {
        icon: "hourglass-empty" as const,
        color: "#FF9800",
        title: "Checking Device Status...",
        description: "Verifying device registration with the server.",
      };
    }

    if (deviceStatus.isRegistered === true) {
      return {
        icon: "check-circle" as const,
        color: "#4CAF50",
        title: "Device Registered",
        description: "This device is registered and can process transactions.",
      };
    }

    if (deviceStatus.isRegistered === false) {
      return {
        icon: "error" as const,
        color: "#F44336",
        title: "Device Not Registered",
        description: "This device is not registered. Please contact administrator to register your device.",
      };
    }

    return {
      icon: "help" as const,
      color: "#FF9800",
      title: "Device Status Unknown",
      description: "Cannot verify device status - network connection issue.",
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={{
          margin: 20,
          backgroundColor: theme.colors.surface,
          borderRadius: 12,
          padding: 20,
          alignItems: "center",
        }}
      >
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <ThemedText
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: theme.colors.onSurface,
              marginBottom: 12,
            }}
          >
            Device Registration QR Code
          </ThemedText>
        </View>

        {/* QR Code */}
        <View style={{
          backgroundColor: "white",
          padding: 16,
          borderRadius: 8,
          marginBottom: 16,
          alignItems: "center"
        }}>
          <QRCode
            value={deviceInfo.deviceId || "unknown-device"}
            size={200}
            color="black"
            backgroundColor="white"
          />
        </View>

        {/* Device ID Text */}
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <ThemedText
            style={{
              fontSize: 14,
              color: theme.colors.onSurfaceVariant,
              marginBottom: 4,
            }}
          >
            Device ID:
          </ThemedText>
          <ThemedText
            style={{
              fontSize: 16,
              fontFamily: "monospace",
              color: theme.colors.onSurface,
              fontWeight: "500",
            }}
          >
            {deviceInfo.deviceId}
          </ThemedText>
        </View>

        {/* Close Button */}
        <Button mode="contained" onPress={onDismiss} style={{ width: "100%" }}>
          Close
        </Button>
      </Modal>
    </Portal>
  );
}
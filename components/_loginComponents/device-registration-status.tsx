import { useDeviceInfo } from "@/hooks/use-device-info";
import { config } from "@/lib/config/environment";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import DeviceRegistrationModal from "../shared/device-registration-modal";
import { ThemedText } from "../ui";

export default function DeviceRegistrationStatus({
  deviceStatus,
  onRecheck,
}: {
  deviceStatus: {
    isRegistered: boolean | null;
    isLoading: boolean;
    deviceId: string | null;
  };
  onRecheck?: () => void;
}) {
  const deviceInfo = useDeviceInfo();
  const [modalVisible, setModalVisible] = useState(false);
  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={{
          marginTop: 12,
          padding: 12,
          backgroundColor:
            deviceStatus.isRegistered === true
              ? "#E8F5E9"
              : deviceStatus.isRegistered === false
              ? "#FFEBEE"
              : "#FFF3E0",
          borderRadius: 8,
          borderWidth: 1,
          borderColor:
            deviceStatus.isRegistered === true
              ? "#4CAF50"
              : deviceStatus.isRegistered === false
              ? "#F44336"
              : "#FF9800",
        }}
      >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          {deviceStatus.isLoading ? (
            <ActivityIndicator
              size="small"
              color="#FF9800"
              style={{ marginRight: 8 }}
            />
          ) : deviceStatus.isRegistered === true ? (
            <MaterialIcons
              name="check-circle"
              size={20}
              color="#4CAF50"
              style={{ marginRight: 8 }}
            />
          ) : deviceStatus.isRegistered === false ? (
            <MaterialIcons
              name="error"
              size={20}
              color="#F44336"
              style={{ marginRight: 8 }}
            />
          ) : (
            <MaterialIcons
              name="help"
              size={20}
              color="#FF9800"
              style={{ marginRight: 8 }}
            />
          )}
          <ThemedText
            style={{
              fontSize: 12,
              fontWeight: "600",
              color:
                deviceStatus.isRegistered === true
                  ? "#2E7D32"
                  : deviceStatus.isRegistered === false
                  ? "#C62828"
                  : "#E65100",
            }}
          >
            {deviceStatus.isLoading
              ? "Checking device status..."
              : deviceStatus.isRegistered === true
              ? "Device Registered ✓"
              : deviceStatus.isRegistered === false
              ? "Device Not Registered ✗"
              : "Device Status Unknown"}
          </ThemedText>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {onRecheck && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation(); // Prevent modal from opening when recheck is pressed
                onRecheck();
              }}
              disabled={deviceStatus.isLoading}
              style={{
                padding: 6,
                marginRight: 4,
                opacity: deviceStatus.isLoading ? 0.5 : 1,
              }}
            >
              <MaterialIcons
                name="refresh"
                size={20}
                color={
                  deviceStatus.isRegistered === true
                    ? "#2E7D32"
                    : deviceStatus.isRegistered === false
                    ? "#C62828"
                    : "#E65100"
                }
              />
            </TouchableOpacity>
          )}
          <MaterialIcons
            name="chevron-right"
            size={20}
            color={
              deviceStatus.isRegistered === true
                ? "#2E7D32"
                : deviceStatus.isRegistered === false
                ? "#C62828"
                : "#E65100"
            }
            style={{ opacity: 0.7 }}
          />
        </View>
      </View>
      <ThemedText
        style={{
          fontSize: 10,
          color:
            deviceStatus.isRegistered === true
              ? "#2E7D32"
              : deviceStatus.isRegistered === false
              ? "#C62828"
              : "#E65100",
          opacity: 0.8,
          marginTop: 4,
        }}
      >
        Device ID: {deviceInfo.deviceId}
        {/* 1c88e9276db8be1b */}
      </ThemedText>
      {deviceStatus.isRegistered === false && (
        <>
          <ThemedText
            style={{
              fontSize: 10,
              color: "#C62828",
              marginTop: 8,
              fontStyle: "italic",
            }}
          >
            ⚠️ This device is not registered. Please contact administrator to
            register your device.
          </ThemedText>
          <ThemedText
            style={{
              fontSize: 9,
              color: "#C62828",
              marginTop: 4,
              fontFamily: "monospace",
            }}
          >
            Device ID: {deviceInfo.deviceId}
          </ThemedText>
        </>
      )}
      {deviceStatus.isRegistered === null && (
        <>
          <ThemedText
            style={{
              fontSize: 10,
              color: "#E65100",
              marginTop: 8,
              fontStyle: "italic",
            }}
          >
            ⚠️ Cannot verify device status - network connection issue.
          </ThemedText>
          {(deviceInfo.brand?.toLowerCase().includes("sunmi") ||
            deviceInfo.modelName?.toLowerCase().includes("sunmi")) && (
            <>
              <ThemedText
                style={{
                  fontSize: 9,
                  color: "#E65100",
                  marginTop: 4,
                  fontWeight: "600",
                }}
              >
                🇨🇳 Sunmi Device: May need public IP (not private 172.31.x.x)
              </ThemedText>
              <ThemedText
                style={{
                  fontSize: 8,
                  color: "#E65100",
                  marginTop: 4,
                  fontStyle: "italic",
                }}
              >
                💡 See TROUBLESHOOTING-SUNMI-NETWORK.md for common fixes
              </ThemedText>
            </>
          )}
          {config.API_BASE_URL.includes("172.31.") && (
            <ThemedText
              style={{
                fontSize: 9,
                color: "#E65100",
                marginTop: 4,
                fontWeight: "600",
              }}
            >
              ⚠️ Using private IP - not accessible from external networks
            </ThemedText>
          )}
          <ThemedText
            style={{
              fontSize: 9,
              color: "#E65100",
              marginTop: 4,
              fontFamily: "monospace",
            }}
          >
            Device ID: {deviceInfo.deviceId}
          </ThemedText>
        </>
      )}
      </TouchableOpacity>

      <DeviceRegistrationModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        deviceStatus={deviceStatus}
        onRecheck={onRecheck}
      />
    </>
  );
}

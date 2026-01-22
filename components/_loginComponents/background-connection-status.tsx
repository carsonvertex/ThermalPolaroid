import { useBackendConnection } from "@/hooks/use-backend-connection";
import { MaterialIcons } from "@expo/vector-icons";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ui";

export default function BackgroundConnectionStatus({
  checkDeviceStatus,
}: {
  checkDeviceStatus: () => void;
}) {
  const backendConnection = useBackendConnection(30000);
  // Check device registration status

  return (
    <View
      style={{
        marginTop: 12,
        padding: 12,
        backgroundColor: backendConnection.isConnected
          ? "#E8F5E9"
          : backendConnection.isChecking
          ? "#FFF3E0"
          : "#FFEBEE",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: backendConnection.isConnected
          ? "#4CAF50"
          : backendConnection.isChecking
          ? "#FF9800"
          : "#F44336",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        {backendConnection.isChecking ? (
          <ActivityIndicator
            size="small"
            color="#FF9800"
            style={{ marginRight: 8 }}
          />
        ) : backendConnection.isConnected ? (
          <MaterialIcons
            name="cloud-done"
            size={20}
            color="#4CAF50"
            style={{ marginRight: 8 }}
          />
        ) : (
          <MaterialIcons
            name="cloud-off"
            size={20}
            color="#F44336"
            style={{ marginRight: 8 }}
          />
        )}
        <ThemedText
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: backendConnection.isConnected
              ? "#2E7D32"
              : backendConnection.isChecking
              ? "#E65100"
              : "#C62828",
          }}
        >
          {backendConnection.isChecking
            ? "Checking backend connection..."
            : backendConnection.isConnected
            ? `Backend Connected ✓${
                backendConnection.responseTime
                  ? ` (${backendConnection.responseTime}ms)`
                  : ""
              }`
            : "Backend Disconnected ✗"}
        </ThemedText>
      </View>
      {/* <ThemedText
        style={{
          fontSize: 10,
          color: backendConnection.isConnected
            ? "#2E7D32"
            : backendConnection.isChecking
            ? "#E65100"
            : "#C62828",
          opacity: 0.8,
          marginTop: 4,
          fontFamily: "monospace",
        }}
      >
        {backendConnection.backendUrl}
      </ThemedText> */}
      {!backendConnection.isConnected &&
        !backendConnection.isChecking &&
        backendConnection.error && (
          <>
            <ThemedText
              style={{
                fontSize: 10,
                color: "#C62828",
                marginTop: 8,
                fontStyle: "italic",
              }}
            >
              ⚠️ {backendConnection.error}
            </ThemedText>
            <TouchableOpacity
              onPress={() => {
                backendConnection.refresh();
                checkDeviceStatus();
              }}
              style={{
                marginTop: 8,
                padding: 8,
                backgroundColor: "#F44336",
                borderRadius: 4,
                alignItems: "center",
              }}
            >
              <ThemedText
                style={{
                  fontSize: 10,
                  color: "#FFFFFF",
                  fontWeight: "600",
                }}
              >
                🔄 Retry Connection
              </ThemedText>
            </TouchableOpacity>
          </>
        )}
      {backendConnection.lastChecked && (
        <ThemedText
          style={{
            fontSize: 9,
            color: backendConnection.isConnected ? "#2E7D32" : "#C62828",
            marginTop: 4,
            opacity: 0.6,
          }}
        >
          Last checked: {backendConnection.lastChecked.toLocaleTimeString()}
        </ThemedText>
      )}
    </View>
  );
}

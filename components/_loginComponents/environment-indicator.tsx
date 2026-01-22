import { config, isProduction } from "@/lib/config/environment";
import { View } from "react-native";
import { ThemedText } from "../ui";

export default function EnvironmentIndicator() {
  const _DEV_ = !isProduction;
  return (
    <View
      style={{
        marginTop: 16,
        padding: 12,
        backgroundColor: _DEV_ ? "#E3F2FD" : "#FFEBEE",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: _DEV_ ? "#2196F3" : "#F44336",
      }}
    >
      <ThemedText
        style={{
          fontSize: 12,
          fontWeight: "600",
          textAlign: "center",
          color: _DEV_ ? "#1976D2" : "#C62828",
        }}
      >
        {_DEV_ ? "🛠️ DEVELOPMENT MODE" : "🚀 PRODUCTION MODE"}
      </ThemedText>
      {/* <ThemedText
        style={{
          fontSize: 10,
          textAlign: "center",
          marginTop: 4,
          color: _DEV_ ? "#1976D2" : "#C62828",
          opacity: 0.8,
        }}
      >
        API: {config.API_BASE_URL}
      </ThemedText> */}
    </View>
  );
}

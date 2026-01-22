import {
  initializeDatabaseFromBackendAPI,
  resetDatabase,
} from "@/endpoints/sqlite";
import { userRepository } from "@/endpoints/sqlite/repositories/user-repository";
import { isProduction } from "@/lib/config/environment";
import { Alert, Platform, TouchableOpacity, View, StyleSheet } from "react-native";
import { ThemedText } from "../ui";

interface DevSpecialProps {
  isDbReady: boolean | null;
  onDatabaseReinitialized?: () => void;
}

export default function DevSpecial({
  isDbReady,
  onDatabaseReinitialized,
}: DevSpecialProps) {
  const _DEV_ = !isProduction;

  const handleDebugUsers = async () => {
    try {
      const allUsers = await userRepository.findAll();
      const userList = allUsers
        .map(
          (u) =>
            `${u.email}\nRole: ${u.role}\nActive: ${
              u.is_active === 1 ? "Yes" : "No"
            }\nHash: ${u.password_hash.substring(0, 30)}...`
        )
        .join("\n\n");

      Alert.alert("Users in Database", userList || "No users found", [
        { text: "OK" },
      ]);
    } catch (error) {
      Alert.alert("Error", `Failed to fetch users: ${error}`);
    }
  };

  const handleReinitDatabase = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Not Available", "Database operations not available on web");
      return;
    }

    Alert.alert(
      "Reinitialize Database",
      "This will reset and recreate the database with the updated schema (including developer role). Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reinitialize",
          style: "destructive",
          onPress: async () => {
            try {
              // Reset the database
              await resetDatabase();

              // Reinitialize from backend
              const result = await initializeDatabaseFromBackendAPI();

              if (result.success) {
                Alert.alert(
                  "Success",
                  "Database reinitialized successfully! You can now login with your developer account."
                );
                onDatabaseReinitialized?.();
              } else {
                Alert.alert("Error", result.message);
              }
            } catch (error) {
              console.error("Reinit error:", error);
              Alert.alert("Error", `Failed to reinitialize: ${error}`);
            }
          },
        },
      ]
    );
  };
  return (
    <View className="space-y-4">
      {/* Demo Credentials */}
      <View style={styles.credentialsContainer}>
        <ThemedText style={styles.credentialsText}>
          👔 Email: [Your ThermalPolaroid Email Address]
        </ThemedText>
        <View style={styles.passwordSection}>
          <ThemedText style={styles.passwordText}>
            🔑 Default Password: 123456 (for all)
          </ThemedText>
        </View>
        <View style={styles.warningSection}>
          <ThemedText style={styles.warningText}>
            ⚠️ Initialize database first using Database Setup
          </ThemedText>
        </View>
      </View>

      {/* Debug Tools - Only show in DEV mode */}
      {_DEV_ && (
        <View style={styles.debugContainer}>
          {isDbReady === true && (
            <TouchableOpacity
              style={styles.debugButton}
              onPress={handleDebugUsers}
            >
              <ThemedText style={styles.debugButtonText}>
                Show All Users
              </ThemedText>
            </TouchableOpacity>
          )}
          {isDbReady === true && (
            <TouchableOpacity
              style={[styles.debugButton, styles.dangerButton]}
              onPress={handleReinitDatabase}
            >
              <ThemedText style={styles.dangerButtonText}>
                Reinitialize Database
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  credentialsContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#F3E5F5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E1BEE7",
  },
  credentialsText: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
  },
  passwordSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E1BEE7",
  },
  passwordText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9C27B0",
  },
  warningSection: {
    marginTop: 12,
    padding: 8,
    backgroundColor: "#FFEBEE",
    borderRadius: 6,
  },
  warningText: {
    fontSize: 11,
    color: "#C62828",
  },
  debugContainer: {
    marginTop: 16,
    gap: 8,
  },
  debugButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#9C27B0",
    backgroundColor: "transparent",
    alignItems: "center",
  },
  dangerButton: {
    borderColor: "#F44336",
    backgroundColor: "#F44336",
  },
  debugButtonText: {
    color: "#9C27B0",
    fontWeight: "600",
  },
  dangerButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});

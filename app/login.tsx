import BackgroundConnectionStatus from "@/components/_loginComponents/background-connection-status";
import DevSpecial from "@/components/_loginComponents/dev-special";
import DeviceRegistrationStatus from "@/components/_loginComponents/device-registration-status";
import EnvironmentIndicator from "@/components/_loginComponents/environment-indicator";
import LoginInputs from "@/components/_loginComponents/login-inputs";
import { ThemedText, ThemedView } from "@/components/ui";
import { appUpdateApi, AppUpdateInfo } from "@/endpoints/app-update";
import { userRepository } from "@/endpoints/sqlite/repositories/user-repository";
import { useDatabaseReady } from "@/hooks/use-database-ready";
import { useDeviceInfo } from "@/hooks/use-device-info";
import { useDeviceStatus } from "@/hooks/use-device-status";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useDatabaseEnvironmentStore } from "@/lib/stores/database-environment-store";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, ScrollView, View } from "react-native";

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const isDbReady = useDatabaseReady();
  const { deviceStatus, checkDeviceStatus } = useDeviceStatus();
  const deviceInfo = useDeviceInfo();
  const initializeForProduction = useDatabaseEnvironmentStore((state) => state.initializeForProduction);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [downloadingUpdate, setDownloadingUpdate] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const isCheckingRef = useRef(false);
  console.log('updateInfo', updateInfo);
  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes <= 0) return "?";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "?";
    const d = new Date(timestamp);
    if (Number.isNaN(d.getTime())) return "?";
    return d.toLocaleString();
  };

  const getCurrentVersion = () => {
    const manifest: any = Constants.manifest || {};
    const versionCode =
      Constants.expoConfig?.android?.versionCode ||
      manifest?.android?.versionCode ||
      0;
    const versionName =
      Constants.expoConfig?.version ||
      manifest?.version ||
      "0.0.0";
    return { versionCode: Number(versionCode), versionName };
  };

  const getCurrentApkFilename = () => {
    // If we ever pass the built APK name at build time, read it from extra
    const fromExtra = (Constants.expoConfig as any)?.extra?.apkFilename;
    return fromExtra || "app-release.apk";
  };

  const latestApkFilename = useMemo(
    () => updateInfo?.filename || updateInfo?.latestVersion?.filename || "unknown",
    [updateInfo]
  );

  const currentApkFilename = useMemo(() => getCurrentApkFilename(), []);

  const isFilenameMatch = useMemo(() => {
    if (!latestApkFilename || !currentApkFilename) return false;
    return latestApkFilename === currentApkFilename;
  }, [latestApkFilename, currentApkFilename]);

  // Initialize database environment when login screen loads
  // This ensures production server uses PRD database
  useEffect(() => {
    initializeForProduction();
  }, [initializeForProduction]);

  const handleCheckUpdate = useCallback(async () => {
    // prevent re-entrance loops on both platforms
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    try {
      setCheckingUpdate(true);
      const { versionCode, versionName } = getCurrentVersion();
      const info = await appUpdateApi.checkForUpdate(versionCode, versionName);
      // Also fetch latest info so we can display filename/size even when up-to-date
      const latest = await appUpdateApi.getLatestVersion().catch(() => null);

      setUpdateInfo({
        ...(info || { updateAvailable: false }),
        latestVersion: info?.latestVersion || latest || undefined,
        filename: info?.filename || latest?.filename,
        fileSize: info?.fileSize || latest?.fileSize,
        lastModified: info?.lastModified || latest?.lastModified,
      });
    } catch (e) {
      // Silent fail to avoid blocking login
    } finally {
      isCheckingRef.current = false;
      setCheckingUpdate(false);
    }
  }, []);

  // Check for app update on login screen load (both platforms)
  useEffect(() => {
    handleCheckUpdate();
  }, [handleCheckUpdate]);

  const handleDownloadUpdate = useCallback(async () => {
    if (!updateInfo?.updateAvailable || downloadingUpdate) return;
    try {
      setDownloadingUpdate(true);
      setDownloadProgress(0);
      await appUpdateApi.downloadAndInstall((p) => setDownloadProgress(p));
    } catch (e: any) {
      Alert.alert("Update", e?.message || "Failed to download update");
    } finally {
      setDownloadingUpdate(false);
      setDownloadProgress(0);
    }
  }, [updateInfo, downloadingUpdate]);

  // Login function
  const handleLogin = useCallback(
    async (emailValue: string, passwordValue: string) => {
      if (!emailValue.trim() || !passwordValue.trim()) {
        Alert.alert("Error", "Please enter both email and password");
        return;
      }

      try {
        setIsLoading(true);

        console.log("🔐 Attempting login:", emailValue.trim());
        console.log(
          "🔑 Password hash would be:",
          userRepository.hashPassword(passwordValue)
        );

        // Authenticate user with local SQLite database
        const user = await userRepository.authenticate(
          emailValue.trim(),
          passwordValue
        );

        if (!user) {
          console.log("❌ Authentication failed");
          Alert.alert("Error", "Invalid email or password");
          return;
        }

        console.log("✅ Login successful:", user.email, user.role);

        // Set auth state
        const mockToken = "local-db-token"; // In production, use real JWT
        useAuthStore.getState().setAuth(user, mockToken, mockToken);

        // Navigate to appropriate screen based on role
        if (user.role === "admin") {
          router.replace("/(tabs)");
        } else if (user.role === "manager") {
          router.replace("/(tabs)");
        } else {
          router.replace("/(tabs)");
        }
      } catch (error) {
        console.error("Login error:", error);
        Alert.alert(
          "Error",
          "Failed to login. Please make sure the database is initialized."
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return (
    <ScrollView
      contentContainerClassName="flex-grow"
      keyboardShouldPersistTaps="handled"
    >
      <ThemedView className="flex-1 justify-center px-6">
        {/* Header */}
        <View className="mb-8">
          <ThemedText className="text-4xl font-bold text-center mb-2">
            POS System v1.0.2
          </ThemedText>
          <ThemedText className="text-base text-center opacity-70">
            Sign in to continue
          </ThemedText>

          {/* Environment Indicator */}
          <EnvironmentIndicator />

          {/* Backend Connection Status */}
          <BackgroundConnectionStatus checkDeviceStatus={checkDeviceStatus} />
          {/* Device Registration Status */}
          {deviceInfo.deviceId && (
            <DeviceRegistrationStatus 
              deviceStatus={deviceStatus} 
              onRecheck={checkDeviceStatus}
            />
          )}
        </View>

        {/* App Update Banner */}
        {/* <View
          style={{
            marginBottom: 12,
            padding: 14,
            borderRadius: 12,
            backgroundColor: updateInfo?.updateAvailable ? "#F2F8FF" : "#F4F6F8",
            borderWidth: 1,
            borderColor: updateInfo?.updateAvailable ? "#90CAF9" : "#CFD8DC",
            gap: 10,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <ThemedText
              style={{
                fontWeight: "700",
                color: updateInfo?.updateAvailable ? "#0D47A1" : "#37474F",
                fontSize: 16,
              }}
            >
              App Update
            </ThemedText>
            <TouchableOpacity
              onPress={handleCheckUpdate}
              disabled={checkingUpdate || downloadingUpdate}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: "#90CAF9",
                backgroundColor: "#E3F2FD",
                opacity: checkingUpdate || downloadingUpdate ? 0.6 : 1,
              }}
            >
              <ThemedText style={{ color: "#0D47A1", fontWeight: "600", fontSize: 12 }}>
                {checkingUpdate ? "Checking..." : "Refresh"}
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 4 }}>
            <ThemedText style={{ color: "#424242" }}>
              Current version: {Constants.expoConfig?.version || "?"} (
              {Constants.expoConfig?.android?.versionCode ||
                Constants.expoConfig?.ios?.buildNumber ||
                "?"})
            </ThemedText>
            <ThemedText style={{ color: "#424242" }}>
              Current APK: {currentApkFilename}
            </ThemedText>
            <ThemedText style={{ color: "#424242" }}>
              Latest APK: {latestApkFilename}
            </ThemedText>
          </View>

          {(updateInfo?.fileSize || updateInfo?.latestVersion?.fileSize) && (
            <ThemedText style={{ color: "#424242" }}>
              Size: {formatBytes(updateInfo?.fileSize || updateInfo?.latestVersion?.fileSize)}
            </ThemedText>
          )}

          {(updateInfo?.lastModified || updateInfo?.latestVersion?.lastModified) && (
            <ThemedText style={{ color: "#424242" }}>
              Uploaded:{" "}
              {formatDate(updateInfo?.lastModified || updateInfo?.latestVersion?.lastModified)}
            </ThemedText>
          )}

          {updateInfo?.updateAvailable && !isFilenameMatch ? (
            downloadingUpdate ? (
              <ThemedText style={{ color: "#2E7D32" }}>
                Downloading... {Math.round(downloadProgress * 100)}%
              </ThemedText>
            ) : (
              <TouchableOpacity
                onPress={handleDownloadUpdate}
                style={{
                  marginTop: 4,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: "#4CAF50",
                  alignItems: "center",
                }}
              >
                <ThemedText
                  style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}
                >
                  Download & Install
                </ThemedText>
              </TouchableOpacity>
            )
          ) : (
            <ThemedText style={{ color: "#1B5E20", fontWeight: "600" }}>
              Version is up to date
            </ThemedText>
          )}
        </View> */}

        {/* Form */}
        <LoginInputs
          isDbReady={isDbReady}
          onLogin={handleLogin}
          isLoading={isLoading}
        />

        <DevSpecial isDbReady={isDbReady} />
      </ThemedView>
    </ScrollView>
  );
}

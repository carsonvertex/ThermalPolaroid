import { ThemedText } from "@/components/ui";
import { appUpdateApi, AppUpdateInfo } from "@/endpoints/app-update";
import { MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    TouchableOpacity,
    View,
} from "react-native";
import { Card, useTheme } from "react-native-paper";

interface AppUpdateCardProps {
  language: "en" | "zh";
}

export function AppUpdateCard({ language }: AppUpdateCardProps) {
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const paperTheme = useTheme();

  // Get current app version
  const manifest: any = Constants.manifest || {};
  const currentVersionCode =
    Constants.expoConfig?.android?.versionCode ||
    (manifest as any)?.android?.versionCode ||
    3;
  const currentVersionName =
    Constants.expoConfig?.version ||
    (manifest as any)?.version ||
    "1.0.0";

  useEffect(() => {
    // Auto-check for updates on mount
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    if (Platform.OS !== "android") {
      return; // Only check on Android
    }

    try {
      setIsChecking(true);
      const info = await appUpdateApi.checkForUpdate(
        currentVersionCode,
        currentVersionName
      );
      setUpdateInfo(info);
    } catch (error: any) {
      console.error("Error checking for updates:", error);
      // Don't show error alert on auto-check, only on manual check
    } finally {
      setIsChecking(false);
    }
  };

  const handleDownloadAndInstall = async () => {
    if (!updateInfo?.updateAvailable) {
      return;
    }

    Alert.alert(
      language === "en" ? "Download Update" : "下載更新",
      language === "en"
        ? "⚠️ WARNING: This will download and install the latest version of the app. Your database will be reset during installation and you will need to reinitialize it afterward. Continue?"
        : "⚠️ 警告：這將下載並安裝最新版本的應用程序。安裝期間您的數據庫將被重置，您需要重新初始化。繼續嗎？",
      [
        {
          text: language === "en" ? "Cancel" : "取消",
          style: "cancel",
        },
        {
          text: language === "en" ? "Download" : "下載",
          onPress: async () => {
            try {
              setIsDownloading(true);
              setDownloadProgress(0);

              await appUpdateApi.downloadAndInstall((progress) => {
                setDownloadProgress(progress);
              });

              // After successful download, refresh update info
              await checkForUpdates();
            } catch (error: any) {
              Alert.alert(
                language === "en" ? "Error" : "錯誤",
                error.message ||
                  (language === "en"
                    ? "Failed to download update"
                    : "下載更新失敗")
              );
            } finally {
              setIsDownloading(false);
              setDownloadProgress(0);
            }
          },
        },
      ]
    );
  };

  if (Platform.OS !== "android") {
    return null; // Only show on Android
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <Card
      style={{
        marginBottom: 16,
        backgroundColor: paperTheme.colors.surface,
      }}
      elevation={2}
    >
      <Card.Content style={{ padding: 16 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <View
            style={{
              backgroundColor: "#4CAF50",
              padding: 12,
              borderRadius: 12,
              marginRight: 16,
            }}
          >
            <MaterialIcons name="system-update" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText
              style={{
                fontSize: 16,
                fontWeight: "600",
                marginBottom: 4,
              }}
            >
              {language === "en" ? "App Update" : "應用更新"}
            </ThemedText>
            <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
              {language === "en"
                ? "Check for app updates"
                : "檢查應用更新"}
            </ThemedText>
          </View>
        </View>

        {/* Current Version */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: paperTheme.colors.surfaceVariant,
          }}
        >
          <ThemedText style={{ fontSize: 14, opacity: 0.7 }}>
            {language === "en" ? "Current Version" : "當前版本"}
          </ThemedText>
          <ThemedText style={{ fontSize: 14, fontWeight: "500" }}>
            {currentVersionName} ({currentVersionCode})
          </ThemedText>
        </View>

        {/* Update Status */}
        {isChecking ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 16,
            }}
          >
            <ActivityIndicator size="small" color={paperTheme.colors.primary} />
            <ThemedText
              style={{ marginLeft: 8, fontSize: 14, opacity: 0.7 }}
            >
              {language === "en" ? "Checking..." : "檢查中..."}
            </ThemedText>
          </View>
        ) : updateInfo ? (
          <>
            {updateInfo.updateAvailable ? (
              <>
                {/* Latest Version Info */}
                {updateInfo.latestVersion && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingVertical: 8,
                      borderBottomWidth: 1,
                      borderBottomColor: paperTheme.colors.surfaceVariant,
                    }}
                  >
                    <ThemedText style={{ fontSize: 14, opacity: 0.7 }}>
                      {language === "en" ? "Latest Version" : "最新版本"}
                    </ThemedText>
                    <ThemedText
                      style={{
                        fontSize: 14,
                        fontWeight: "500",
                        color: "#4CAF50",
                      }}
                    >
                      {updateInfo.latestVersion.versionName || "Unknown"}{" "}
                      ({updateInfo.latestVersion.versionCode || "?"})
                    </ThemedText>
                  </View>
                )}

                {/* File Size */}
                {updateInfo.fileSize && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingVertical: 8,
                      borderBottomWidth: 1,
                      borderBottomColor: paperTheme.colors.surfaceVariant,
                    }}
                  >
                    <ThemedText style={{ fontSize: 14, opacity: 0.7 }}>
                      {language === "en" ? "Size" : "大小"}
                    </ThemedText>
                    <ThemedText style={{ fontSize: 14, fontWeight: "500" }}>
                      {formatFileSize(updateInfo.fileSize)}
                    </ThemedText>
                  </View>
                )}

                {/* Download Progress */}
                {isDownloading && (
                  <View style={{ marginVertical: 12 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                        {language === "en" ? "Downloading..." : "下載中..."}
                      </ThemedText>
                      <ThemedText style={{ fontSize: 12, fontWeight: "500" }}>
                        {Math.round(downloadProgress * 100)}%
                      </ThemedText>
                    </View>
                    <View
                      style={{
                        height: 4,
                        backgroundColor: paperTheme.colors.surfaceVariant,
                        borderRadius: 2,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          height: "100%",
                          width: `${downloadProgress * 100}%`,
                          backgroundColor: "#4CAF50",
                        }}
                      />
                    </View>
                  </View>
                )}

                {/* Download Button */}
                {!isDownloading && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: "#4CAF50",
                      borderRadius: 8,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      marginTop: 12,
                      opacity: isDownloading ? 0.5 : 1,
                    }}
                    disabled={isDownloading}
                    onPress={handleDownloadAndInstall}
                  >
                    <ThemedText
                      style={{
                        color: "#fff",
                        textAlign: "center",
                        fontWeight: "600",
                        fontSize: 14,
                      }}
                    >
                      {language === "en"
                        ? "Download & Install Update"
                        : "下載並安裝更新"}
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 16,
                }}
              >
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color="#4CAF50"
                />
                <ThemedText
                  style={{
                    marginLeft: 8,
                    fontSize: 14,
                    color: "#4CAF50",
                    fontWeight: "500",
                  }}
                >
                  {language === "en"
                    ? "App is up to date"
                    : "應用已是最新版本"}
                </ThemedText>
              </View>
            )}
          </>
        ) : null}

        {/* Manual Check Button */}
        {!isChecking && !isDownloading && (
          <TouchableOpacity
            style={{
              marginTop: 12,
              paddingVertical: 8,
              alignItems: "center",
            }}
            onPress={checkForUpdates}
          >
            <ThemedText
              style={{
                fontSize: 14,
                color: paperTheme.colors.primary,
                fontWeight: "500",
              }}
            >
              {language === "en" ? "Check for Updates" : "檢查更新"}
            </ThemedText>
          </TouchableOpacity>
        )}
      </Card.Content>
    </Card>
  );
}


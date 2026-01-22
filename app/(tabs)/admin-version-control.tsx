import { ThemedText, ThemedView } from "@/components/ui";
import { ApkFileInfo, appUpdateApi } from "@/endpoints/app-update";
import Constants from "expo-constants";
import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, RefreshControl, TouchableOpacity, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const formatBytes = (bytes?: number) => {
  if (!bytes || bytes <= 0) return "-";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
};

const formatDate = (ts?: number) => {
  if (!ts) return "-";
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
};

export default function AdminVersionControlScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [files, setFiles] = useState<ApkFileInfo[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadingFilename, setDownloadingFilename] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  // Calculate tab bar height: paddingTop(8) + icon(28) + text margin(4) + text(~14) + padding(8) + safe area
  const TAB_BAR_HEIGHT = 8 + 28 + 4 + 14 + 8 + insets.bottom;

  const currentApkName = useMemo(() => {
    const fromExtra = (Constants.expoConfig as any)?.extra?.apkFilename;
    return fromExtra || "app-release.apk";
  }, []);

  const loadFiles = async () => {
    setRefreshing(true);
    try {
      const data = await appUpdateApi.listFiles();
      setFiles(data);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to load APK list");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleDelete = async (filename: string) => {
    Alert.alert("Delete APK", `Delete ${filename}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            await appUpdateApi.deleteFile(filename);
            await loadFiles();
          } catch (e: any) {
            Alert.alert("Error", e?.message || "Failed to delete file");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleDownloadAndInstall = async (filename: string) => {
    Alert.alert(
      "Download & Install APK",
      `Download and install ${filename}?\n\n⚠️ WARNING: Your database will be reset during installation. All data will be cleared and you will need to reinitialize the database after the update completes.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Download & Install",
          onPress: async () => {
            setDownloadingFilename(filename);
            setDownloadProgress(0);
            try {
              await appUpdateApi.downloadAndInstallApk(
                filename,
                (progress) => {
                  setDownloadProgress(progress);
                }
              );
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Failed to download or install APK");
            } finally {
              setDownloadingFilename(null);
              setDownloadProgress(0);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: ApkFileInfo }) => {
    const isCurrent = item.filename === currentApkName;
    return (
      <View
        style={{
          padding: 12,
          borderWidth: 1,
          borderColor: theme.colors.outline,
          borderRadius: 10,
          marginBottom: 10,
          backgroundColor: isCurrent ? "#E8F5E9" : theme.colors.surface,
        }}
      >
        <ThemedText style={{ fontWeight: "700", color: theme.colors.onSurface }}>
          {item.filename}
        </ThemedText>
        <ThemedText style={{ color: theme.colors.onSurface, opacity: 0.8 }}>
          Size: {formatBytes(item.size)}
        </ThemedText>
        <ThemedText style={{ color: theme.colors.onSurface, opacity: 0.8 }}>
          Uploaded: {formatDate(item.lastModified)}
        </ThemedText>
        {downloadingFilename === item.filename && (
          <View style={{ marginTop: 8, marginBottom: 4 }}>
            <View
              style={{
                height: 6,
                backgroundColor: theme.colors.outline,
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: `${downloadProgress * 100}%`,
                  backgroundColor: "#1976D2",
                }}
              />
            </View>
            <ThemedText
              style={{
                color: theme.colors.onSurface,
                opacity: 0.7,
                fontSize: 12,
                marginTop: 4,
              }}
            >
              Downloading: {Math.round(downloadProgress * 100)}%
            </ThemedText>
          </View>
        )}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            marginTop: 8,
            gap: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => handleDownloadAndInstall(item.filename)}
            disabled={loading || downloadingFilename !== null}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: "#4CAF50",
              opacity: loading || downloadingFilename !== null ? 0.7 : 1,
            }}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
              {downloadingFilename === item.filename ? "Downloading..." : "Download & Install"}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item.filename)}
            disabled={loading || downloadingFilename !== null}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: "#EF5350",
              opacity: loading || downloadingFilename !== null ? 0.7 : 1,
            }}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "700" }}>Delete</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={{ flex: 1, padding: 16 }}>
      <View
        style={{
          marginBottom: 12,
          padding: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.colors.outline,
          backgroundColor: theme.colors.surface,
          gap: 6,
        }}
      >
        <ThemedText style={{ fontSize: 18, fontWeight: "700" }}>APK Version Control</ThemedText>
        <ThemedText style={{ color: theme.colors.onSurface, opacity: 0.8 }}>
          Current APK on device: {currentApkName}
        </ThemedText>
        <ThemedText style={{ color: theme.colors.onSurface, opacity: 0.8 }}>
          Manage server APKs below. Deleting removes the file from the server.
        </ThemedText>
        <TouchableOpacity
          onPress={loadFiles}
          disabled={refreshing || loading}
          style={{
            alignSelf: "flex-start",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: "#1976D2",
            opacity: refreshing || loading ? 0.7 : 1,
          }}
        >
          <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
            {refreshing ? "Refreshing..." : "Refresh list"}
          </ThemedText>
        </TouchableOpacity>
      </View>

      <FlatList
        data={files}
        keyExtractor={(item) => item.filename}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadFiles} />
        }
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 16 }}
        ListEmptyComponent={
          <ThemedText style={{ textAlign: "center", marginTop: 20 }}>
            No APK files found on server.
          </ThemedText>
        }
      />
    </ThemedView>
  );
}


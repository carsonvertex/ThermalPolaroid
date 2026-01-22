import { useLanguageStore } from "@/lib/stores/language-store";
import { ActivityIndicator, View } from "react-native";
import { Button, useTheme } from "react-native-paper";
import { ThemedText } from "@/components/ui";
import { MaterialIcons } from "@expo/vector-icons";

export default function SyncProductButton({
  handleSync,
  syncMutation,
  isBackendConnected,
  lastSyncTime,
}: {
  handleSync: () => void;
  syncMutation: any;
  isBackendConnected: boolean;
  lastSyncTime: Date | null;
}) {
  const paperTheme = useTheme();
  const { language } = useLanguageStore();

  const formatLastSync = (date: Date | null) => {
    if (!date) return language === "en" ? "Never synced" : "從未同步";
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) {
      return language === "en" ? "Just now" : "剛剛";
    } else if (diffMins < 60) {
      return language === "en" ? `${diffMins}m ago` : `${diffMins}分鐘前`;
    } else if (diffHours < 24) {
      return language === "en" ? `${diffHours}h ago` : `${diffHours}小時前`;
    } else if (diffDays < 7) {
      return language === "en" ? `${diffDays}d ago` : `${diffDays}天前`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const isDisabled = syncMutation.isPending || !isBackendConnected;

  return (
    <View>
      <Button
        onPress={handleSync}
        disabled={isDisabled}
        mode="contained"
        icon={() => 
          isBackendConnected ? (
            <MaterialIcons name="cloud-sync" size={18} color={paperTheme.colors.onPrimary} />
          ) : (
            <MaterialIcons name="cloud-off" size={18} color={paperTheme.colors.onSurfaceDisabled} />
          )
        }
      >
        {syncMutation.isPending ? (
          <>
            <ActivityIndicator size="small" color={paperTheme.colors.onPrimary} />
            {language === "en" ? " Syncing..." : " 同步中..."}
          </>
        ) : !isBackendConnected ? (
          language === "en" ? "No Connection" : "無連接"
        ) : (
          language === "en" ? "Sync from Server" : "從服務器同步"
        )}
      </Button>
      
      {/* Last Sync Time */}
      {lastSyncTime && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 6,
          }}
        >
          <MaterialIcons
            name="access-time"
            size={14}
            color={paperTheme.colors.onSurfaceVariant}
            style={{ marginRight: 4 }}
          />
          <ThemedText
            style={{
              fontSize: 12,
              opacity: 0.7,
              color: paperTheme.colors.onSurfaceVariant,
            }}
          >
            {language === "en" ? "Last sync: " : "上次同步："}
            {formatLastSync(lastSyncTime)}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

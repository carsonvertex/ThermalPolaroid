import { SimpleOrderItem } from "@/endpoints/sqlite/repositories/simple-order-repository";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { useLanguageStore } from "@/lib/stores/language-store";
import { View } from "react-native";
import { Button, Card, useTheme } from "react-native-paper";
import { ThemedText } from "../ui";

export default function UploadCard({
  orders,
  totalCount,
  handleUploadAll,
  handleCancelUpload,
  isRefreshing,
  isUploading,
}: {
  orders: SimpleOrderItem[];
  totalCount: number;
  handleUploadAll: () => void;
  handleCancelUpload: () => void;
  isRefreshing: boolean;
  isUploading: boolean;
}) {
  const theme = useTheme();
  const { language } = useLanguageStore();
  const isOnline = useOnlineStatus();
  return (
    <Card
      style={{
        marginBottom: 16,
        backgroundColor: theme.colors.surface,
      }}
      elevation={2}
    >
      <Card.Content style={{ padding: 16 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <ThemedText style={{ fontSize: 14, opacity: 0.7 }}>
              {language === "en" ? "Pending Orders" : "待處理訂單"}
            </ThemedText>
            <ThemedText
              style={{ fontSize: 32, fontWeight: "bold", marginTop: 4 }}
            >
              {totalCount}
            </ThemedText>
          </View>
          {totalCount > 0 && (
            <View style={{ alignItems: "flex-end" }}>
              {isUploading ? (
                <Button
                  mode="contained"
                  onPress={handleCancelUpload}
                  icon="close"
                  buttonColor={theme.colors.error}
                >
                  {language === "en" ? "Cancel" : "取消"}
                </Button>
              ) : (
                <>
                  <Button
                    mode="contained"
                    onPress={handleUploadAll}
                    disabled={isRefreshing || orders.length === 0 || !isOnline}
                    icon="cloud-upload"
                  >
                    {language === "en" ? "Upload All" : "全部上傳"}
                  </Button>
                  {!isOnline && (
                    <ThemedText
                      style={{
                        fontSize: 11,
                        opacity: 0.6,
                        marginTop: 4,
                        color: theme.colors.error,
                      }}
                    >
                      {language === "en" ? "No connection" : "無連接"}
                    </ThemedText>
                  )}
                </>
              )}
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

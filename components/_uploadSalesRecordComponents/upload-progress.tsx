import { useLanguageStore } from "@/lib/stores/language-store";
import { useUploadProgressStore } from "@/lib/stores/upload-progress-store";
import { Card, ProgressBar, useTheme } from "react-native-paper";
import { ThemedText } from "../ui";

export default function UploadProgress({
  uploadAllMutation,
}: {
  uploadAllMutation: any;
}) {
  const theme = useTheme();
  const { language } = useLanguageStore();
  const { progress, current, total, successCount, failCount } = useUploadProgressStore();
  
  return (
    <>
      {uploadAllMutation.isPending && (
        <Card
          style={{
            marginBottom: 16,
            backgroundColor: theme.colors.primaryContainer,
          }}
          elevation={1}
        >
          <Card.Content style={{ padding: 16 }}>
            <ThemedText
              style={{
                fontSize: 14,
                fontWeight: "600",
                marginBottom: 8,
                color: theme.colors.primary,
              }}
            >
              {language === "en" ? "Uploading..." : "上傳中..."} {current}/{total}
            </ThemedText>
            <ProgressBar
              progress={progress}
              color={theme.colors.primary}
            />
            <ThemedText
              style={{
                fontSize: 12,
                opacity: 0.7,
                marginTop: 8,
                textAlign: "center",
              }}
            >
              {Math.round(progress * 100)}% • ✓{successCount} ✗{failCount}
            </ThemedText>
          </Card.Content>
        </Card>
      )}
    </>
  );
}

import { useLanguageStore } from "@/lib/stores/language-store";
import { Button, useTheme } from "react-native-paper";

export default function ClearProductButton({
  handleClear,
  clearMutation,
  productCount,
}: {
  handleClear: () => void;
  clearMutation: any;
  productCount: number | undefined;
}) {
  const paperTheme = useTheme();
  const { language } = useLanguageStore();
  return (
    <Button
      onPress={handleClear}
      disabled={clearMutation.isPending || !productCount}
      mode="contained"
      buttonColor={paperTheme.colors.errorContainer}
      textColor={paperTheme.colors.error}
    >
      {clearMutation.isPending
        ? language === "en"
          ? "Clearing..."
          : "清除中..."
        : language === "en"
        ? "🗑️ Clear Local DB"
        : "🗑️ 清除本地資料庫"}
    </Button>
  );
}

import { useLanguageStore } from "@/lib/stores/language-store";
import { TouchableOpacity, View } from "react-native";
import { useTheme } from "react-native-paper";
import { ThemedText } from "../ui";

interface ProductPaginationProps {
  totalPages: number;
  currentPage: number;
  totalCount: number;
  setCurrentPage: (page: number) => void;
}

export default function ProductPagination({
  totalPages,
  currentPage,
  totalCount,
  setCurrentPage,
}: ProductPaginationProps) {
  const { language } = useLanguageStore();
  const theme = useTheme();

  if (totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}
    >
      <TouchableOpacity
        onPress={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 6,
          backgroundColor:
            currentPage === 1
              ? theme.colors.surfaceVariant
              : theme.colors.primaryContainer,
          opacity: currentPage === 1 ? 0.5 : 1,
        }}
      >
        <ThemedText
          style={{
            fontSize: 14,
            fontWeight: "600",
            color:
              currentPage === 1
                ? theme.colors.onSurfaceVariant
                : theme.colors.primary,
          }}
        >
          {language === "en" ? "Previous" : "上一頁"}
        </ThemedText>
      </TouchableOpacity>

      <View style={{ alignItems: "center" }}>
        <ThemedText
          style={{
            fontSize: 14,
            fontWeight: "600",
            opacity: 0.8,
          }}
        >
          {language === "en" ? "Page" : "頁面"} {currentPage}{" "}
          {language === "en" ? "of" : "/"} {totalPages}
        </ThemedText>
        <ThemedText
          style={{
            fontSize: 12,
            opacity: 0.5,
            marginTop: 2,
          }}
        >
          ({totalCount} {language === "en" ? "products" : "商品"})
        </ThemedText>
      </View>

      <TouchableOpacity
        onPress={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 6,
          backgroundColor:
            currentPage === totalPages
              ? theme.colors.surfaceVariant
              : theme.colors.primaryContainer,
          opacity: currentPage === totalPages ? 0.5 : 1,
        }}
      >
        <ThemedText
          style={{
            fontSize: 14,
            fontWeight: "600",
            color:
              currentPage === totalPages
                ? theme.colors.onSurfaceVariant
                : theme.colors.primary,
          }}
        >
          {language === "en" ? "Next" : "下一頁"}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}


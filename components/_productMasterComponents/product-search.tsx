import { useLanguageStore } from "@/lib/stores/language-store";
import React from "react";
import { View } from "react-native";
import { Button, TextInput } from "react-native-paper";

interface ProductSearchProps {
  onSearch: (searchTerm: string) => void;
  onClear: () => void;
  loading?: boolean;
}

export default function ProductSearch({
  onSearch,
  onClear,
  loading = false,
}: ProductSearchProps) {
  const { language } = useLanguageStore();
  const [searchTerm, setSearchTerm] = React.useState("");

  const handleSearch = () => {
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    onClear();
  };

  const hasSearch = searchTerm.trim();

  return (
    <View>
      {/* Search Input */}
      <View style={{ marginBottom: 12 }}>
        <TextInput
          mode="outlined"
          placeholder={
            language === "en"
              ? "Search by name, SKU, barcode, or brand"
              : "按名稱、SKU、條碼或品牌搜索"
          }
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmitEditing={handleSearch}
          left={<TextInput.Icon icon="magnify" />}
          right={
            searchTerm ? (
              <TextInput.Icon icon="close" onPress={() => setSearchTerm("")} />
            ) : null
          }
        />
      </View>

      {/* Action Buttons */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Button
            mode="contained"
            onPress={handleSearch}
            loading={loading}
            disabled={loading || !hasSearch}
            icon="magnify"
          >
            {language === "en" ? "Search" : "搜索"}
          </Button>
        </View>

        {hasSearch && (
          <Button mode="outlined" onPress={handleClear} icon="close">
            {language === "en" ? "Clear" : "清空"}
          </Button>
        )}
      </View>
    </View>
  );
}


import { ThemedText } from "@/components/ui";
import { RoadShowProductLocal } from "@/endpoints/sqlite/repositories/roadshow-product-repository";
import { useLanguageStore } from "@/lib/stores/language-store";
import { MaterialIcons } from "@expo/vector-icons";
import { ActivityIndicator, View } from "react-native";
import { Card, useTheme } from "react-native-paper";

interface ProductListPaginatedProps {
  isLoading: boolean;
  products: RoadShowProductLocal[];
  totalCount: number;
}

export default function ProductListPaginated({
  isLoading,
  products,
  totalCount,
}: ProductListPaginatedProps) {
  const theme = useTheme();
  const { language } = useLanguageStore();

  if (isLoading) {
    return (
      <Card
        style={{
          backgroundColor: theme.colors.surface,
          marginTop: 16,
        }}
        elevation={2}
      >
        <Card.Content style={{ padding: 32, alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <ThemedText
            style={{
              marginTop: 12,
              opacity: 0.7,
            }}
          >
            {language === "en" ? "Loading products..." : "載入商品中..."}
          </ThemedText>
        </Card.Content>
      </Card>
    );
  }

  if (!products || products.length === 0) {
    return (
      <Card
        style={{
          backgroundColor: theme.colors.surface,
          marginTop: 16,
        }}
        elevation={2}
      >
        <Card.Content style={{ padding: 32, alignItems: "center" }}>
          <MaterialIcons
            name="inventory-2"
            size={64}
            color={theme.colors.outline}
          />
          <ThemedText
            style={{
              fontSize: 16,
              opacity: 0.7,
              marginTop: 16,
              textAlign: "center",
            }}
          >
            {language === "en" ? "No products found" : "找不到商品"}
          </ThemedText>
          <ThemedText
            style={{
              fontSize: 14,
              opacity: 0.5,
              marginTop: 4,
              textAlign: "center",
            }}
          >
            {totalCount === 0
              ? language === "en"
                ? 'Tap "Sync from Server" to download products'
                : "點擊「從伺服器同步」以下載商品"
              : language === "en"
              ? "Try adjusting your search"
              : "嘗試調整您的搜尋條件"}
          </ThemedText>
        </Card.Content>
      </Card>
    );
  }

  return (
    <View style={{ marginTop: 16 }}>
      {products.map((product, index) => (
        <Card
          key={product.product_id || index}
          style={{
            backgroundColor: theme.colors.surface,
            marginBottom: 12,
          }}
          elevation={2}
        >
          <Card.Content style={{ padding: 16 }}>
            {/* Product Name */}
            <ThemedText
              style={{
                fontSize: 18,
                fontWeight: "600",
                marginBottom: 8,
              }}
            >
              {product.product_name ||
                (language === "en" ? "Unnamed Product" : "未命名商品")}
            </ThemedText>

            {/* Brand and SKU */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              {product.brand_name && (
                <View
                  style={{
                    backgroundColor: theme.colors.primaryContainer,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 4,
                    marginRight: 8,
                  }}
                >
                  <ThemedText
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: theme.colors.primary,
                    }}
                  >
                    {product.brand_name}
                  </ThemedText>
                </View>
              )}
              <ThemedText
                style={{
                  fontSize: 14,
                  opacity: 0.7,
                }}
              >
                SKU: {product.sku}
              </ThemedText>
            </View>

            {/* Model Number */}
            {product.model_number && (
              <ThemedText
                style={{
                  fontSize: 13,
                  opacity: 0.6,
                  marginBottom: 4,
                }}
              >
                {language === "en" ? "Model" : "型號"}: {product.model_number}
              </ThemedText>
            )}

            {/* Barcode */}
            {product.barcode && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <MaterialIcons
                  name="qr-code"
                  size={14}
                  color={theme.colors.onSurfaceVariant}
                  style={{ marginRight: 4 }}
                />
                <ThemedText
                  style={{
                    fontSize: 12,
                    opacity: 0.6,
                  }}
                >
                  {product.barcode}
                </ThemedText>
              </View>
            )}

            {/* Price and Quantity */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: theme.colors.outlineVariant,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialIcons
                  name="attach-money"
                  size={20}
                  color={theme.colors.primary}
                />
                <ThemedText
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: theme.colors.primary,
                  }}
                >
                  {product.price?.toFixed(2) || "0.00"}
                </ThemedText>
              </View>

              {/* <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor:
                    (product.qty || 0) < 10
                      ? theme.colors.errorContainer
                      : theme.colors.primaryContainer,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}
              >
                <MaterialIcons
                  name="inventory"
                  size={16}
                  color={
                    (product.qty || 0) < 10
                      ? theme.colors.error
                      : theme.colors.primary
                  }
                  style={{ marginRight: 4 }}
                />
                <ThemedText
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color:
                      (product.qty || 0) < 10
                        ? theme.colors.error
                        : theme.colors.primary,
                  }}
                >
                  {product.qty || 0}
                </ThemedText>
              </View> */}
            </View>
          </Card.Content>
        </Card>
      ))}
    </View>
  );
}


import { useLanguageStore } from "@/lib/stores/language-store";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Dimensions, View } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { Card, useTheme } from "react-native-paper";
import { ThemedText } from "../ui";

interface ProductSalesData {
  productDetail: string;
  sku: string;
  quantity: number;
  totalAmount: number;
}

interface ProductPieChartProps {
  orders: any[];
  parseProducts: (products: string) => any;
}

export function ProductPieChart({
  orders,
  parseProducts,
}: ProductPieChartProps) {
  const theme = useTheme();
  const { language } = useLanguageStore();

  // Calculate product sales data
  const calculateProductSales = (): ProductSalesData[] => {
    const productMap = new Map<
      string,
      {
        quantity: number;
        totalAmount: number;
        productDetail: string;
        sku: string;
      }
    >();

    orders.forEach((order) => {
      const products = parseProducts(order.products);
      products.forEach((product: any) => {
        const key = product.sku || product.productDetail;
        if (productMap.has(key)) {
          const existing = productMap.get(key)!;
          existing.quantity += product.quantity;
          existing.totalAmount += product.quantity * product.unitPrice;
        } else {
          productMap.set(key, {
            quantity: product.quantity,
            totalAmount: product.quantity * product.unitPrice,
            productDetail: product.productDetail || "Unknown",
            sku: product.sku || "N/A",
          });
        }
      });
    });

    // Convert to array and sort by quantity (best sellers first)
    return Array.from(productMap.values()).sort(
      (a, b) => b.quantity - a.quantity
    );
  };

  const allProducts = calculateProductSales();
  const totalQuantity = allProducts.reduce(
    (sum, product) => sum + product.quantity,
    0
  );

  // Group products: top 10 products, rest as "Others"
  const calculateChartData = () => {
    if (allProducts.length === 0) {
      return { chartData: [], legendData: [] };
    }

    // Get top 10 products
    const topProducts = allProducts.slice(0, 10);

    // Calculate "Others" from remaining products
    let othersQuantity = 0;
    let othersAmount = 0;

    if (allProducts.length > 10) {
      for (let i = 10; i < allProducts.length; i++) {
        othersQuantity += allProducts[i].quantity;
        othersAmount += allProducts[i].totalAmount;
      }
    }

    // Color palette
    const colors = [
      "#4CAF50",
      "#2196F3",
      "#FF9800",
      "#9C27B0",
      "#F44336",
      "#00BCD4",
      "#FFC107",
      "#795548",
      "#607D8B",
      "#E91E63",
    ];

    // Prepare chart data
    const chartData = topProducts.map((product, index) => ({
      name:
        product.sku.length > 20
          ? product.sku.substring(0, 20) + "..."
          : product.sku,
      quantity: product.quantity,
      amount: product.totalAmount,
      color: colors[index % colors.length],
      legendFontColor: theme.colors.onSurface,
      legendFontSize: 12,
    }));

    // Add "Others" category only if there are remaining products
    if (othersQuantity > 0) {
      chartData.push({
        name: language === "en" ? "Others" : "其他",
        quantity: othersQuantity,
        amount: othersAmount,
        color: "#9E9E9E",
        legendFontColor: theme.colors.onSurface,
        legendFontSize: 12,
      });
    }
    
    // Filter out any items with 0 quantity to avoid rendering issues
    const filteredChartData = chartData.filter(item => item.quantity > 0);

    // Prepare legend data with quantity (include all items, even 0, for display)
    const legendData = chartData.map((item) => ({
      name: `${item.name} (${item.quantity}x)`,
      color: item.color,
    }));

    return { chartData: filteredChartData, legendData: chartData }; // Use filtered for chart, all for legend
  };

  const { chartData, legendData } = calculateChartData();
  const screenWidth = Dimensions.get("window").width;
  const chartSize = Math.min(screenWidth - 64, 250);

  if (chartData.length === 0) {
    return (
      <Card
        style={{
          marginTop: 8,
          backgroundColor: theme.colors.surface,
        }}
        elevation={2}
      >
        <Card.Content style={{ padding: 16 }} className="w-full">
          <View className="flex flex-row justify-between items-center mb-4">
            <View>
              <ThemedText style={{ fontSize: 18, fontWeight: "bold" }}>
                {language === "en" ? "Best Sellers" : "暢銷產品"}
              </ThemedText>
              <ThemedText style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                {language === "en" ? "Top products sold today" : "今日暢銷產品"}
              </ThemedText>
            </View>
            <MaterialIcons
              name="pie-chart"
              size={24}
              color={theme.colors.primary}
            />
          </View>
          <View style={{ padding: 40, alignItems: "center" }}>
            <ThemedText style={{ opacity: 0.6 }}>
              {language === "en" ? "No products sold today" : "今日無產品銷售"}
            </ThemedText>
          </View>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card
      style={{
        marginTop: 8,
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
            marginBottom: 16,
          }}
        >
          <View>
            <ThemedText style={{ fontSize: 18, fontWeight: "bold" }}>
              {language === "en" ? "Best Sellers" : "暢銷產品"}
            </ThemedText>
            <ThemedText style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
              {language === "en"
                ? "Top 10 products sold today"
                : "今日前10名暢銷產品"}
            </ThemedText>
          </View>
          <MaterialIcons
            name="pie-chart"
            size={24}
            color={theme.colors.primary}
          />
        </View>

        <View 
          style={{ 
            alignItems: "center", 
            justifyContent: "center", 
            width: "100%",
            overflow: "visible"
          }}
        >
          <PieChart
            data={chartData}
            width={chartSize}
            height={chartSize}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              strokeWidth: 2,
            }}
            accessor="quantity"
            backgroundColor="transparent"
            paddingLeft="55"
            absolute // Show absolute values instead of percentages
            hasLegend={false} // We'll create custom legend
          />

          {/* Custom Legend with quantities */}
          <View
            style={{
              marginTop: 16,
              width: "100%",
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 12,
            }}
          >
            {legendData.map((item, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 4,
                  maxWidth: "45%",
                }}
              >
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: item.color,
                    marginRight: 6,
                  }}
                />
                <ThemedText
                  style={{
                    fontSize: 11,
                    flexShrink: 1,
                  }}
                  numberOfLines={1}
                >
                  {item.name}
                </ThemedText>
                <ThemedText
                  style={{
                    fontSize: 11,
                    fontWeight: "bold",
                    marginLeft: 4,
                  }}
                >
                  ({item.quantity}x)
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

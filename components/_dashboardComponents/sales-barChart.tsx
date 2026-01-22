import { useLanguageStore } from "@/lib/stores/language-store";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Dimensions, View } from "react-native";
import { Card, useTheme } from "react-native-paper";
import { ThemedText } from "../ui";

export function SalesBarChart({ ordersData }: any) {
  const theme = useTheme();
  const { language } = useLanguageStore();

  const screenWidth = Dimensions.get("window").width;
  const orders = ordersData?.orders || [];
  
  // Filter out void orders
  const nonVoidOrders = orders.filter((order: any) => order.status !== "voided");

  const getLast7DaysSales = () => {
    const salesByDay: { [key: string]: number } = {};
    const last7Days: string[] = [];

    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      last7Days.push(dateStr);
      salesByDay[dateStr] = 0;
    }

    // Sum up sales by day (excluding void orders)
    nonVoidOrders.forEach((order: any) => {
      const orderDate = new Date(order.timestamp);
      const dateStr = orderDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (salesByDay.hasOwnProperty(dateStr)) {
        salesByDay[dateStr] += order.net_amount;
      }
    });

    return {
      labels: last7Days,
      data: last7Days.map((day) => salesByDay[day]),
    };
  };
  const chartData = getLast7DaysSales();
  const maxSales = Math.max(...chartData.data, 1);

  const BarChart = () => {
    const chartHeight = 200;
    const barWidth = (screenWidth - 80) / 7 - 8;

    return (
      <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
        {/* Chart */}
        <View
          style={{
            height: chartHeight,
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          {chartData.data.map((value, index) => {
            const barHeight =
              maxSales > 0 ? (value / maxSales) * (chartHeight - 40) : 0;
            return (
              <View
                key={index}
                style={{
                  alignItems: "center",
                  width: barWidth,
                }}
              >
                {/* Value label */}
                {value > 0 && (
                  <ThemedText
                    style={{
                      fontSize: 10,
                      marginBottom: 4,
                      fontWeight: "600",
                    }}
                  >
                    ${value.toFixed(0)}
                  </ThemedText>
                )}
                {/* Bar */}
                <View
                  style={{
                    width: barWidth,
                    height: Math.max(barHeight, 4),
                    backgroundColor: theme.colors.primary,
                    borderRadius: 4,
                    opacity: value > 0 ? 1 : 0.3,
                  }}
                />
              </View>
            );
          })}
        </View>

        {/* X-axis labels */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 8,
          }}
        >
          {chartData.labels.map((label, index) => (
            <ThemedText
              key={index}
              style={{
                fontSize: 10,
                width: barWidth,
                textAlign: "center",
              }}
            >
              {label}
            </ThemedText>
          ))}
        </View>
      </View>
    );
  };
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
              {language === "en" ? "Last 7 Days Sales" : "最近7天銷售"}
            </ThemedText>
            <ThemedText style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
              {language === "en" ? "Daily sales overview" : "每日銷售概覽"}
            </ThemedText>
          </View>
          <MaterialIcons
            name="show-chart"
            size={24}
            color={theme.colors.primary}
          />
        </View>
        <BarChart />
      </Card.Content>
    </Card>
  );
}

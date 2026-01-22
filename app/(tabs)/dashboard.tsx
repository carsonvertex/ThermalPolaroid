import { RecentOrders } from "@/components/_dashboardComponents/recent-orders";
import { SalesBarChart } from "@/components/_dashboardComponents/sales-barChart";
import { StatCards } from "@/components/_dashboardComponents/stat-cards";
import { ThemedText, ThemedView } from "@/components/ui";
import { SimpleOrderRepository } from "@/endpoints/sqlite/repositories/simple-order-repository";
import { useLanguageStore } from "@/lib/stores/language-store";
import { useQuery } from "@tanstack/react-query";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const orderRepository = new SimpleOrderRepository();

export default function DashboardScreen() {
  const theme = useTheme();
  const { language } = useLanguageStore();
  const insets = useSafeAreaInsets();

  // Calculate tab bar height: paddingTop(8) + icon(28) + text margin(4) + text(~14) + padding(8) + safe area
  const TAB_BAR_HEIGHT = 8 + 28 + 4 + 14 + 8 + insets.bottom;

  // Fetch all orders for statistics
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["dashboard-orders"],
    queryFn: async () => {
      // Fetch a large page to get all recent orders for dashboard
      return await orderRepository.findByPage(1, 1000);
    },
  });

  const orders = ordersData?.orders || [];

  // Filter out void orders
  const nonVoidOrders = orders.filter((order) => order.status !== "voided");

  // Calculate statistics
  const stats = {
    totalSales: nonVoidOrders.reduce(
      (sum: number, order) => sum + order.net_amount,
      0
    ),
    totalOrders: nonVoidOrders.length,
    averageOrder:
      nonVoidOrders.length > 0
        ? nonVoidOrders.reduce(
            (sum: number, order) => sum + order.net_amount,
            0
          ) / nonVoidOrders.length
        : 0,
    todaySales: nonVoidOrders
      .filter((order) => {
        const orderDate = new Date(order.timestamp);
        const today = new Date();
        return orderDate.toDateString() === today.toDateString();
      })
      .reduce((sum: number, order) => sum + order.net_amount, 0),
  };

  if (isLoading) {
    return (
      <ThemedView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ThemedText>
          {language === "en" ? "Loading..." : "加載中..."}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ThemedView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 16 }}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={() => {}} />
          }
        >
          <View style={{ flex: 1, padding: 16, gap: 16 }}>
            {/* Header */}
            <View style={{ marginBottom: 24 }}>
              <ThemedText
                style={{ fontSize: 28, fontWeight: "bold", marginBottom: 4 }}
              >
                {language === "en" ? "Dashboard" : "儀表板"}
              </ThemedText>
              <ThemedText style={{ fontSize: 14, opacity: 0.7 }}>
                {language === "en"
                  ? "Overview of your sales performance"
                  : "銷售業績概覽"}
              </ThemedText>
            </View>

            {/* Stat Cards */}
            <StatCards stats={stats} language={language} />

            {/* Sales Chart */}
            <SalesBarChart ordersData={ordersData} />

            {/* Recent Orders */}
            <RecentOrders orders={nonVoidOrders} />
          </View>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

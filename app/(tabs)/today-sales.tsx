import { ProductPieChart } from "@/components/_dashboardComponents/product-pie-chart";
import { StatCard } from "@/components/_dashboardComponents/stat-card";
import OrderRecordTable from "@/components/_orderRecordComponents/orderRecordTable";
import { ThemedText, ThemedView } from "@/components/ui";
import { simpleOrderRepository } from "@/endpoints/sqlite/repositories";
import { useLanguageStore } from "@/lib/stores/language-store";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { Button, useTheme } from "react-native-paper";

export default function TodaySalesScreen() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const router = useRouter();
  const theme = useTheme();
  const { language } = useLanguageStore();

  // Get today's date range (start of day to end of day)
  const getTodayDateRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.getTime();

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    const endOfDayTimestamp = endOfDay.getTime();

    return { startOfDay, endOfDayTimestamp };
  };

  const { startOfDay, endOfDayTimestamp } = getTodayDateRange();

  // Fetch today's orders with pagination
  const {
    data: ordersData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["today-sales", currentPage, pageSize],
    queryFn: async () => {
      return await simpleOrderRepository.searchWithPagination(
        currentPage,
        pageSize,
        "",
        startOfDay,
        endOfDayTimestamp
      );
    },
    staleTime: 0,
  });

  // Fetch all today's orders for stats
  const { 
    data: allTodayOrdersData,
    refetch: refetchStats 
  } = useQuery({
    queryKey: ["today-sales-stats"],
    queryFn: async () => {
      // Fetch all today's orders for stats calculation
      return await simpleOrderRepository.searchWithPagination(
        1,
        10000, // Large page size to get all today's orders
        "",
        startOfDay,
        endOfDayTimestamp
      );
    },
    staleTime: 0,
  });


  const orders = ordersData?.orders || [];
  const totalPages = ordersData?.totalPages || 0;
  const totalCount = ordersData?.totalCount || 0;

  const allTodayOrders = allTodayOrdersData?.orders || [];
  
  // Filter out void orders for statistics and charts
  const nonVoidTodayOrders = allTodayOrders.filter(
    (order) => order.status !== "voided"
  );

  // Parse products helper function
  const parseProducts = (productsJson: string) => {
    try {
      return JSON.parse(productsJson);
    } catch {
      return [];
    }
  };

  // Calculate statistics for today (excluding void orders)
  const stats = {
    totalOrders: nonVoidTodayOrders.length,
    totalSales: nonVoidTodayOrders.reduce(
      (sum: number, order) => sum + order.net_amount,
      0
    ),
    totalRevenue: nonVoidTodayOrders.reduce((sum: number, order) => {
      const products = parseProducts(order.products);
      return (
        sum +
        products.reduce(
          (productSum: number, product: any) =>
            productSum + product.quantity * product.unitPrice,
          0
        ) +
        (order.misc || 0)
      );
    }, 0),
    totalDiscount: nonVoidTodayOrders.reduce(
      (sum: number, order) => sum + (order.discount || 0),
      0
    ),
    averageOrder:
      nonVoidTodayOrders.length > 0
        ? nonVoidTodayOrders.reduce(
            (sum: number, order) => sum + order.net_amount,
            0
          ) / nonVoidTodayOrders.length
        : 0,
  };

  const handleRefresh = () => {
    refetch();
    refetchStats();
  };

  // Handle scroll to detect when user scrolls down to bottom
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const paddingToBottom = 20;
      const isCloseToBottom =
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - paddingToBottom;

      // Refetch when scrolling to bottom
      if (isCloseToBottom && !isRefetching && !isLoading) {
        refetch();
        refetchStats();
      }
    },
    [isRefetching, isLoading, refetch, refetchStats]
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
        }
        onScroll={handleScroll}
        scrollEventThrottle={400}
      >
        <ThemedView
          style={{ flex: 1, padding: 16, gap: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ marginBottom: 24 }}>
            <Button
              mode="contained"
              onPress={() => router.back()}
              labelStyle={{ fontSize: 14, opacity: 0.7 }}
            >
              {language === "en" ? "Go Back" : "返回上一頁"}
            </Button>
            <ThemedText style={{ fontSize: 14, opacity: 0.7 }}>
              {language === "en"
                ? "View today's sales performance and orders"
                : "查看今日銷售業績和訂單"}
            </ThemedText>
          </View>

          {/* Stats Cards */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <StatCard
                title={language === "en" ? "Total Orders" : "總訂單數"}
                value={stats.totalOrders.toString()}
                icon="receipt"
                color="#FF9800"
                onPress={() => {}}
              />
            </View>
            <View style={{ flex: 1 }}>
              <StatCard
                title={language === "en" ? "Total Sales" : "總銷售額"}
                value={`$${stats.totalSales.toFixed(2)}`}
                icon="attach-money"
                color="#4CAF50"
                onPress={() => {}}
              />
            </View>
          </View>

          <View style={{ marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <StatCard
                title={language === "en" ? "Average Order" : "平均訂單"}
                value={`$${stats.averageOrder.toFixed(2)}`}
                icon="trending-up"
                color="#9C27B0"
                onPress={() => {}}
              />
            </View>
          </View>

          {/* Product Pie Chart */}
          <ProductPieChart
            orders={nonVoidTodayOrders}
            parseProducts={parseProducts}
          />

          {/* Orders Table with Pagination */}

          <View style={{ marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <OrderRecordTable
                orders={orders}
                loading={isLoading}
                totalCount={totalCount}
                parseProducts={parseProducts}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                pageSize={pageSize}
                setPageSize={setPageSize}
              />
            </View>
          </View>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

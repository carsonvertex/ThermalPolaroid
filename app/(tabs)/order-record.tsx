import OrderRecordSearch from "@/components/_orderRecordComponents/orderRecordSearch";
import OrderRecordTable from "@/components/_orderRecordComponents/orderRecordTable";
import { ThemedText, ThemedView } from "@/components/ui";
import { simpleOrderRepository } from "@/endpoints/sqlite/repositories";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useLanguageStore } from "@/lib/stores/language-store";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { Card, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OrderRecordScreen() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [startDate, setStartDate] = useState<number | undefined>(undefined);
  const [endDate, setEndDate] = useState<number | undefined>(undefined);
  const [isSearching, setIsSearching] = useState(false);

  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Calculate tab bar height: paddingTop(8) + icon(28) + text margin(4) + text(~14) + padding(8) + safe area
  const TAB_BAR_HEIGHT = 8 + 28 + 4 + 14 + 8 + insets.bottom;

  // Use React Query to fetch orders
  const {
    data: ordersData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: [
      "order-records",
      currentPage,
      pageSize,
      searchTerm,
      startDate,
      endDate,
    ],
    queryFn: async () => {
      console.log("🔄 Loading orders from database...");

      if (searchTerm || startDate || endDate) {
        console.log("🔍 Searching with filters:", {
          searchTerm,
          startDate,
          endDate,
        });
        const result = await simpleOrderRepository.searchWithPagination(
          currentPage,
          pageSize,
          searchTerm || "",
          startDate,
          endDate
        );
        console.log("🔍 Search results:", result);
        return result;
      } else {
        console.log("📄 Using regular pagination");
        return await simpleOrderRepository.findByPage(currentPage, pageSize);
      }
    },
    staleTime: 0, // Always refetch when query is invalidated
  });

  const orders = ordersData?.orders || [];
  const totalPages = ordersData?.totalPages || 0;
  const totalCount = ordersData?.totalCount || 0;

  const handleRefresh = () => {
    refetch();
  };

  const handleSearch = (term: string, startDate?: number, endDate?: number) => {
    setSearchTerm(term);
    setStartDate(startDate);
    setEndDate(endDate);
    setCurrentPage(1); // Reset to first page when searching
    setIsSearching(true);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setStartDate(undefined);
    setEndDate(undefined);
    setCurrentPage(1); // Reset to first page when clearing
    setIsSearching(false);
  };

  const parseProducts = (productsJson: string) => {
    try {
      return JSON.parse(productsJson);
    } catch {
      return [];
    }
  };

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
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
            />
          }
        >
          <View style={{ padding: 16 }}>
          {/* Header */}
            <View
              style={{
                paddingHorizontal: 16,
                paddingBottom: 16,
                paddingTop: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <View style={{ flex: 1 }}>
                  <ThemedText
                    style={{
                      fontSize: 28,
                      fontWeight: "bold",
                      marginBottom: 4,
                    }}
                  >
                    {language === "en" ? "Order Records" : "訂單記錄"}
                  </ThemedText>
                  <ThemedText style={{ fontSize: 14, opacity: 0.7 }}>
                    {language === "en"
                      ? "View and manage order history"
                      : "查看和管理訂單歷史"}
                  </ThemedText>
                </View>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                ></View>
              </View>
            </View>

            {/* Search Component */}
            <OrderRecordSearch
              onSearch={handleSearch}
              onClear={handleClearSearch}
              loading={isLoading || isRefetching}
            />

            {/* Search Status Indicator */}
            {isSearching && (
              <Card
                style={{
                  marginBottom: 16,
                  backgroundColor: theme.colors.primaryContainer,
                }}
                elevation={1}
              >
                <Card.Content style={{ padding: 12 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <MaterialIcons
                        name="search"
                        size={20}
                        color={theme.colors.primary}
                        style={{ marginRight: 8 }}
                      />
                      <ThemedText
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: theme.colors.primary,
                        }}
                      >
                        {language === "en" ? "Search Active" : "搜索中"}
                      </ThemedText>
                      <ThemedText
                        style={{ fontSize: 12, opacity: 0.7, marginLeft: 8 }}
                      >
                        {totalCount} {language === "en" ? "result" : "結果"}
                        {totalCount !== 1 ? (language === "en" ? "s" : "") : ""}
                        {language === "en" ? "found" : "找到"}
                      </ThemedText>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            )}

            {/* Orders Table with Integrated Pagination */}
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
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

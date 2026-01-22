import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ClearProductButton from "@/components/_productMasterComponents/clear-product-button";
import ProductListPaginated from "@/components/_productMasterComponents/product-list-paginated";
import ProductPagination from "@/components/_productMasterComponents/product-pagination";
import ProductSearch from "@/components/_productMasterComponents/product-search";
import SyncProductButton from "@/components/_productMasterComponents/sync-product-button";
import { ThemedText, ThemedView } from "@/components/ui";
import { databaseEnvironmentApi } from "@/endpoints/config/database-environment";
import { useBackendConnection } from "@/hooks/use-backend-connection";
import {
  PaginatedProductResult,
  useClearRoadShowProducts,
  useRoadShowProductCount,
  useSearchRoadShowProducts,
  useSyncRoadShowProducts,
} from "@/lib/hooks/queries/use-roadshow-products";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useDatabaseEnvironmentStore } from "@/lib/stores/database-environment-store";
import { useLanguageStore } from "@/lib/stores/language-store";
import { useSyncStore } from "@/lib/stores/sync-store";
import { MaterialIcons } from "@expo/vector-icons";
import { Card, Switch, useTheme } from "react-native-paper";

const PAGE_SIZE = 20;

export default function ProductMasterScreen() {
  const paperTheme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const { lastProductSync, setLastProductSync } = useSyncStore();
  const { isConnected: isBackendConnected } = useBackendConnection(30000);
  const dbEnvironment = useDatabaseEnvironmentStore((state) => state.environment);
  const setDbEnvironment = useDatabaseEnvironmentStore((state) => state.setEnvironment);
  const insets = useSafeAreaInsets();
  
  const isDeveloper = user?.role === "developer";

  // Calculate tab bar height: paddingTop(8) + icon(28) + text margin(4) + text(~14) + padding(8) + safe area
  const TAB_BAR_HEIGHT = 8 + 28 + 4 + 14 + 8 + insets.bottom;
  
  // Pagination and Search State
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Queries
  const {
    data: paginatedData,
    isLoading,
    refetch,
  } = useSearchRoadShowProducts(currentPage, PAGE_SIZE, searchTerm);
  const { data: productCount } = useRoadShowProductCount();
  const syncMutation = useSyncRoadShowProducts();
  const clearMutation = useClearRoadShowProducts();

  // Extract data from paginated response with proper type checking
  const products = (paginatedData as PaginatedProductResult | undefined)?.products ?? [];
  const totalPages = (paginatedData as PaginatedProductResult | undefined)?.totalPages ?? 0;
  const totalCount = (paginatedData as PaginatedProductResult | undefined)?.totalCount ?? 0;

  // Handle sync button press
  const handleSync = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Not Available", "Sync is not available on web platform");
      return;
    }

    if (!isBackendConnected) {
      Alert.alert(
        language === "en" ? "No Connection" : "無連接",
        language === "en"
          ? "Cannot sync. Backend server is not reachable."
          : "無法同步。後端服務器無法連接。"
      );
      return;
    }

    Alert.alert(
      language === "en" ? "Sync Road Show Products" : "同步商品資料",
      language === "en"
        ? "This will clear all local products and download fresh data from the server. Continue?"
        : "這將清除所有本地商品並從服務器下載新數據。繼續嗎？",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sync Now",
          style: "default",
          onPress: async () => {
            try {
              const result = await syncMutation.mutateAsync();
              if (result.success) {
                setLastProductSync(new Date());
                Alert.alert(
                  "Sync Complete",
                  `Successfully synced ${result.inserted} products!`
                );
              } else {
                Alert.alert("Sync Failed", result.message);
              }
            } catch (error) {
              let errorMessage = "Failed to sync products";
              
              if (error instanceof Error) {
                errorMessage = error.message;
                
                // Handle device authorization errors
                if (error.message.includes('DEVICE_NOT_AUTHORIZED')) {
                  errorMessage = error.message.replace('DEVICE_NOT_AUTHORIZED: ', '');
                  Alert.alert(
                    language === "en" ? "Device Not Authorized" : "設備未授權",
                    errorMessage + (language === "en" 
                      ? "\n\nPlease ensure your device is registered in the system."
                      : "\n\n請確保您的設備已在系統中註冊。")
                  );
                  return;
                }
                
                // Handle network errors
                if (error.message.includes('Failed to fetch') || 
                    error.message.includes('Network request failed') ||
                    error.message.includes('NetworkError')) {
                  errorMessage = language === "en"
                    ? "Cannot connect to server. Please check your network connection."
                    : "無法連接到服務器。請檢查您的網絡連接。";
                }
              }
              
              Alert.alert(
                language === "en" ? "Sync Error" : "同步錯誤",
                errorMessage
              );
            }
          },
        },
      ]
    );
  };

  // Handle clear button press
  const handleClear = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Not Available",
        language === "en"
          ? "Clear is not available on web platform"
          : "清除功能在Web平台上不可用"
      );
      return;
    }

    if (!productCount || productCount === 0) {
      Alert.alert(
        "No Data",
        language === "en"
          ? "There are no products to clear."
          : "沒有商品可以清除。"
      );
      return;
    }

    Alert.alert(
      language === "en" ? "Clear Local Database" : "清除本地資料庫",
      language === "en"
        ? `Are you sure you want to delete all ${productCount} products from local database? This action cannot be undone.`
        : `你確定要刪除所有${productCount}個商品嗎？此操作無法撤銷。`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: language === "en" ? "Clear All" : "清除所有",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await clearMutation.mutateAsync();
              if (result.success) {
                Alert.alert(
                  language === "en" ? "Cleared Successfully" : "清除成功",
                  language === "en"
                    ? "All products have been removed from local database."
                    : "所有商品已從本地資料庫中刪除。"
                );
              }
            } catch (error) {
              Alert.alert(
                language === "en" ? "Clear Error" : "清除錯誤",
                error instanceof Error
                  ? error.message
                  : language === "en"
                  ? "Failed to clear products"
                  : "清除商品失敗"
              );
            }
          },
        },
      ]
    );
  };

  // Handle pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when searching
    setIsSearching(true);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1); // Reset to first page when clearing
    setIsSearching(false);
  };

  // Reset to first page after sync or clear
  useEffect(() => {
    if (syncMutation.isSuccess || clearMutation.isSuccess) {
      setCurrentPage(1);
      setSearchTerm("");
      setIsSearching(false);
    }
  }, [syncMutation.isSuccess, clearMutation.isSuccess]);

  // Handle database environment toggle
  const handleDatabaseEnvironmentToggle = (value: boolean) => {
    const newEnvironment = value ? "dev" : "prd";
    
    Alert.alert(
      language === "en" ? "Change Database Environment" : "更改資料庫環境",
      language === "en"
        ? `Switch to ${newEnvironment.toUpperCase()} database? This will affect all future API requests.`
        : `切換到 ${newEnvironment.toUpperCase()} 資料庫？這將影響所有未來的 API 請求。`,
      [
        { text: language === "en" ? "Cancel" : "取消", style: "cancel" },
        {
          text: language === "en" ? "Change" : "更改",
          onPress: () => {
            databaseEnvironmentApi.setEnvironment(newEnvironment);
            Alert.alert(
              language === "en" ? "Success" : "成功",
              language === "en"
                ? `Database environment changed to ${newEnvironment.toUpperCase()}. All future requests will use this environment.`
                : `資料庫環境已更改為 ${newEnvironment.toUpperCase()}。所有未來的請求將使用此環境。`
            );
          },
        },
      ]
    );
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          stickyHeaderIndices={[1]}
        >
        {/* Header and Controls */}
        <View style={{ padding: 16, paddingBottom: 8 }}>
          {/* Header */}
          <View style={{ marginBottom: 16 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    color: paperTheme.colors.onSurface,
                  }}
                >
                  {language === "en" ? "Road Show Products" : "Road Show商品"}
                </Text>
               
              </View>
              {totalCount > 0 && (
                <View
                  style={{
                    backgroundColor: paperTheme.colors.primary,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: "#fff",
                    }}
                  >
                    {totalCount}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Database Environment Toggle - Developer Only */}
          {isDeveloper && (
            <Card
              style={{
                marginBottom: 16,
                backgroundColor: paperTheme.colors.surface,
              }}
              elevation={2}
            >
              <Card.Content style={{ padding: 16 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <View
                      style={{
                        backgroundColor: "#FF9800",
                        padding: 12,
                        borderRadius: 12,
                        marginRight: 16,
                      }}
                    >
                      <MaterialIcons name="storage" size={24} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontSize: 16, fontWeight: "600", marginBottom: 4 }}>
                        {language === "en" ? "Database Environment" : "資料庫環境"}
                      </ThemedText>
                      <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                        {language === "en"
                          ? `Current: ${dbEnvironment.toUpperCase()}`
                          : `當前：${dbEnvironment.toUpperCase()}`}
                      </ThemedText>
                    </View>
                  </View>
                  <Switch
                    value={dbEnvironment === "dev"}
                    onValueChange={handleDatabaseEnvironmentToggle}
                  />
                </View>
                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: paperTheme.colors.surfaceVariant }}>
                  <ThemedText style={{ fontSize: 11, opacity: 0.6, fontStyle: "italic" }}>
                    {language === "en"
                      ? "✅ Changes take effect immediately - no restart required"
                      : "✅ 更改立即生效 - 無需重啟"}
                  </ThemedText>
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Action Buttons */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <SyncProductButton
                handleSync={handleSync}
                syncMutation={syncMutation}
                isBackendConnected={isBackendConnected}
                lastSyncTime={lastProductSync ? new Date(lastProductSync) : null}
              />
            </View>

            {(user?.role === "admin" || user?.role === "developer") && (
              <View style={{ flex: 1 }}>
                <ClearProductButton
                  handleClear={handleClear}
                  clearMutation={clearMutation}
                  productCount={productCount}
                />
              </View>
            )}
          </View>

          {/* Search Component */}
          <Card
            style={{
              marginBottom: 16,
              backgroundColor: paperTheme.colors.surface,
            }}
            elevation={2}
          >
            <Card.Content style={{ padding: 16 }}>
              <ProductSearch
                onSearch={handleSearch}
                onClear={handleClearSearch}
                loading={isLoading}
              />
            </Card.Content>
          </Card>

          {/* Search Status Indicator */}
          {isSearching && (
            <Card
              style={{
                marginBottom: 16,
                backgroundColor: paperTheme.colors.primaryContainer,
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
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <MaterialIcons
                      name="search"
                      size={20}
                      color={paperTheme.colors.primary}
                      style={{ marginRight: 8 }}
                    />
                    <ThemedText
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: paperTheme.colors.primary,
                      }}
                    >
                      {language === "en" ? "Search Active" : "搜索中"}
                    </ThemedText>
                    <ThemedText
                      style={{ fontSize: 12, opacity: 0.7, marginLeft: 8 }}
                    >
                      {totalCount} {language === "en" ? "result" : "結果"}
                      {totalCount !== 1
                        ? language === "en"
                          ? "s"
                          : ""
                        : ""}{" "}
                      {language === "en" ? "found" : "找到"}
                    </ThemedText>
                  </View>
                  <TouchableOpacity onPress={handleClearSearch}>
                    <ThemedText
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: paperTheme.colors.primary,
                      }}
                    >
                      {language === "en" ? "Clear" : "清空"}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </Card.Content>
            </Card>
          )}
        </View>

        {/* Pagination - Sticky Header */}
        <View
          style={{
            backgroundColor: paperTheme.colors.background,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: paperTheme.colors.outlineVariant,
          }}
        >
          <ProductPagination
            totalPages={totalPages}
            currentPage={currentPage}
            totalCount={totalCount}
            setCurrentPage={setCurrentPage}
          />
        </View>

        {/* Products List */}
        <View style={{ padding: 16, paddingTop: 8 }}>
          <ProductListPaginated
            isLoading={isLoading}
            products={products}
            totalCount={totalCount}
          />
        </View>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

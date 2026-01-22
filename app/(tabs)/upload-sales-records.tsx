import UploadCard from "@/components/_uploadSalesRecordComponents/upload-card";
import UploadOrderList from "@/components/_uploadSalesRecordComponents/upload-order-list";
import UploadProgress from "@/components/_uploadSalesRecordComponents/upload-progress";
import { ThemedText, ThemedView } from "@/components/ui";
import { postRoadshowOrder } from "@/endpoints/erp/roadshow-encryption";
import { simpleOrderRepository } from "@/endpoints/sqlite/repositories";
import { SimpleOrderItem } from "@/endpoints/sqlite/repositories/simple-order-repository";
import { useDeviceInfo } from "@/hooks/use-device-info";
import { useAppContext } from "@/lib/contexts/app-context";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useLanguageStore } from "@/lib/stores/language-store";
import { useUploadProgressStore } from "@/lib/stores/upload-progress-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { Switch, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PAGE_SIZE = 20;

type SyncStatusTab = "pending" | "synced" | "voided";

export default function UploadSalesRecordsScreen() {
  const { language } = useLanguageStore();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [activeTab, setActiveTab] = useState<SyncStatusTab>("pending");
  const { useProductionUrl, setUseProductionUrl, uploadUrl } = useAppContext();
  const cancelUploadRef = useRef(false);
  const uploadProgressStore = useUploadProgressStore();
  const deviceInfo = useDeviceInfo();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  
  // Check if user is developer
  const isDeveloper = user?.role === "developer";

  // Calculate tab bar height: paddingTop(8) + icon(28) + text margin(4) + text(~14) + padding(8) + safe area
  const TAB_BAR_HEIGHT = 8 + 28 + 4 + 14 + 8 + insets.bottom;

  // Fetch orders based on active tab (pending or synced) with pagination
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["upload-orders", activeTab, currentPage, pageSize],
    queryFn: async () => {
      if (Platform.OS === "web") {
        return { orders: [], totalCount: 0, totalPages: 0 };
      }

      // Fetch ALL orders to get accurate count
      const allResult = await simpleOrderRepository.findByPage(1, 10000);
      const filteredOrders = allResult.orders.filter(
        (order: SimpleOrderItem) => {
          if (activeTab === "voided") {
            return order.status === "voided";
          } else {
            return order.sync_status === activeTab && order.status === "completed";
          }
        }
      );
      
      // Sort orders by ID in ascending order
      const sortedOrders = filteredOrders.sort((a, b) => {
        const idA = a.id || 0;
        const idB = b.id || 0;
        return idA - idB;
      });
      
      const totalCount = sortedOrders.length;
      const totalPages = Math.ceil(totalCount / pageSize);

      // Get paginated slice
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedOrders = sortedOrders.slice(startIndex, endIndex);

      return {
        orders: paginatedOrders,
        totalCount,
        totalPages,
      };
    },
  });


  const orders = ordersData?.orders || [];
  const totalCount = ordersData?.totalCount || 0;
  const totalPages = ordersData?.totalPages || 0;

  // Upload order helper function
  const uploadOrderToServer = async (order: SimpleOrderItem) => {
    // Parse products if it's a string

    console.log('order', order);
    let productsArray = [];
    try {
      productsArray =
        typeof order.products === "string"
          ? JSON.parse(order.products)
          : order.products;
    } catch (e) {
      console.error("Failed to parse products:", e);
      productsArray = [];
    }

    // Complete order data to be encrypted
    const orderData = {
      order_id: order.id!,
      uuid: `${deviceInfo.deviceId || 'unknown'}-order-${order.id}-${order.timestamp}`,
      nonce: `roadshow-nonce-${order.id}`,
      request_time: Math.floor(Date.now() / 1000),
      staff_id: order.staff_id,
      timestamp: order.created_at,
      products: productsArray,
      products_total: order.products_total,
      misc: order.misc,
      total_amount: order.total_amount,
      discount: order.discount,
      net_amount: order.net_amount,
      net_received: order.net_received,
      change_amount: order.change_amount,
      payment_reference: order.payment_reference || "",
      status: order.status,
      is_override: order.is_override ?? 0, // Include override flag (0 or 1)
      payment_method: order.payment_method || "cash", // Include payment method
      uploadDevice: deviceInfo.deviceId || null,
    };

    // Encrypt and POST to server with selected URL from context
    await postRoadshowOrder(orderData, uploadUrl);
    // Update sync status in local database
    await simpleOrderRepository.updateSyncStatus(order.id!, "synced");
  };

  // Mutation: Upload single order
  const uploadSingleMutation = useMutation({
    mutationFn: uploadOrderToServer,
    onSuccess: (_: unknown, order: SimpleOrderItem) => {
      // If last item on page, go to previous page
      if (orders.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      // Invalidate upload orders query
      queryClient.invalidateQueries({ queryKey: ["upload-orders"] });
      // Invalidate order details queries to reflect updated sync_status
      queryClient.invalidateQueries({ queryKey: ["today-sales"] });
      queryClient.invalidateQueries({ queryKey: ["today-sales-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-records"] });
      Alert.alert(
        language === "en" ? "Success" : "成功",
        language === "en"
          ? `Order #${order.id} uploaded successfully!`
          : `訂單 #${order.id} 上傳成功！`
      );
    },
    onError: (error: unknown, order: SimpleOrderItem) => {
      Alert.alert(
        language === "en" ? "Error" : "錯誤",
        language === "en"
          ? `Failed to upload order #${order.id}:\n${
              error instanceof Error ? error.message : String(error)
            }`
          : `上傳訂單 #${order.id} 失敗：\n${
              error instanceof Error ? error.message : String(error)
            }`
      );
    },
  });

  // Mutation: Upload all orders
  const uploadAllMutation = useMutation({
    mutationFn: async (ordersToUpload: SimpleOrderItem[]) => {
      cancelUploadRef.current = false; // Reset cancel flag
      uploadProgressStore.startUpload(ordersToUpload.length); // Start global progress
      
      let successCount = 0;
      let failCount = 0;
      let cancelled = false;

      for (let i = 0; i < ordersToUpload.length; i++) {
        // Check if upload was cancelled
        if (cancelUploadRef.current) {
          cancelled = true;
          console.log(
            `⏹️ Upload cancelled at ${i + 1}/${ordersToUpload.length}`
          );
          break;
        }

        const order = ordersToUpload[i];
        
        try {
          await uploadOrderToServer(order);
          successCount++;
        } catch (error) {
          console.error(`❌ Failed to upload order ${order.id}:`, error);
          failCount++;
        }
        
        // Update global progress
        uploadProgressStore.updateProgress(i + 1, successCount, failCount);
      }

      return { successCount, failCount, cancelled };
    },
    onSuccess: ({
      successCount,
      failCount,
      cancelled,
    }: {
      successCount: number;
      failCount: number;
      cancelled?: boolean;
    }) => {
      uploadProgressStore.completeUpload(); // Complete global progress
      setCurrentPage(1); // Reset to first page after upload all
      // Invalidate upload orders query
      queryClient.invalidateQueries({ queryKey: ["upload-orders"] });
      // Invalidate order details queries to reflect updated sync_status
      queryClient.invalidateQueries({ queryKey: ["today-sales"] });
      queryClient.invalidateQueries({ queryKey: ["today-sales-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-records"] });

      const title = cancelled
        ? language === "en"
          ? "Upload Cancelled"
          : "上傳已取消"
        : language === "en"
        ? "Upload Complete"
        : "上傳完成";

      const message = cancelled
        ? language === "en"
          ? `Uploaded: ${successCount}\nFailed: ${failCount}\nCancelled by user`
          : `已上傳: ${successCount}\n失敗: ${failCount}\n用戶取消`
        : language === "en"
        ? `Success: ${successCount}\nFailed: ${failCount}`
        : `成功: ${successCount}\n失敗: ${failCount}`;

      Alert.alert(title, message);
    },
    onError: () => {
      uploadProgressStore.completeUpload(); // Complete global progress on error
    },
  });

  const handleUploadSingle = (order: SimpleOrderItem) => {
    console.log("📤 Uploading order:", order.id);
    uploadSingleMutation.mutate(order);
  };

  const handleUploadAll = async () => {
    if (totalCount === 0) return;

    Alert.alert(
      language === "en" ? "Upload All Orders" : "上傳所有訂單",
      language === "en"
        ? `Upload all ${totalCount} pending orders?`
        : `上傳所有 ${totalCount} 個待處理訂單？`,
      [
        { text: language === "en" ? "Cancel" : "取消", style: "cancel" },
        {
          text: language === "en" ? "Upload" : "上傳",
          onPress: async () => {
            // Fetch all pending orders for upload
            const allResult = await simpleOrderRepository.findByPage(1, 10000);
            const allPendingOrders = allResult.orders
              .filter(
                (order: SimpleOrderItem) =>
                  order.sync_status === "pending" && order.status === "completed"
              )
              .sort((a, b) => {
                const idA = a.id || 0;
                const idB = b.id || 0;
                return idA - idB;
              });
            uploadAllMutation.mutate(allPendingOrders);
          },
        },
      ]
    );
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["upload-orders"] });
  };

  const handleTabChange = (tab: SyncStatusTab) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset to first page when switching tabs
  };

  const parseProducts = (productsJson: string) => {
    try {
      return JSON.parse(productsJson);
    } catch {
      return [];
    }
  };

  const handleCancelUpload = () => {
    cancelUploadRef.current = true;
    uploadProgressStore.cancelUpload();
  };

  const isRefreshing =
    isLoading || uploadSingleMutation.isPending || uploadAllMutation.isPending;

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
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        >
        <View style={{ padding: 16 }}>
          {/* Header */}
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <View style={{ flex: 1 }}>
                <ThemedText
                  style={{ fontSize: 28, fontWeight: "bold", marginBottom: 4 }}
                >
                  {language === "en" ? "Upload Sales Records" : "上傳銷售記錄"}
                </ThemedText>
                <ThemedText style={{ fontSize: 14, opacity: 0.7 }}>
                  {language === "en"
                    ? "Sync pending orders to server"
                    : "同步待處理訂單到服務器"}
                </ThemedText>
              </View>
            </View>
            
            {/* URL Toggle Switch - Only show for developers */}
            {isDeveloper && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 16,
                  padding: 12,
                  backgroundColor: theme.colors.surface,
                  borderRadius: 8,
                  elevation: 2,
                }}
              >
                <View style={{ flex: 1 }}>
                  <ThemedText
                    style={{ fontSize: 14, fontWeight: "600", marginBottom: 4 }}
                  >
                    {language === "en" ? "Upload Target" : "上傳目標"}
                  </ThemedText>
                  <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                    {useProductionUrl
                      ? language === "en"
                        ? "Production Server"
                        : "生產服務器"
                      : language === "en"
                      ? "Development Server"
                      : "開發服務器"}
                  </ThemedText>
                </View>
                <Switch
                  value={useProductionUrl}
                  onValueChange={setUseProductionUrl}
                  color={theme.colors.primary}
                />
              </View>
            )}
          </View>

     

          {/* Upload Progress - Only show for pending tab */}
          {activeTab === "pending" && (
            <UploadProgress
              uploadAllMutation={uploadAllMutation}
            />
          )}

          {/* Tabs */}
          <View
            style={{
              flexDirection: "row",
              marginBottom: 16,
              backgroundColor: theme.colors.surface,
              borderRadius: 8,
              padding: 4,
              elevation: 2,
            }}
          >
            <TouchableOpacity
              onPress={() => handleTabChange("pending")}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 6,
                backgroundColor:
                  activeTab === "pending"
                    ? theme.colors.primary
                    : "transparent",
                alignItems: "center",
              }}
            >
              <ThemedText
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color:
                    activeTab === "pending"
                      ? theme.colors.onPrimary
                      : theme.colors.onSurface,
                }}
              >
                {language === "en" ? "Pending" : "待處理"}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleTabChange("synced")}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 6,
                backgroundColor:
                  activeTab === "synced"
                    ? theme.colors.primary
                    : "transparent",
                alignItems: "center",
              }}
            >
              <ThemedText
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color:
                    activeTab === "synced"
                      ? theme.colors.onPrimary
                      : theme.colors.onSurface,
                }}
              >
                {language === "en" ? "Synced" : "已同步"}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleTabChange("voided")}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 6,
                backgroundColor:
                  activeTab === "voided"
                    ? theme.colors.primary
                    : "transparent",
                alignItems: "center",
              }}
            >
              <ThemedText
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color:
                    activeTab === "voided"
                      ? theme.colors.onPrimary
                      : theme.colors.onSurface,
                }}
              >
                {language === "en" ? "Voided" : "已作廢"}
              </ThemedText>
            </TouchableOpacity>
          </View>

               {/* Summary Card - Only show for pending tab */}
               {activeTab === "pending" && (
            <UploadCard
              orders={orders}
              totalCount={totalCount}
              handleUploadAll={handleUploadAll}
              handleCancelUpload={handleCancelUpload}
              isRefreshing={isRefreshing}
              isUploading={uploadAllMutation.isPending}
            />
          )}

          {/* Orders List with Integrated Pagination */}
          <UploadOrderList
            orders={orders}
            isLoading={isLoading}
            handleUploadSingle={handleUploadSingle}
            isRefreshing={isRefreshing}
            isUploading={uploadSingleMutation.isPending || uploadAllMutation.isPending}
            totalCount={totalCount}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
            parseProducts={parseProducts}
            syncStatus={activeTab}
          />
        </View>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

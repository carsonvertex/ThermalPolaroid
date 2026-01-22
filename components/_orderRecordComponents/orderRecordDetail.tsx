import { postRoadshowOrder } from "@/endpoints/erp/roadshow-encryption";
import { simpleOrderRepository } from "@/endpoints/sqlite/repositories";
import { SimpleOrderItem } from "@/endpoints/sqlite/repositories/simple-order-repository";
import { useDeviceInfo } from "@/hooks/use-device-info";
import { useAppContext } from "@/lib/contexts/app-context";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { useLanguageStore } from "@/lib/stores/language-store";
import { useUploadProgressStore } from "@/lib/stores/upload-progress-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, View } from "react-native";
import { Button, useTheme } from "react-native-paper";
import DraggableBottomDrawer from "../shared/draggable-bottom-drawer";
import { PrintReceipt } from "../shared/print-receipt";
import { ThemedText } from "../ui";

export default function OrderRecordDetail({
  selectedOrder,
  parseProducts,
  showDetails,
  handleCloseDetails,
  formatDate,
  formatCurrency,
}: {
  selectedOrder: SimpleOrderItem;
  parseProducts: (products: string) => any;
  showDetails: boolean;
  handleCloseDetails: () => void;
  formatDate: (timestamp: number) => string;
  formatCurrency: (amount: number) => string;
}) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { language } = useLanguageStore();
  const isOnline = useOnlineStatus();
  const deviceInfo = useDeviceInfo();
  const { isUploading } = useUploadProgressStore();
  const { uploadUrl } = useAppContext();
  
  if (!selectedOrder) return null;
  const products = parseProducts(selectedOrder.products);
  const isSynced = selectedOrder.sync_status === "synced";
  const isNotVoided = selectedOrder.status !== "voided";

  // Mutation to void the order
  const voidOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      await simpleOrderRepository.update(orderId, { status: "voided" });
    },
    onSuccess: () => {
      // Invalidate all order-related queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["pending-upload-orders"] });
      queryClient.invalidateQueries({ queryKey: ["today-sales"] });
      queryClient.invalidateQueries({ queryKey: ["today-sales-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-records"] });
      
      // Close the drawer
      handleCloseDetails();
      
      Alert.alert(
        language === "en" ? "Success" : "成功",
        language === "en"
          ? `Order #${selectedOrder.id} has been voided.`
          : `訂單 #${selectedOrder.id} 已作廢。`
      );
    },
    onError: (error: unknown) => {
      Alert.alert(
        language === "en" ? "Error" : "錯誤",
        language === "en"
          ? `Failed to void order:\n${
              error instanceof Error ? error.message : String(error)
            }`
          : `作廢訂單失敗：\n${
              error instanceof Error ? error.message : String(error)
            }`
      );
    },
  });

  const handleVoidOrder = () => {
    Alert.alert(
      language === "en" ? "Void Order" : "作廢訂單",
      language === "en"
        ? `Are you sure you want to void order #${selectedOrder.id}? This action cannot be undone.`
        : `您確定要作廢訂單 #${selectedOrder.id} 嗎？此操作無法撤銷。`,
      [
        {
          text: language === "en" ? "Cancel" : "取消",
          style: "cancel",
        },
        {
          text: language === "en" ? "Void" : "作廢",
          style: "destructive",
          onPress: () => {
            voidOrderMutation.mutate(selectedOrder.id!);
          },
        },
      ]
    );
  };

  // Mutation to void and sync order to server
  const voidAndSyncMutation = useMutation({
    mutationFn: async () => {
      // Validation checks
      if (!selectedOrder.id) {
        throw new Error(
          language === "en"
            ? "Order ID is missing"
            : "訂單ID缺失"
        );
      }

      if (selectedOrder.status === "voided") {
        throw new Error(
          language === "en"
            ? "Order is already voided"
            : "訂單已經作廢"
        );
      }

      if (!isOnline) {
        throw new Error(
          language === "en"
            ? "No internet connection. Please check your network and try again."
            : "無網絡連接。請檢查您的網絡並重試。"
        );
      }

      if (!selectedOrder.staff_id || !selectedOrder.staff_id.trim()) {
        throw new Error(
          language === "en"
            ? "Staff ID is missing"
            : "員工ID缺失"
        );
      }

      // Parse products if it's a string
      let productsArray = [];
      try {
        productsArray =
          typeof selectedOrder.products === "string"
            ? JSON.parse(selectedOrder.products)
            : selectedOrder.products;
      } catch (e) {
        console.error("Failed to parse products:", e);
        throw new Error(
          language === "en"
            ? "Failed to parse order products"
            : "解析訂單產品失敗"
        );
      }

      if (!Array.isArray(productsArray) || productsArray.length === 0) {
        throw new Error(
          language === "en"
            ? "Order has no products"
            : "訂單沒有產品"
        );
      }

      // Validate order amounts
      if (selectedOrder.net_amount < 0) {
        throw new Error(
          language === "en"
            ? "Invalid order amount"
            : "訂單金額無效"
        );
      }

      // Create order data with void status
      const orderData = {
        order_id: selectedOrder.id!,
        uuid: `${deviceInfo.deviceId || 'unknown'}-order-${selectedOrder.id}-${selectedOrder.timestamp}`,
        nonce: `roadshow-nonce-void-${selectedOrder.id}`,
        request_time: Math.floor(Date.now() / 1000),
        staff_id: selectedOrder.staff_id.trim(),
        timestamp: selectedOrder.timestamp,
        products: productsArray,
        products_total: selectedOrder.products_total,
        misc: selectedOrder.misc,
        total_amount: selectedOrder.total_amount,
        discount: selectedOrder.discount,
        net_amount: selectedOrder.net_amount,
        net_received: selectedOrder.net_received,
        change_amount: selectedOrder.change_amount,
        payment_reference: selectedOrder.payment_reference || "",
        status: "voided", // Set status to voided
        is_override: selectedOrder.is_override ?? 0, // Include override flag (0 or 1)
        payment_method: selectedOrder.payment_method || "cash", // Include payment method
        uploadDevice: deviceInfo.deviceId || null,
      };

      // Upload directly to server using upload URL from context
      await postRoadshowOrder(orderData, uploadUrl);
      
      // Update the local record status to voided
      await simpleOrderRepository.update(selectedOrder.id!, { status: "voided" });
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["upload-orders"] });
      queryClient.invalidateQueries({ queryKey: ["pending-upload-orders"] });
      queryClient.invalidateQueries({ queryKey: ["today-sales"] });
      queryClient.invalidateQueries({ queryKey: ["today-sales-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-records"] });
      
      // Close the drawer
      handleCloseDetails();
      
      Alert.alert(
        language === "en" ? "Success" : "成功",
        language === "en"
          ? `Order #${selectedOrder.id} has been voided and synced to server.`
          : `訂單 #${selectedOrder.id} 已作廢並同步到服務器。`
      );
    },
    onError: (error: unknown) => {
      Alert.alert(
        language === "en" ? "Error" : "錯誤",
        language === "en"
          ? `Failed to void and sync order:\n${
              error instanceof Error ? error.message : String(error)
            }`
          : `作廢並同步訂單失敗：\n${
              error instanceof Error ? error.message : String(error)
            }`
      );
    },
  });

  const handleVoidAndSync = () => {
    Alert.alert(
      language === "en" ? "Void and Sync Order" : "作廢並同步訂單",
      language === "en"
        ? `Are you sure you want to void order #${selectedOrder.id} and sync it to the server? This will create a void record on the server.`
        : `您確定要作廢訂單 #${selectedOrder.id} 並同步到服務器嗎？這將在服務器上創建一個作廢記錄。`,
      [
        {
          text: language === "en" ? "Cancel" : "取消",
          style: "cancel",
        },
        {
          text: language === "en" ? "Void and Sync" : "作廢並同步",
          style: "destructive",
          onPress: () => {
            voidAndSyncMutation.mutate();
          },
        },
      ]
    );
  };

  return (
    <DraggableBottomDrawer
      showDrawer={showDetails}
      setShowDrawer={handleCloseDetails}
      title={
        language === "en"
          ? `Order Details #${selectedOrder.id}`
          : `訂單詳情 #${selectedOrder.id}`
      }
      children={
        <>
          {/* Order Info */}
          <View className="mb-6">
            <ThemedText className="text-base font-bold mb-3">
              {language === "en" ? "Order Information" : "訂單信息"}
            </ThemedText>

            <View
              className="flex-row justify-between py-2 border-b"
              style={{ borderBottomColor: theme.colors.outline }}
            >
              <ThemedText className="text-sm font-medium opacity-60">
                {language === "en" ? "Staff ID" : "員工ID"}:
              </ThemedText>
              <ThemedText className="text-sm font-semibold">
                {selectedOrder.staff_id}
              </ThemedText>
            </View>

            <View
              className="flex-row justify-between py-2 border-b"
              style={{ borderBottomColor: theme.colors.outline }}
            >
              <ThemedText className="text-sm font-medium opacity-60">
                {language === "en" ? "Date" : "日期"}:
              </ThemedText>
              <ThemedText className="text-sm font-semibold">
                {formatDate(selectedOrder.timestamp)}
              </ThemedText>
            </View>

            <View
              className="flex-row justify-between py-2 border-b"
              style={{ borderBottomColor: theme.colors.outline }}
            >
              <ThemedText className="text-sm font-medium opacity-60">
                {language === "en" ? "Status" : "狀態"}:
              </ThemedText>
              <ThemedText
                className="text-sm font-semibold"
                style={{
                  color:
                    selectedOrder.status === "voided"
                      ? theme.colors.error
                      : undefined,
                }}
              >
                {selectedOrder.status}
              </ThemedText>
            </View>

            <View
              className="flex-row justify-between py-2 border-b"
              style={{ borderBottomColor: theme.colors.outline }}
            >
              <ThemedText className="text-sm font-medium opacity-60">
                {language === "en" ? "Sync Status" : "同步狀態"}:
              </ThemedText>
              <ThemedText
                className="text-sm font-semibold"
                style={{
                  color:
                    selectedOrder.sync_status === "synced"
                      ? "#4CAF50"
                      : undefined,
                }}
              >
                {selectedOrder.sync_status}
              </ThemedText>
            </View>

            <View
              className="flex-row justify-between py-2 border-b"
              style={{ borderBottomColor: theme.colors.outline }}
            >
              <ThemedText className="text-sm font-medium opacity-60">
                {language === "en" ? "Payment Ref" : "付款參考"}:
              </ThemedText>
              <ThemedText className="text-sm font-semibold">
                {selectedOrder.payment_reference || "N/A"}
              </ThemedText>
            </View>

            <View
              className="flex-row justify-between py-2 border-b"
              style={{ borderBottomColor: theme.colors.outline }}
            >
              <ThemedText className="text-sm font-medium opacity-60">
                {language === "en" ? "Payment Method" : "付款方式"}:
              </ThemedText>
              <ThemedText className="text-sm font-semibold">
                {selectedOrder.payment_method === "cash"
                  ? language === "en"
                    ? "Cash"
                    : "現金"
                  : selectedOrder.payment_method === "octopus"
                  ? language === "en"
                    ? "Octopus"
                    : "八達通"
                  : selectedOrder.payment_method === "credit_card"
                  ? language === "en"
                    ? "Credit Card"
                    : "信用卡"
                  : selectedOrder.payment_method || "N/A"}
              </ThemedText>
            </View>
          </View>

          {/* Products */}
          <View className="mb-6">
            <ThemedText className="text-base font-bold mb-3">
              {language === "en" ? "Products" : "產品"} ({products.length})
            </ThemedText>

            {products.map((product: any, index: number) => (
              <View key={index} className="p-3 rounded-lg mb-2">
                <ThemedText className="text-sm font-bold mb-2">
                  {product.productDetail}
                </ThemedText>

                {product.model && (
                  <View
                    className="flex-row justify-between py-2 border-b"
                    style={{ borderBottomColor: theme.colors.outline }}
                  >
                    <ThemedText className="text-sm font-medium opacity-60">
                      {language === "en" ? "Model" : "型號"}:
                    </ThemedText>
                    <ThemedText className="text-sm font-semibold">
                      {product.model}
                    </ThemedText>
                  </View>
                )}

                <View
                  className="flex-row justify-between py-2 border-b"
                  style={{ borderBottomColor: theme.colors.outline }}
                >
                  <ThemedText className="text-sm font-medium opacity-60">
                    {language === "en" ? "Quantity" : "數量"}:
                  </ThemedText>
                  <ThemedText className="text-sm font-semibold">
                    {product.quantity}
                  </ThemedText>
                </View>

                <View
                  className="flex-row justify-between py-2 border-b"
                  style={{ borderBottomColor: theme.colors.outline }}
                >
                  <ThemedText className="text-sm font-medium opacity-60">
                    {language === "en" ? "Unit Price" : "單價"}:
                  </ThemedText>
                  <ThemedText className="text-sm font-semibold">
                    {formatCurrency(product.unitPrice)}
                  </ThemedText>
                </View>

                <View className="flex-row justify-between py-2 px-3 rounded-md mt-1">
                  <ThemedText className="text-sm font-bold">
                    {language === "en" ? "Total" : "總計"}:
                  </ThemedText>
                  <ThemedText className="text-sm font-bold">
                    {formatCurrency(product.quantity * product.unitPrice)}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>

          {/* Financial Summary */}
          <View className="mb-6">
            <ThemedText className="text-base font-bold mb-3">
              {language === "en" ? "Financial Summary" : "財務摘要"}
            </ThemedText>

            <View
              className="flex-row justify-between py-2 border-b"
              style={{ borderBottomColor: theme.colors.outline }}
            >
              <View className="flex-row items-center gap-2">
                <ThemedText className="text-sm font-medium opacity-60">
                  {language === "en" ? "Products Total" : "產品總計"}:
                </ThemedText>
                {selectedOrder.is_override === 1 && (
                  <View
                    style={{
                      backgroundColor: theme.colors.secondaryContainer,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 4,
                    }}
                  >
                    <ThemedText
                      style={{
                        fontSize: 10,
                        color: theme.colors.onSecondaryContainer,
                      }}
                    >
                      {language === "en" ? "Override" : "覆蓋"}
                    </ThemedText>
                  </View>
                )}
              </View>
              <ThemedText className="text-sm font-semibold">
                {formatCurrency(selectedOrder.products_total)}
              </ThemedText>
            </View>

            <View
              className="flex-row justify-between py-2 border-b"
              style={{ borderBottomColor: theme.colors.outline }}
            >
              <ThemedText className="text-sm font-medium opacity-60">
                {language === "en" ? "Misc" : "雜項"}:
              </ThemedText>
              <ThemedText className="text-sm font-semibold">
                {formatCurrency(selectedOrder.misc)}
              </ThemedText>
            </View>

            <View
              className="flex-row justify-between py-2 border-b"
              style={{ borderBottomColor: theme.colors.outline }}
            >
              <ThemedText className="text-sm font-medium opacity-60">
                {language === "en" ? "Total Amount" : "總金額"}:
              </ThemedText>
              <ThemedText className="text-sm font-semibold">
                {formatCurrency(selectedOrder.total_amount)}
              </ThemedText>
            </View>

            <View
              className="flex-row justify-between py-2 border-b"
              style={{ borderBottomColor: theme.colors.outline }}
            >
              <ThemedText className="text-sm font-medium opacity-60">
                {language === "en" ? "Discount" : "折扣"}:
              </ThemedText>
              <ThemedText className="text-sm font-semibold">
                -{formatCurrency(selectedOrder.discount)}
              </ThemedText>
            </View>

            <View
              className="flex-row justify-between py-2 border-b"
              style={{ borderBottomColor: theme.colors.outline }}
            >
              <ThemedText className="text-sm font-medium opacity-60">
                {language === "en" ? "Net Amount" : "淨金額"}:
              </ThemedText>
              <ThemedText className="text-sm font-semibold">
                {formatCurrency(selectedOrder.net_amount)}
              </ThemedText>
            </View>

            <View
              className="flex-row justify-between py-2 border-b"
              style={{ borderBottomColor: theme.colors.outline }}
            >
              <ThemedText className="text-sm font-medium opacity-60">
                {language === "en" ? "Amount Received" : "收款金額"}:
              </ThemedText>
              <ThemedText className="text-sm font-semibold">
                {formatCurrency(selectedOrder.net_received)}
              </ThemedText>
            </View>

            <View
              className="flex-row justify-between py-2 border-b"
              style={{ borderBottomColor: theme.colors.outline }}
            >
              <ThemedText className="text-sm font-medium opacity-60">
                {language === "en" ? "Payment Method" : "付款方式"}:
              </ThemedText>
              <ThemedText className="text-sm font-semibold">
                {selectedOrder.payment_method === "cash"
                  ? language === "en"
                    ? "Cash"
                    : "現金"
                  : selectedOrder.payment_method === "octopus"
                  ? language === "en"
                    ? "Octopus"
                    : "八達通"
                  : selectedOrder.payment_method === "credit_card"
                  ? language === "en"
                    ? "Credit Card"
                    : "信用卡"
                  : selectedOrder.payment_method || "N/A"}
              </ThemedText>
            </View>

            <View className="flex-row justify-between py-2 px-3 rounded-md mt-2">
              <ThemedText className="text-base font-bold">
                {language === "en" ? "Change" : "找零"}:
              </ThemedText>
              <ThemedText className="text-base font-bold">
                {formatCurrency(selectedOrder.change_amount)}
              </ThemedText>
            </View>
          </View>

          {/* Void and Sync Button - Only show if synced and not voided */}
          {isSynced && isNotVoided && (
            <View className="mt-6 mb-4">
              <Button
                mode="contained"
                onPress={handleVoidAndSync}
                disabled={voidAndSyncMutation.isPending || !isOnline || isUploading}
                buttonColor={theme.colors.error}
                textColor={theme.colors.onError}
                loading={voidAndSyncMutation.isPending}
              >
                {language === "en" ? "Void and Sync" : "作廢並同步"}
              </Button>
              
              {/* Print Receipt */}
              <View className="mt-3">
                <PrintReceipt
                  financialSummary={{
                    orderId: selectedOrder.id!,
                    staffId: selectedOrder.staff_id,
                    date: formatDate(selectedOrder.timestamp),
                    status: selectedOrder.status,
                    productsTotal: selectedOrder.products_total,
                    misc: selectedOrder.misc,
                    totalAmount: selectedOrder.total_amount,
                    discount: selectedOrder.discount,
                    netAmount: selectedOrder.net_amount,
                    netReceived: selectedOrder.net_received,
                    changeAmount: selectedOrder.change_amount,
                    paymentReference: selectedOrder.payment_reference,
                    paymentMethod: selectedOrder.payment_method,
                  }}
                  products={products}
                  formatCurrency={formatCurrency}
                  disabled={voidAndSyncMutation.isPending || !isOnline || isUploading}
                />
              </View>
            </View>
          )}

          {/* Void Button - Only show if status is "completed" and not synced */}
          {selectedOrder.status === "completed" && !isSynced && (
            <View className="mt-6 mb-4">
              <Button
                mode="contained"
                onPress={handleVoidOrder}
                disabled={voidOrderMutation.isPending || isUploading}
                buttonColor={theme.colors.error}
                textColor={theme.colors.onError}
                loading={voidOrderMutation.isPending}
              >
                {language === "en" ? "Void Order" : "作廢訂單"}
              </Button>
              
              {/* Print Receipt */}
              <View className="mt-3">
                <PrintReceipt
                  financialSummary={{
                    orderId: selectedOrder.id!,
                    staffId: selectedOrder.staff_id,
                    date: formatDate(selectedOrder.timestamp),
                    status: selectedOrder.status,
                    productsTotal: selectedOrder.products_total,
                    misc: selectedOrder.misc,
                    totalAmount: selectedOrder.total_amount,
                    discount: selectedOrder.discount,
                    netAmount: selectedOrder.net_amount,
                    netReceived: selectedOrder.net_received,
                    changeAmount: selectedOrder.change_amount,
                    paymentReference: selectedOrder.payment_reference,
                    paymentMethod: selectedOrder.payment_method,
                  }}
                  products={products}
                  formatCurrency={formatCurrency}
                  disabled={voidOrderMutation.isPending || isUploading}
                />
              </View>
            </View>
          )}
        </>
      }
    />
  );
}

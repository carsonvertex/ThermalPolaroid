import { SimpleOrderItem } from "@/endpoints/sqlite/repositories/simple-order-repository";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { useLanguageStore } from "@/lib/stores/language-store";
import { formatCurrency, formatDate } from "@/lib/utils/formatter";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { Button, Card, DataTable, Icon, useTheme } from "react-native-paper";
import OrderRecordDetail from "../_orderRecordComponents/orderRecordDetail";
import { ThemedText } from "../ui";

const numberOfItemsPerPageList = [1, 10, 20, 50, 100];

interface UploadOrderListProps {
  orders: SimpleOrderItem[];
  isLoading: boolean;
  handleUploadSingle: (order: SimpleOrderItem) => void;
  isRefreshing: boolean;
  isUploading?: boolean;
  totalCount: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  parseProducts: (products: string) => any;
  syncStatus: "pending" | "synced" | "voided";
}

const UploadOrderList: React.FC<UploadOrderListProps> = ({
  orders,
  isLoading,
  handleUploadSingle,
  isRefreshing,
  isUploading = false,
  totalCount,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
  parseProducts,
  syncStatus,
}) => {
  const theme = useTheme();
  const { language } = useLanguageStore();
  const isOnline = useOnlineStatus();
  const numberOfPages = Math.ceil(totalCount / pageSize);
  const from = (currentPage - 1) * pageSize;
  const to = Math.min(currentPage * pageSize, totalCount);
  const [selectedOrder, setSelectedOrder] = useState<SimpleOrderItem | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Clean staff ID by removing @ and ThermalPolaroid.com
  const cleanStaffId = (staffId: string) => {
    return staffId.replace(/@ThermalPolaroid\.com/gi, "").replace(/@/g, "");
  };

  const handlePageChange = React.useCallback(
    (page: number) => {
      // DataTable.Pagination uses 0-based index, convert to 1-based for server
      setCurrentPage(page + 1);
    },
    [setCurrentPage]
  );

  const handleItemsPerPageChange = React.useCallback(
    (itemsPerPage: number) => {
      setPageSize(itemsPerPage);
      setCurrentPage(1); // Reset to first page when changing page size
    },
    [setPageSize, setCurrentPage]
  );

  const handleOrderPress = (order: SimpleOrderItem) => {
    // Allow clicking for synced and voided orders
    if (syncStatus === "synced" || syncStatus === "voided") {
      setSelectedOrder(order);
      setShowDetails(true);
    }
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedOrder(null);
  };

  // Get icon and text based on sync status
  const getStatusIcon = () => {
    if (syncStatus === "pending") {
      return { name: "schedule" as const, color: "#FF9800" };
    } else if (syncStatus === "voided") {
      return { name: "cancel" as const, color: "#F44336" };
    } else {
      return { name: "check-circle" as const, color: "#4CAF50" };
    }
  };

  const getEmptyStateText = () => {
    if (syncStatus === "pending") {
      return {
        title: language === "en" ? "All Synced!" : "全部已同步！",
        message: language === "en" ? "No pending orders to upload" : "沒有待上傳的訂單",
      };
    } else if (syncStatus === "voided") {
      return {
        title: language === "en" ? "No Voided Orders" : "沒有作廢訂單",
        message: language === "en" ? "Voided orders will appear here" : "作廢訂單將在此處顯示",
      };
    } else {
      return {
        title: language === "en" ? "No Synced Orders" : "沒有已同步訂單",
        message: language === "en" ? "Synced orders will appear here" : "已同步訂單將在此處顯示",
      };
    }
  };

  const statusIcon = getStatusIcon();
  const emptyState = getEmptyStateText();

  return (
    <Card
      style={{
        marginBottom: 16,
        backgroundColor: theme.colors.surface,
      }}
      elevation={2}
    >
      <Card.Content style={{ padding: 16 }}>
        {isLoading ? (
          <View className="items-center py-10">
            <ActivityIndicator size="large" />
            <ThemedText className="mt-4 opacity-60">
              {language === "en" ? "Loading orders..." : "加載訂單..."}
            </ThemedText>
          </View>
        ) : orders.length === 0 ? (
          <View className="items-center py-15">
            <MaterialIcons
              name={statusIcon.name}
              size={48}
              color={statusIcon.color}
              style={{ marginBottom: 12 }}
            />
            <ThemedText className="text-lg font-bold mb-2">
              {emptyState.title}
            </ThemedText>
            <ThemedText className="text-sm opacity-60 text-center">
              {emptyState.message}
            </ThemedText>
          </View>
        ) : (
          <View className="flex-1">
            <DataTable>
              <DataTable.Header>
                <DataTable.Title className="text-xs font-bold">
                  {language === "en" ? "Order #" : "訂單 #"}
                </DataTable.Title>
                <DataTable.Title className="text-xs font-bold">
                  {language === "en" ? "Staff" : "員工"}
                </DataTable.Title>
                <DataTable.Title className="text-xs font-bold">
                  {language === "en" ? "Date" : "日期"}
                </DataTable.Title>
                <DataTable.Title className="text-xs font-bold">
                  {language === "en" ? "Products" : "產品"}
                </DataTable.Title>
                <DataTable.Title className="text-xs font-bold" numeric>
                  {language === "en" ? "Amount" : "金額"}
                </DataTable.Title>
                <DataTable.Title className="text-xs font-bold">
                  {language === "en" ? "Action" : "操作"}
                </DataTable.Title>
              </DataTable.Header>

              {orders.map((order) => {
                const products = parseProducts(order.products);
                const productCount = products.length;
                const isVoided = order.status === "voided";
                return (
                  <TouchableOpacity
                    key={order.id}
                    onPress={() => handleOrderPress(order)}
                    disabled={syncStatus === "pending"}
                  >
                    <View style={{ position: "relative" }}>
                      <DataTable.Row
                        style={{
                          opacity: isVoided ? 0.5 : 1,
                          backgroundColor: syncStatus === "synced" || syncStatus === "voided" ? "transparent" : undefined,
                        }}
                      >
                    <DataTable.Cell className="text-xs py-2">
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <MaterialIcons
                          name={statusIcon.name}
                          size={16}
                          color={statusIcon.color}
                          style={{ marginRight: 4 }}
                        />
                        <ThemedText className="text-xs font-bold">
                          #{order.id}
                        </ThemedText>
                      </View>
                    </DataTable.Cell>
                    <DataTable.Cell className="text-xs py-2">
                      <ThemedText className="text-xs">
                        {cleanStaffId(order.staff_id)}
                      </ThemedText>
                    </DataTable.Cell>
                    <DataTable.Cell className="text-xs py-2">
                      <ThemedText className="text-xs">
                        {formatDate(order.timestamp)}
                      </ThemedText>
                    </DataTable.Cell>
                    <DataTable.Cell className="text-xs py-2">
                      <ThemedText className="text-xs font-semibold">
                        {productCount} {language === "en" ? "item" : "項目"}
                        {productCount !== 1 ? (language === "en" ? "s" : "") : ""}
                      </ThemedText>
                    </DataTable.Cell>
                    <DataTable.Cell className="text-xs py-2" numeric>
                      <ThemedText className="text-xs font-bold">
                        {formatCurrency(order.net_amount)}
                      </ThemedText>
                    </DataTable.Cell>
                    <DataTable.Cell className="text-xs py-2" style={{ justifyContent: "center" }}>
                      {syncStatus === "pending" ? (
                        <Button
                          compact
                          onPress={() => handleUploadSingle(order)}
                          disabled={isRefreshing || isUploading || !isOnline}
                          contentStyle={{ height: 32, minWidth: 40 }}
                          labelStyle={{ fontSize: 11 }}
                          style={{ margin: 0 }}
                        >
                          <Icon
                            source="upload"
                            size={16}
                            color={
                              isRefreshing || isUploading || !isOnline
                                ? theme.colors.outline
                                : theme.colors.primary
                            }
                          />
                        </Button>
                      ) : syncStatus === "voided" ? (
                        <ThemedText
                          style={{
                            fontSize: 11,
                            opacity: 0.7,
                            color: theme.colors.error,
                          }}
                        >
                          {language === "en" ? "Voided" : "已作廢"}
                        </ThemedText>
                      ) : (
                        <ThemedText
                          style={{
                            fontSize: 11,
                            opacity: 0.7,
                            color: theme.colors.primary,
                          }}
                        >
                          {language === "en" ? "Synced" : "已同步"}
                        </ThemedText>
                      )}
                    </DataTable.Cell>
                      </DataTable.Row>
                      {isVoided && (
                        <View
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(128, 128, 128, 0.3)",
                            justifyContent: "center",
                            alignItems: "center",
                            zIndex: 1,
                          }}
                          pointerEvents="none"
                        >
                          <ThemedText
                            style={{
                              fontSize: 24,
                              fontWeight: "bold",
                              color: theme.colors.error,
                              textTransform: "uppercase",
                              letterSpacing: 2,
                            }}
                          >
                            VOID
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Footer */}
              <DataTable.Row>
                <DataTable.Cell className="text-xs font-semibold">
                  {orders.length} {language === "en" ? "items" : "項目"}
                </DataTable.Cell>
                <DataTable.Cell className="text-xs font-semibold" numeric>
                  {formatCurrency(
                    orders.reduce((sum, order) => sum + order.net_amount, 0)
                  )}
                </DataTable.Cell>
              </DataTable.Row>
              <DataTable.Pagination
                page={currentPage - 1}
                numberOfPages={numberOfPages}
                onPageChange={handlePageChange}
                label={`${from + 1}-${to} ${
                  language === "en" ? "of" : "/"
                } ${totalCount}`}
                showFastPaginationControls
                numberOfItemsPerPageList={numberOfItemsPerPageList}
                numberOfItemsPerPage={pageSize}
                onItemsPerPageChange={handleItemsPerPageChange}
                selectPageDropdownLabel={
                  language === "en" ? "Rows per page" : "每頁行數"
                }
              />
            </DataTable>
          </View>
        )}
      </Card.Content>

      {/* Order Detail Drawer - For synced and voided orders */}
      {selectedOrder && (syncStatus === "synced" || syncStatus === "voided") && (
        <OrderRecordDetail
          selectedOrder={selectedOrder}
          parseProducts={parseProducts}
          showDetails={showDetails}
          handleCloseDetails={handleCloseDetails}
          formatDate={formatDate}
          formatCurrency={formatCurrency}
        />
      )}
    </Card>
  );
};

export default UploadOrderList;


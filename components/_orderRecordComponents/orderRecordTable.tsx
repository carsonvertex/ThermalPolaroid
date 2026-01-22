import { SimpleOrderItem } from "@/endpoints/sqlite/repositories/simple-order-repository";
import { useLanguageStore } from "@/lib/stores/language-store";
import { formatCurrency } from "@/lib/utils/formatter";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { Card, DataTable, useTheme } from "react-native-paper";
import { ThemedText } from "../ui";
import OrderRecordTableRow from "./orderRecordTableRow";

const numberOfItemsPerPageList = [1, 10, 20, 50, 100];

interface OrderRecordTableProps {
  orders: SimpleOrderItem[];
  loading: boolean;
  totalCount: number;
  parseProducts: (products: string) => any;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
}

const OrderRecordTable: React.FC<OrderRecordTableProps> = ({
  orders,
  loading,
  totalCount,
  parseProducts,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
}) => {
  const { language } = useLanguageStore();
  const theme = useTheme();
  const numberOfPages = Math.ceil(totalCount / pageSize);
  const from = (currentPage - 1) * pageSize;
  const to = Math.min(currentPage * pageSize, totalCount);

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

  return (
    <Card
      style={{
        marginBottom: 16,
        backgroundColor: theme.colors.surface,
      }}
      elevation={2}
    >
      <Card.Content style={{ padding: 16 }}>
        {loading ? (
          <View className="items-center py-10">
            <ActivityIndicator size="large" />
            <ThemedText className="mt-4 opacity-60">
              {language === "en" ? "Loading orders..." : "加載訂單..."}
            </ThemedText>
          </View>
        ) : orders.length === 0 ? (
          <View className="items-center py-15">
            <ThemedText className="text-5xl mb-4">📋</ThemedText>
            <ThemedText className="text-lg font-bold mb-2">
              {language === "en" ? "No orders yet" : "尚無訂單"}
            </ThemedText>
            <ThemedText className="text-sm opacity-60 text-center">
              {language === "en"
                ? "Orders will appear here once created"
                : "訂單將在此處顯示一旦創建"}
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
              </DataTable.Header>

              {/* Order Record Table Rows */}
              {orders.map((order, index) => (
                <OrderRecordTableRow
                  key={order.id}
                  item={order}
                  index={index}
                  parseProducts={parseProducts}
                />
              ))}

              {/* Footer */}
              <DataTable.Row>
                <DataTable.Cell className="text-xs font-semibold">
                  {orders.filter((order) => order.status !== "voided").length}{" "}
                  {language === "en" ? "orders" : "訂單"}
                </DataTable.Cell>
                <DataTable.Cell className="text-xs font-semibold" numeric>
                  {formatCurrency(
                    orders
                      .filter((order) => order.status !== "voided")
                      .reduce((sum, order) => sum + order.net_amount, 0)
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
    </Card>
  );
};

export default OrderRecordTable;

import { SimpleOrderItem } from "@/endpoints/sqlite/repositories/simple-order-repository";
import { formatCurrency, formatDate } from "@/lib/utils/formatter";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { DataTable, useTheme } from "react-native-paper";
import { ThemedText } from "../ui";
import OrderRecordDetail from "./orderRecordDetail";

export default function OrderRecordTableRow({
  item,
  index,
  //   handleOrderPress,
  parseProducts,
}: {
  item: SimpleOrderItem;
  index: number;
  //   handleOrderPress: (item: SimpleOrderItem) => void;
  parseProducts: (products: string) => any;
}) {
  const [selectedOrder, setSelectedOrder] = useState<SimpleOrderItem | null>(
    null
  );
  const [showDetails, setShowDetails] = useState(false);
  const products = parseProducts(item.products);
  const productCount = products.length;
  const theme = useTheme();
  const isVoided = item.status === "voided";
  const isSynced = item.sync_status === "synced";
  const isPending = item.sync_status === "pending";
  const isFailed = item.sync_status === "failed";

  const handleOrderPress = (order: SimpleOrderItem) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };
  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedOrder(null);
  };

  // Clean staff ID by removing @ and ThermalPolaroid.com
  const cleanStaffId = (staffId: string) => {
    return staffId.replace(/@ThermalPolaroid\.com/gi, "").replace(/@/g, "");
  };

  return (
    <>
      <TouchableOpacity key={item.id} onPress={() => handleOrderPress(item)}>
        <View style={{ position: "relative" }}>
          <DataTable.Row
            style={{
              opacity: isVoided ? 0.5 : 1,
            }}
          >
            <DataTable.Cell className="text-xs py-2">
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {isSynced && (
                  <MaterialIcons
                    name="check-circle"
                    size={16}
                    color="#4CAF50"
                    style={{ marginLeft: 6 }}
                  />
                )}
                {isPending && (
                  <MaterialIcons
                    name="schedule"
                    size={16}
                    color="#FF9800"
                    style={{ marginLeft: 6 }}
                  />
                )}
                {isFailed && (
                  <MaterialIcons
                    name="error"
                    size={16}
                    color={theme.colors.error}
                    style={{ marginLeft: 6 }}
                  />
                )}
                <ThemedText className="text-xs font-bold  ">#{item.id}</ThemedText>
              </View>
            </DataTable.Cell>
            <DataTable.Cell className="text-xs py-2">
              <ThemedText className="text-xs  ">{cleanStaffId(item.staff_id)}</ThemedText>
            </DataTable.Cell>
            <DataTable.Cell className="text-xs py-2">
              <ThemedText className="text-xs  ">
                {formatDate(item.timestamp)}
              </ThemedText>
            </DataTable.Cell>
            <DataTable.Cell className="text-xs py-2">
              <ThemedText className="text-xs font-semibold  ">
                {productCount} item{productCount !== 1 ? "s" : ""}
              </ThemedText>
            </DataTable.Cell>
            <DataTable.Cell className="text-xs py-2" numeric>
              <ThemedText className="text-xs font-bold  ">
                {formatCurrency(item.net_amount)}
              </ThemedText>
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

      <OrderRecordDetail
        selectedOrder={item}
        parseProducts={parseProducts}
        showDetails={showDetails}
        handleCloseDetails={handleCloseDetails}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
      />
    </>
  );
}

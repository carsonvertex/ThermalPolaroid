import { useLanguageStore } from "@/lib/stores/language-store";
import { View } from "react-native";
import { Button, Modal, Portal, Text, useTheme } from "react-native-paper";
import { PrintReceipt } from "../shared";

export default function CheckoutSuccess({
  showSuccessModal,
  setShowSuccessModal,
  completedOrder,
  setCompletedOrder,
  setFieldValueRef,
}: {
  showSuccessModal: boolean;
  setShowSuccessModal: (show: boolean) => void;
  completedOrder: any;
  setCompletedOrder: (order: any) => void;
  setFieldValueRef: any;
}) {
  const theme = useTheme();
  const { language } = useLanguageStore();

  const handleClose = () => {
    setShowSuccessModal(false);
    // Reset form - clear products and reset other fields
    if (setFieldValueRef) {
      setFieldValueRef("products", []);
      setFieldValueRef("misc", 0);
      setFieldValueRef("discount", 0);
      setFieldValueRef("netReceived", 0);
      setFieldValueRef("paymentReference", "");
    }
    setCompletedOrder(null);
  };

  return (
    <Portal>
      <Modal
        visible={showSuccessModal}
        onDismiss={() => {
          handleClose();
        }}
        contentContainerStyle={{
          backgroundColor: theme.colors.surface,
          padding: 24,
          margin: 20,
          borderRadius: 8,
        }}
      >
        {completedOrder && (
          <View>
            <Text
              variant="headlineSmall"
              style={{
                marginBottom: 16,
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              {language === "en" ? "Success" : "成功"}
            </Text>

            <Text
              variant="bodyLarge"
              style={{ marginBottom: 8, textAlign: "center" }}
            >
              {language === "en"
                ? `Order #${completedOrder.orderId} has been saved successfully!`
                : `訂單 #${completedOrder.orderId} 已成功保存！`}
            </Text>

            <View
              style={{
                marginVertical: 16,
                padding: 16,
                backgroundColor: theme.colors.surfaceVariant,
                borderRadius: 8,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text variant="bodyMedium">
                  {language === "en" ? "Total:" : "總額:"}
                </Text>
                <Text variant="bodyMedium" style={{ fontWeight: "bold" }}>
                  ${completedOrder.values.netAmount.toFixed(2)}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text variant="bodyMedium">
                  {language === "en" ? "Received:" : "收款:"}
                </Text>
                <Text variant="bodyMedium" style={{ fontWeight: "bold" }}>
                  ${completedOrder.values.netReceived.toFixed(2)}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text variant="bodyMedium">
                  {language === "en" ? "Change:" : "找零:"}
                </Text>
                <Text variant="bodyMedium" style={{ fontWeight: "bold" }}>
                  ${completedOrder.values.change.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Print Receipt */}
            <View style={{ marginBottom: 16 }}>
              <PrintReceipt
                financialSummary={{
                  orderId: completedOrder.orderId,
                  staffId: completedOrder.values.staffId,
                  date: new Date(
                    completedOrder.values.timeStamp
                  ).toLocaleString(),
                  status: "completed",
                  productsTotal: completedOrder.values.productsTotal,
                  misc: completedOrder.values.misc,
                  totalAmount: completedOrder.values.totalAmount,
                  discount: completedOrder.values.discount,
                  netAmount: completedOrder.values.netAmount,
                  netReceived: completedOrder.values.netReceived,
                  changeAmount: completedOrder.values.change,
                  paymentReference: completedOrder.values.paymentReference,
                  paymentMethod: completedOrder.values.paymentMethod,
                }}
                products={completedOrder.values.products || []}
                formatCurrency={(amount) => `$${amount.toFixed(2)}`}
              />
            </View>

            <Button
              mode="contained"
              onPress={handleClose}
            >
              {language === "en" ? "OK" : "確定"}
            </Button>
          </View>
        )}
      </Modal>
    </Portal>
  );
}

import SimpleOrderCheckout from "@/components/_simpleOrderCheckoutComponents/simpleOrderCheckout";
import CheckoutSuccess from "@/components/_simpleOrderComponents/checkout-success";
import ScanProduct from "@/components/_simpleOrderComponents/scan-product";
import { ThemedText, ThemedView } from "@/components/ui";
import { simpleOrderRepository } from "@/endpoints/sqlite/repositories";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useLanguageStore } from "@/lib/stores/language-store";
import { useQueryClient } from "@tanstack/react-query";
import { Formik } from "formik";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { Button, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SimpleOrderTable from "../../components/_simpleOrderComponents/simpleOrderTable";

interface SimpleOrder {
  staffId: string;
  timeStamp: number;
  products: {
    sku: string;
    productDetail: string;
    quantity: number;
    unitPrice: number;
  }[];
  productsTotal: number;
  misc: number;
  totalAmount: number;
  discount: number;
  netAmount: number;
  netReceived: number;
  change: number;
  paymentReference: string;
  overrideTotalPrice?: boolean;
  paymentMethod?: string; // 'cash', 'octopus', 'credit_card'
}

export default function SimpleOrderScreen() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [manualInput, setManualInputState] = useState(false);

  // Calculate tab bar height: paddingTop(8) + icon(28) + text margin(4) + text(~14) + padding(8) + safe area
  const TAB_BAR_HEIGHT = 8 + 28 + 4 + 14 + 8 + insets.bottom;
  // Fixed action buttons height (approximate)
  const ACTION_BUTTONS_HEIGHT = 72;
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{
    orderId: number;
    values: SimpleOrder;
  } | null>(null);
  const setFieldValueRef = useRef<((field: string, value: any) => void) | null>(
    null
  );

  // Memoize setManualInput to prevent unnecessary re-renders
  const setManualInput = useCallback((value: boolean) => {
    setManualInputState(value);
  }, []);

  // Memoize initialValues to prevent Formik from resetting when manualInput changes
  const initialValues: SimpleOrder = useMemo(
    () => ({
      staffId: user?.email || "",
      timeStamp: Date.now(),
      products: [],
      productsTotal: 0,
      misc: 0,
      totalAmount: 0,
      discount: 0,
      netAmount: 0,
      netReceived: 0,
      change: 0,
      paymentReference: "",
      overrideTotalPrice: false,
      paymentMethod: "cash",
    }),
    [user?.email]
  );

  const handleSubmit = async (values: SimpleOrder, { setSubmitting }: any) => {
    if (!values.staffId.trim()) {
      Alert.alert(
        "Error",
        language === "en" ? "Please enter a Staff ID" : "請輸入員工ID"
      );
      setSubmitting(false);
      return;
    }

    if (values.products.length === 0) {
      Alert.alert(
        "Error",
        language === "en"
          ? "Please add at least one product to the order"
          : "請至少添加一個產品到訂單"
      );
      setSubmitting(false);
      return;
    }

    if (values.netReceived < values.netAmount) {
      Alert.alert(
        "Error",
        language === "en"
          ? "Amount received cannot be less than the net amount"
          : "收款金額不能小於淨額"
      );
      setSubmitting(false);
      return;
    }

    try {
      setLoading(true);
      console.log(
        language === "en" ? "🔄 Saving simple order..." : "🔄 保存簡易訂單...",
        values
      );
      // Convert products array to JSON string
      const productsJson = JSON.stringify(values.products);
      // Create order data for database
      const orderData = {
        staff_id: values.staffId.trim(),
        timestamp: Number(values.timeStamp), // Ensure it's a number
        products: productsJson,
        products_total: Number(values.productsTotal),
        misc: Number(values.misc),
        total_amount: Number(values.totalAmount),
        discount: Number(values.discount),
        net_amount: Number(values.netAmount),
        net_received: Number(values.netReceived),
        change_amount: Number(values.change),
        payment_reference: values.paymentReference?.trim() || "",
        status: "completed",
        sync_status: "pending",
        is_override: values.overrideTotalPrice ? 1 : 0, // Convert boolean to integer (0 or 1)
        payment_method: values.paymentMethod || "cash", // Default to 'cash' if not provided
      };

      // Save to database
      const orderId = await simpleOrderRepository.create(orderData);

      // Invalidate queries to refresh dashboard, order records, and upload screen
      queryClient.invalidateQueries({ queryKey: ["dashboard-orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-records"] });
      queryClient.invalidateQueries({ queryKey: ["pending-upload-orders"] });

      // Show success modal with print button
      setCompletedOrder({ orderId, values });
      setShowSuccessModal(true);
      setSubmitting(false);
      setLoading(false);
    } catch (error) {
      console.error(
        language === "en"
          ? "❌ Error saving simple order:"
          : "❌ 保存簡易訂單時發生錯誤:",
        error
      );
      Alert.alert(
        "Error",
        `${
          language === "en" ? "Failed to save order:" : "保存訂單時發生錯誤:"
        } ${error instanceof Error ? error.message : "Unknown error"}`
      );
      setSubmitting(false);
      setLoading(false);
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
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + ACTION_BUTTONS_HEIGHT + 16 }}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => {}} />
        }
      >
        <ThemedView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <Formik
            initialValues={initialValues}
            onSubmit={handleSubmit}
            enableReinitialize={true}
          >
            {({ values, setFieldValue, handleSubmit }) => {
              // Store setFieldValue in ref so handleSubmit can access it
              setFieldValueRef.current = setFieldValue;

              const hasProducts = values.products.length > 0;
              const scrollViewRef = useRef<ScrollView>(null);
              const tableRef = useRef<View>(null);
              const previousProductsLengthRef = useRef(values.products.length);

              // Auto-scroll to table when a new item is added
              useEffect(() => {
                const currentLength = values.products.length;
                const previousLength = previousProductsLengthRef.current;

                // Only scroll if a new item was added (length increased)
                if (currentLength > previousLength && currentLength > 0) {
                  // Small delay to ensure the table has rendered with the new item
                  setTimeout(() => {
                    // Scroll to show the table - using scrollToEnd to show the newly added item
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 200);
                }
                // Update the ref for next comparison
                previousProductsLengthRef.current = currentLength;
              }, [values.products.length]);

              return (
                <View style={{ flex: 1  }}>
                  <ThemedView showsVerticalScrollIndicator={false}>
                    <View style={{ padding: 16 }}>
                      {/* Header */}
                      <ThemedText style={{ fontSize: 28, fontWeight: "bold" }}>
                        {language === "en" ? "Simple Order" : "簡易訂單"}
                      </ThemedText>

                      {/* Add Product Card */}
                      <ScanProduct
                        manualInput={manualInput}
                        setManualInput={setManualInput}
                        values={values}
                        setFieldValue={setFieldValue}
                        onScanActive={(isActive) => {
                          // Store scan active state to prevent drawer from opening
                          // This will be used by MainDrawer if needed
                        }}
                      />

                      {/* Products Table Card */}
                      <View ref={tableRef}>
                        <SimpleOrderTable
                          manualInput={manualInput}
                          setManualInput={setManualInput}
                          values={values}
                          setFieldValue={setFieldValue}
                        />
                      </View>
                    </View>
                  </ThemedView>

                  {/* Fixed Action Buttons - Only show when there are products */}
                  {hasProducts && (
                    <View
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: theme.colors.surface,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        flexDirection: "row",
                        gap: 8,
                        borderTopWidth: 1,
                        borderTopColor: theme.colors.outline,
                        shadowColor: "#000",
                        shadowOffset: {
                          width: 0,
                          height: -2,
                        },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 5,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Button
                          mode="outlined"
                          disabled={loading}
                          onPress={() => setFieldValue("products", [])}
                        >
                          {language === "en" ? "Clear" : "清空"}
                        </Button>
                      </View>
                      <View style={{ flex: 1 }}>
                        <SimpleOrderCheckout
                          manualInput={manualInput}
                          setManualInput={setManualInput}
                          values={values}
                          setFieldValue={setFieldValue}
                          handleSubmit={handleSubmit}
                          loading={loading}
                        />
                      </View>
                    </View>
                  )}
                </View>
              );
            }}
          </Formik>
        </ThemedView>
      </ScrollView>
      {/* Success Modal with Print Button */}
      <CheckoutSuccess
        showSuccessModal={showSuccessModal}
        setShowSuccessModal={setShowSuccessModal}
        setFieldValueRef={setFieldValueRef.current}
        completedOrder={completedOrder}
          setCompletedOrder={setCompletedOrder}
        />
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

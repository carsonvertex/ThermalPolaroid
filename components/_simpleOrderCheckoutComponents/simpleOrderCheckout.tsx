import {
  InputFocusProvider
} from "@/hooks/use-input-focus-group";
import { useNumberPad } from "@/hooks/use-number-pad";
import { useLanguageStore } from "@/lib/stores/language-store";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  View,
} from "react-native";
import {
  Button,
  Card,
  IconButton,
  Modal,
  Portal,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import StaffSelector from "../_simpleOrderComponents/staff-selector";
import { DiscountSection } from "./discount-section";
import { MiscInputSection } from "./misc-input-section";
import { NetReceivedSection, PaymentMethod } from "./net-received-section";
import { ProductsTotalSection } from "./products-total-section";

interface CheckoutProps {
  values: any;
  setFieldValue: (field: string, value: any) => void;
  handleSubmit: () => void;
  loading?: boolean;
  manualInput?: boolean;
  setManualInput: (value: boolean) => void;
}

// Custom hook to manage checkout state
function useCheckoutState(
  values: any,
  productsTotal: number,
  showModal: boolean
) {
  // Override state
  const [overrideTotalPrice, setOverrideTotalPrice] = useState(false);
  const [overriddenProductsTotal, setOverriddenProductsTotal] = useState(
    productsTotal.toFixed(2)
  );

  // Input states
  const [miscInput, setMiscInput] = useState((values.misc || 0).toFixed(2));
  const [discountInput, setDiscountInput] = useState(
    (values.discount || 0).toFixed(2)
  );
  const [netReceivedInput, setNetReceivedInput] = useState(
    (values.netReceived || 0).toFixed(2)
  );
  const [paymentReferenceInput, setPaymentReferenceInput] = useState(
    values.paymentReference || ""
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    (values.paymentMethod as PaymentMethod) || "cash"
  );

  // Wrapped setters with logging
  const setMiscInputWithLog = (value: string) => {
    console.log("📝 setMiscInput called", value);
    setMiscInput(value);
  };
  const setDiscountInputWithLog = (value: string) => {
    console.log("📝 setDiscountInput called", value);
    setDiscountInput(value);
  };
  const setNetReceivedInputWithLog = (value: string) => {
    console.log("📝 setNetReceivedInput called", value);
    setNetReceivedInput(value);
  };
  const setPaymentReferenceInputWithLog = (value: string) => {
    console.log("📝 setPaymentReferenceInput called", value);
    setPaymentReferenceInput(value);
  };
  const setOverriddenProductsTotalWithLog = (value: string) => {
    console.log("📝 setOverriddenProductsTotal called", value);
    setOverriddenProductsTotal(value);
  };
  const setOverrideTotalPriceWithLog = (value: boolean) => {
    console.log("📝 setOverrideTotalPrice called", value);
    setOverrideTotalPrice(value);
  };

  // Track modal state to reset only on initial open
  const [prevShowModal, setPrevShowModal] = useState(false);
  const [prevProductsTotal, setPrevProductsTotal] = useState(productsTotal);

  // Reset state when modal first opens (only when modal transitions from closed to open)
  useEffect(() => {
    // Only reset when modal transitions from closed to open
    if (showModal && !prevShowModal) {
      console.log("⚡ Resetting checkout state on modal open");
      setMiscInput((values.misc || 0).toFixed(2));
      setDiscountInput((values.discount || 0).toFixed(2));
      setNetReceivedInput((values.netReceived || 0).toFixed(2));
      setPaymentReferenceInput(values.paymentReference || "");
      setOverriddenProductsTotal(productsTotal.toFixed(2));
      setOverrideTotalPrice(false);
      setPaymentMethod((values.paymentMethod as PaymentMethod) || "cash");
      setPrevProductsTotal(productsTotal);
    }
    setPrevShowModal(showModal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]); // Only depend on showModal - read values and productsTotal when needed

  // Update overriddenProductsTotal when productsTotal changes (only if override not active)
  useEffect(() => {
    console.log("⚡ useCheckoutState useEffect [productsTotal] triggered", { 
      productsTotal, 
      prevProductsTotal, 
      overrideTotalPrice 
    });
    if (!overrideTotalPrice && prevProductsTotal !== productsTotal) {
      setOverriddenProductsTotal(productsTotal.toFixed(2));
      setPrevProductsTotal(productsTotal);
    }
  }, [productsTotal, overrideTotalPrice, prevProductsTotal]);

  // Calculate products total (with override support)
  const localProductsTotal = useMemo(() => {
    if (overrideTotalPrice) {
      return parseFloat(overriddenProductsTotal) || 0;
    }
    return productsTotal;
  }, [overrideTotalPrice, overriddenProductsTotal, productsTotal]);

  // Calculate derived values
  const localMisc = useMemo(() => parseFloat(miscInput) || 0, [miscInput]);
  const localDiscount = useMemo(
    () => parseFloat(discountInput) || 0,
    [discountInput]
  );
  const localNetReceived = useMemo(
    () => parseFloat(netReceivedInput) || 0,
    [netReceivedInput]
  );
  const localTotalAmount = useMemo(
    () => localProductsTotal + localMisc,
    [localProductsTotal, localMisc]
  );
  const localNetAmount = useMemo(
    () => localTotalAmount - localDiscount,
    [localTotalAmount, localDiscount]
  );
  const localChange = useMemo(
    () => localNetReceived - localNetAmount,
    [localNetReceived, localNetAmount]
  );

  // Toggle override
  const toggleOverride = () => {
    setOverrideTotalPrice(!overrideTotalPrice);
  };

  // Apply discount amount
  const applyDiscountAmount = (amount: number) => {
    const currentDiscount = parseFloat(discountInput) || 0;
    const newDiscount = currentDiscount + amount;
    const currentMisc = parseFloat(miscInput) || 0;
    const currentProductsTotal = localProductsTotal;
    const localTotalAmount = currentProductsTotal + currentMisc;
    const maxDiscount = Math.min(10000, localTotalAmount);
    const discountToApply = Math.min(newDiscount, maxDiscount);
    setDiscountInput(discountToApply.toFixed(2));
  };

  return {
    // State
    overrideTotalPrice,
    overriddenProductsTotal,
    miscInput,
    discountInput,
    netReceivedInput,
    paymentReferenceInput,
    paymentMethod,
    // Setters (with logging)
    setOverrideTotalPrice: setOverrideTotalPriceWithLog,
    setOverriddenProductsTotal: setOverriddenProductsTotalWithLog,
    setMiscInput: setMiscInputWithLog,
    setDiscountInput: setDiscountInputWithLog,
    setNetReceivedInput: setNetReceivedInputWithLog,
    setPaymentReferenceInput: setPaymentReferenceInputWithLog,
    setPaymentMethod,
    // Calculated values
    localProductsTotal,
    localMisc,
    localDiscount,
    localNetReceived,
    localTotalAmount,
    localNetAmount,
    localChange,
    // Functions
    toggleOverride,
    applyDiscountAmount,
  };
}

// Checkout Summary Card (for Page 2)
function CheckoutSummary({
  overrideTotalPrice,
  localProductsTotal,
  localMisc,
  localTotalAmount,
  localDiscount,
}: {
  overrideTotalPrice: boolean;
  localProductsTotal: number;
  localMisc: number;
  localTotalAmount: number;
  localDiscount: number;
}) {
  const { language } = useLanguageStore();
  const theme = useTheme();

  return (
    <Card
      style={{
        marginBottom: 16,
        backgroundColor: theme.colors.surface,
      }}
      elevation={2}
    >
      <Card.Content style={{ padding: 16 }}>
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-row items-center gap-2">
            <Text variant="bodyMedium">
              {language === "en" ? "Products" : "產品"}
            </Text>
            {overrideTotalPrice && (
              <View
                style={{
                  backgroundColor: theme.colors.secondaryContainer,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    color: theme.colors.onSecondaryContainer,
                  }}
                >
                  {language === "en" ? "Override" : "覆蓋"}
                </Text>
              </View>
            )}
          </View>
          <Text variant="bodyMedium" className="font-semibold">
            {localProductsTotal.toFixed(2)}
          </Text>
        </View>

        <View className="flex-row justify-between items-center mb-2">
          <Text variant="bodyMedium">
            {language === "en" ? "Misc" : "雜項"}
          </Text>
          <Text variant="bodyMedium" className="font-semibold">
            {localMisc.toFixed(2)}
          </Text>
        </View>

        <View
          className="flex-row justify-between items-center mb-2 pb-2"
          style={{
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.outline,
          }}
        >
          <Text variant="bodyLarge" className="font-bold">
            {language === "en" ? "Total Amount" : "總額"}
          </Text>
          <Text variant="bodyLarge" className="font-bold">
            {localTotalAmount.toFixed(2)}
          </Text>
        </View>

        <View className="flex-row justify-between items-center mb-2">
          <Text variant="bodyMedium">
            {language === "en" ? "Discount" : "折扣"}
          </Text>
          <Text variant="bodyMedium" className="font-semibold">
            -{localDiscount.toFixed(2)}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

// Page 1 Component
function CheckoutPage1({
  checkoutState,
  productsTotal,
  theme,
  onNext,
  onCancel,
  totalPriceNumberPad,
  miscNumberPad,
  discountNumberPad,
  discountButtons,
}: {
  checkoutState: ReturnType<typeof useCheckoutState>;
  productsTotal: number;
  theme: any;
  onNext: () => void;
  onCancel: () => void;
  totalPriceNumberPad: ReturnType<typeof useNumberPad>;
  miscNumberPad: ReturnType<typeof useNumberPad>;
  discountNumberPad: ReturnType<typeof useNumberPad>;
  discountButtons: Array<{ label: string; value: number }>;
}) {
  const { language } = useLanguageStore();
  const paperTheme = useTheme();

  return (
    <>
      <Card
        style={{
          marginBottom: 16,
          backgroundColor: paperTheme.colors.surface,
        }}
        elevation={2}
      >
        <Card.Content style={{ padding: 16 }}>
          <ProductsTotalSection
            overrideTotalPrice={checkoutState.overrideTotalPrice}
            overriddenProductsTotal={checkoutState.overriddenProductsTotal}
            localProductsTotal={checkoutState.localProductsTotal}
            productsTotal={productsTotal}
            onToggleOverride={checkoutState.toggleOverride}
            onOverrideValueChange={checkoutState.setOverriddenProductsTotal}
            totalPriceNumberPad={totalPriceNumberPad}
          />

          <MiscInputSection
            miscInput={checkoutState.miscInput}
            onMiscChange={checkoutState.setMiscInput}
            miscNumberPad={miscNumberPad}
          />
        </Card.Content>
      </Card>

      <View
        className="flex-row justify-between items-center mb-4 pb-3 border-b"
        style={{ borderBottomColor: theme.colors.outline }}
      >
        <Text variant="bodyLarge" className="font-bold">
          {language === "en" ? "Total Amount" : "總額"}
        </Text>
        <Text variant="bodyLarge" className="text-lg font-bold">
          {checkoutState.localTotalAmount.toFixed(2)}
        </Text>
      </View>

      <DiscountSection
        discountInput={checkoutState.discountInput}
        localProductsTotal={checkoutState.localProductsTotal}
        localMisc={checkoutState.localMisc}
        onDiscountChange={checkoutState.setDiscountInput}
        onApplyDiscountAmount={checkoutState.applyDiscountAmount}
        discountNumberPad={discountNumberPad}
        discountButtons={discountButtons}
      />

      <View className="p-3 rounded-lg mb-4 flex-row justify-between items-center border-b">
        <Text variant="bodyLarge" className="font-bold">
          {language === "en" ? "Net Amount" : "淨額"}
        </Text>
        <Text variant="bodyLarge" className="text-right font-bold">
          {checkoutState.localNetAmount.toFixed(2)}
        </Text>
      </View>

      {checkoutState.localNetAmount <= 0 && (
        <View
          className="p-3 rounded-lg mb-4"
          style={{
            backgroundColor: theme.colors.errorContainer,
            borderWidth: 1,
            borderColor: theme.colors.error,
          }}
        >
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onErrorContainer }}
          >
            {language === "en"
              ? "Net amount must be greater than 0 to proceed"
              : "淨額必須大於 0 才能繼續"}
          </Text>
        </View>
      )}

      <View
        style={{
          flexDirection: "row",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <View style={{ flex: 1 }}>
          <Button mode="outlined" onPress={onCancel}>
            {language === "en" ? "Cancel" : "取消"}
          </Button>
        </View>
        <View style={{ flex: 1 }}>
          <Button
            mode="contained"
            onPress={onNext}
            disabled={checkoutState.localNetAmount <= 0}
          >
            {language === "en" ? "Next" : "下一頁"}
          </Button>
        </View>
      </View>
    </>
  );
}

// Page 2 Component
function CheckoutPage2({
  checkoutState,
  values,
  setFieldValue,
  theme,
  onBack,
  onSubmit,
  loading,
  netReceivedNumberPad,
  cashButtons,
  onPaymentReferenceFocusChange,
}: {
  checkoutState: ReturnType<typeof useCheckoutState>;
  values: any;
  setFieldValue: (field: string, value: any) => void;
  theme: any;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
  netReceivedNumberPad: ReturnType<typeof useNumberPad>;
  cashButtons: Array<{ label: string; value: number }>;
  onPaymentReferenceFocusChange?: (focused: boolean) => void;
}) {
  const { language } = useLanguageStore();
  const paperTheme = useTheme();

  // Extract setters - useState setters are stable and don't cause re-renders
  const { setPaymentReferenceInput, paymentReferenceInput } = checkoutState;
  const paymentReferenceInputRef = useRef<any>(null);

  // Use setters directly - they're stable from useState
  const handlePaymentReferenceChange = (text: string) => {
    setPaymentReferenceInput(text);
  };

  const handlePaymentReferenceFocus = () => {
    onPaymentReferenceFocusChange?.(true);
  };

  const handlePaymentReferenceBlur = () => {
    setPaymentReferenceInput(paymentReferenceInput.trim());
    onPaymentReferenceFocusChange?.(false);
  };

  const handlePaymentReferenceSubmit = () => {
    // Blur the input to close the keyboard when "Done" is pressed
    paymentReferenceInputRef.current?.blur();
  };

  const handleCompleteCheckout = () => {
    const miscValue = parseFloat(checkoutState.miscInput) || 0;
    const discountValue = parseFloat(checkoutState.discountInput) || 0;
    const netReceivedValue = parseFloat(checkoutState.netReceivedInput) || 0;

    const finalProductsTotal = checkoutState.localProductsTotal;
    const localTotalAmount = finalProductsTotal + miscValue;
    const localNetAmount = localTotalAmount - discountValue;
    const localChange = netReceivedValue - localNetAmount;

    setFieldValue("misc", miscValue);
    setFieldValue("discount", discountValue);
    setFieldValue("netReceived", netReceivedValue);
    setFieldValue(
      "paymentReference",
      checkoutState.paymentReferenceInput.trim()
    );
    setFieldValue("productsTotal", finalProductsTotal);
    setFieldValue("overrideTotalPrice", checkoutState.overrideTotalPrice);
    setFieldValue(
      "overriddenProductsTotal",
      checkoutState.overrideTotalPrice
        ? parseFloat(checkoutState.overriddenProductsTotal) || 0
        : null
    );
    setFieldValue("totalAmount", localTotalAmount);
    setFieldValue("netAmount", localNetAmount);
    setFieldValue("change", localChange);
    setFieldValue("paymentMethod", checkoutState.paymentMethod);

    onSubmit();
  };

  return (
    <>
      <CheckoutSummary
        overrideTotalPrice={checkoutState.overrideTotalPrice}
        localProductsTotal={checkoutState.localProductsTotal}
        localMisc={checkoutState.localMisc}
        localTotalAmount={checkoutState.localTotalAmount}
        localDiscount={checkoutState.localDiscount}
      />

      <Card
        style={{
          marginBottom: 24,
          backgroundColor: paperTheme.colors.primaryContainer,
          borderWidth: 2,
          borderColor: paperTheme.colors.primary,
        }}
        elevation={4}
      >
        <Card.Content style={{ padding: 24 }}>
          <View className="items-center">
            <Text
              variant="titleMedium"
              style={{
                color: paperTheme.colors.onPrimaryContainer,
                marginBottom: 8,
                opacity: 0.8,
              }}
            >
              {language === "en" ? "Net Amount" : "淨額"}
            </Text>
            <View className="flex-row items-baseline justify-center">
              <Text
                variant="headlineLarge"
                style={{
                  color: paperTheme.colors.onPrimaryContainer,
                  fontWeight: "700",
                  fontSize: 42,
                  letterSpacing: 0.5,
                }}
              >
                {checkoutState.localNetAmount.toFixed(2)}
              </Text>
              <Text
                variant="titleLarge"
                style={{
                  color: paperTheme.colors.onPrimaryContainer,
                  marginLeft: 8,
                  opacity: 0.7,
                  fontWeight: "600",
                }}
              >
                {language === "en" ? "HKD" : "港幣"}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <NetReceivedSection
        netReceivedInput={checkoutState.netReceivedInput}
        onNetReceivedChange={checkoutState.setNetReceivedInput}
        netReceivedNumberPad={netReceivedNumberPad}
        cashButtons={cashButtons}
        paymentMethod={checkoutState.paymentMethod}
        onPaymentMethodChange={checkoutState.setPaymentMethod}
        netAmount={checkoutState.localNetAmount}
      />

      <View className="flex-row justify-between items-center mb-3">
        <Text variant="bodyLarge" className="font-bold">
          {language === "en" ? "Change" : "找零"}
        </Text>
        <Text variant="bodyLarge" className="text-right font-bold">
          {checkoutState.localChange.toFixed(2)}
        </Text>
      </View>

      {checkoutState.localNetAmount < 1 && (
        <View
          className="p-3 rounded-lg mb-3"
          style={{
            backgroundColor: theme.colors.errorContainer,
          }}
        >
          <Text
            variant="bodySmall"
            style={{
              color: theme.colors.error,
              textAlign: "center",
            }}
          >
            {language === "en"
              ? "Net amount must be at least $1.00 to checkout"
              : "淨額必須至少為$1.00才能結賬"}
          </Text>
        </View>
      )}

      {checkoutState.localNetReceived < checkoutState.localNetAmount &&
        checkoutState.localNetAmount >= 1 && (
          <View
            className="p-3 rounded-lg mb-3"
            style={{
              backgroundColor: theme.colors.errorContainer,
            }}
          >
            <Text
              variant="bodySmall"
              style={{
                color: theme.colors.error,
                textAlign: "center",
              }}
            >
              {language === "en"
                ? `Amount received ($${checkoutState.localNetReceived.toFixed(
                    2
                  )}) is less than net amount ($${checkoutState.localNetAmount.toFixed(
                    2
                  )})`
                : `現金支付 ($${checkoutState.localNetReceived.toFixed(
                    2
                  )}) 少於淨額 ($${checkoutState.localNetAmount.toFixed(2)})`}
            </Text>
          </View>
        )}

      <Card
        className="mb-4 space-y-4"
        style={{
          backgroundColor: paperTheme.colors.surface,
        }}
        elevation={2}
      >
        <Card.Content style={{ padding: 16 }}>
          <StaffSelector
            value={values.staffId}
            onValueChange={(value) => setFieldValue("staffId", value)}
            disabled={true}
          />

          <View className="mt-4 mb-4">
            <Text variant="bodyLarge">
              {language === "en"
                ? "Payment Reference (Optional)"
                : "付款參考 (可選)"}
            </Text>
            <TextInput
              ref={paymentReferenceInputRef}
              key="payment-reference-input"
              mode="outlined"
              label={
                language === "en"
                  ? "Payment Reference (Optional)"
                  : "付款參考 (可選)"
              }
              value={checkoutState.paymentReferenceInput}
              onChangeText={handlePaymentReferenceChange}
              onFocus={handlePaymentReferenceFocus}
              onBlur={handlePaymentReferenceBlur}
              onSubmitEditing={handlePaymentReferenceSubmit}
              className="mb-4"
              placeholder={
                language === "en"
                  ? "Enter reference number..."
                  : "請輸入參考號碼..."
              }
              blurOnSubmit={true}
              returnKeyType="done"
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
        </Card.Content>
      </Card>

      <View
        style={{
          flexDirection: "row",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <View style={{ flex: 1 }}>
          <Button mode="outlined" onPress={onBack}>
            {language === "en" ? "Back" : "返回"}
          </Button>
        </View>
        <View style={{ flex: 1 }}>
          <Button
            mode="contained"
            onPress={handleCompleteCheckout}
            disabled={
              checkoutState.localNetReceived < checkoutState.localNetAmount ||
              loading
            }
          >
            {language === "en" ? "Complete Checkout" : "完成結賬"}
          </Button>
        </View>
      </View>
    </>
  );
}



// Main Component
export default function SimpleOrderCheckout({
  values,
  setFieldValue,
  handleSubmit,
  manualInput,
  setManualInput,
  loading = false,
}: CheckoutProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const theme = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [prevModalState, setPrevModalState] = useState(false);
  const [savedManualInput, setSavedManualInput] = useState<boolean | null>(null);

  const { language } = useLanguageStore();
  
  // Calculate products total
  const productsTotal = useMemo(() => {
    const total = values.products.reduce(
      (sum: number, product: any) =>
        sum + product.quantity * product.unitPrice,
      0
    );
    console.log("📊 productsTotal calculated", total);
    return total;
  }, [values.products]);

  // Use checkout state hook at parent level to persist across page navigation
  const checkoutState = useCheckoutState(values, productsTotal, showModal);
  
  // Number pad hooks (moved to parent to access checkoutState)
  const totalPriceNumberPad = useNumberPad({
    hasDecimal: true,
    maxDecimals: 2,
    displayPrefix: "$",
    title: language === "en" ? "Total Products Price" : "產品總價",
    onConfirm: (value) => {
      const numValue = parseFloat(value) || 0;
      checkoutState.setOverriddenProductsTotal(Math.max(0, numValue).toFixed(2));
    },
  });

  const miscNumberPad = useNumberPad({
    hasDecimal: true,
    maxDecimals: 2,
    displayPrefix: "$",
    title: language === "en" ? "Misc" : "雜項",
    onConfirm: (value) => {
      const numValue = parseFloat(value) || 0;
      checkoutState.setMiscInput(
        Math.min(10000, Math.max(0, numValue)).toFixed(2)
      );
    },
  });

  const discountNumberPad = useNumberPad({
    hasDecimal: true,
    maxDecimals: 2,
    displayPrefix: "$",
    title: language === "en" ? "Discount" : "折扣",
    onConfirm: (value) => {
      const numValue = parseFloat(value) || 0;
      const currentProductsTotal = checkoutState.localProductsTotal;
      const currentMisc = checkoutState.localMisc;
      const currentTotalAmount = currentProductsTotal + currentMisc;
      const maxDiscount = Math.min(10000, currentTotalAmount);
      const finalNum = Math.min(numValue, maxDiscount);
      checkoutState.setDiscountInput(finalNum.toFixed(2));
    },
  });

  const netReceivedNumberPad = useNumberPad({
    hasDecimal: true,
    maxDecimals: 2,
    displayPrefix: "$",
    title: language === "en" ? "Net Received" : "現金支付",
    onConfirm: (value) => {
      const numValue = parseFloat(value) || 0;
      checkoutState.setNetReceivedInput(
        Math.min(100000, Math.max(0, numValue)).toFixed(2)
      );
    },
  });

  const discountButtons = [
    { label: "$10", value: 10 },
    { label: "$20", value: 20 },
    { label: "$50", value: 50 },
    { label: "$100", value: 100 },
    { label: "$200", value: 200 },
    { label: "$500", value: 500 },
  ];

  const cashButtons = [
    { label: "+$10", value: 10 },
    { label: "+$20", value: 20 },
    { label: "+$50", value: 50 },
    { label: "+$100", value: 100 },
    { label: "+$500", value: 500 },
    { label: "+$1000", value: 1000 },
  ];

  // Set manual input to true when modal opens
  useEffect(() => {
    console.log("⚡ SimpleOrderCheckout useEffect [showModal] triggered", { 
      showModal, 
      prevModalState 
    });
    if (prevModalState !== showModal) {
      const wasOpen = prevModalState;
      setPrevModalState(showModal);
      if (showModal && !wasOpen) {
        console.log("⚡ Modal opened - setting manual input");
        setSavedManualInput(manualInput ?? false);
        setManualInput(true);
      } else if (!showModal && wasOpen) {
        console.log("⚡ Modal closed - restoring manual input");
        const saved = savedManualInput;
        if (saved !== null) {
          setManualInput(saved);
          setSavedManualInput(null);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]); // Only depend on showModal, read other values when needed

  // Reset page when modal closes
  useEffect(() => {
    console.log("⚡ SimpleOrderCheckout useEffect [showModal - page reset] triggered", showModal);
    if (!showModal) {
      console.log("⚡ Resetting page to 1");
      setCurrentPage(1);
    }
  }, [showModal]);

  // Track payment reference focus state for padding
  const [isPaymentReferenceFocused, setIsPaymentReferenceFocused] = useState(false);
  
  // ScrollView ref and page tracking for scroll to top on page change
  const scrollViewRef = useRef<ScrollView>(null);
  const prevPageRef = useRef(currentPage);

  // Scroll to top when page changes
  useEffect(() => {
    if (prevPageRef.current !== currentPage) {
      // Scroll to top when navigating between pages
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: 0,
          animated: false,
        });
      }, 0);
      prevPageRef.current = currentPage;
    }
  }, [currentPage]);

  return (
    <>
      <Button
        mode="contained"
        onPress={() => setShowModal(true)}
        className="col-span-1"
        disabled={values.products.length === 0}
      >
        {language === "en" ? "Checkout" : "結賬"}
      </Button>

      <Portal>
        <Modal
          visible={showModal}
          onDismiss={() => setShowModal(false)}
          contentContainerStyle={{
            flex: 1,
            height: "100%",
            backgroundColor: theme.colors.surface,
          }}
          style={{ margin: 0 }}
        >
          <SafeAreaView
            className="flex-1"
            style={{ backgroundColor: theme.colors.surface }}
          >
            <View
              className="flex-row justify-between items-center p-5 pb-2.5 border-b border-gray-200"
              style={{
                backgroundColor: theme.colors.surface,
                borderBottomColor: theme.colors.outline,
              }}
            >
              <Text variant="headlineMedium">
                {language === "en" ? "Checkout" : "結賬"}
              </Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setShowModal(false)}
              />
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ flex: 1 }}
              keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
              <InputFocusProvider>
                <ScrollView
                  ref={scrollViewRef}
                  key="checkout-scroll-view"
                  className="flex-1"
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{
                    paddingBottom: isPaymentReferenceFocused ? 128 : 20,
                  }}
                  removeClippedSubviews={false}
                  scrollEventThrottle={16}
                >
                  <View className="p-5">
                    <View className="items-center mb-4">
                      <Text variant="titleLarge" className="text-2xl font-bold">
                        {language === "en" ? "HKD" : "港幣"}
                      </Text>
                    </View>

                    {currentPage === 1 && (
                      <CheckoutPage1
                        checkoutState={checkoutState}
                        productsTotal={productsTotal}
                        theme={theme}
                        onNext={() => setCurrentPage(2)}
                        onCancel={() => setShowModal(false)}
                        totalPriceNumberPad={totalPriceNumberPad}
                        miscNumberPad={miscNumberPad}
                        discountNumberPad={discountNumberPad}
                        discountButtons={discountButtons}
                      />
                    )}

                    {currentPage === 2 && (
                      <CheckoutPage2
                        checkoutState={checkoutState}
                        values={values}
                        setFieldValue={setFieldValue}
                        theme={theme}
                        onBack={() => setCurrentPage(1)}
                        onSubmit={() => {
                          handleSubmit();
                          setShowModal(false);
                        }}
                        loading={loading}
                        netReceivedNumberPad={netReceivedNumberPad}
                        cashButtons={cashButtons}
                        onPaymentReferenceFocusChange={setIsPaymentReferenceFocused}
                      />
                    )}

                    {totalPriceNumberPad.NumberPadModal()}
                    {miscNumberPad.NumberPadModal()}
                    {discountNumberPad.NumberPadModal()}
                    {netReceivedNumberPad.NumberPadModal()}
                  </View>
                </ScrollView>
              </InputFocusProvider>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Modal>
      </Portal>
    </>
  );
}

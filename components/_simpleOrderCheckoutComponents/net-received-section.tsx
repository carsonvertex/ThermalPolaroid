import { useNumberPad } from "@/hooks/use-number-pad";
import { useLanguageStore } from "@/lib/stores";
import { useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import {
  Button,
  Card,
  Chip,
  IconButton,
  Switch,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

export type PaymentMethod = "cash" | "octopus" | "credit_card";

export function NetReceivedSection({
  netReceivedInput,
  onNetReceivedChange,
  netReceivedNumberPad,
  cashButtons,
  paymentMethod,
  onPaymentMethodChange,
  netAmount,
}: {
  netReceivedInput: string;
  onNetReceivedChange: (value: string) => void;
  netReceivedNumberPad: ReturnType<typeof useNumberPad>;
  cashButtons: Array<{ label: string; value: number }>;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  netAmount: number;
}) {
  const { language } = useLanguageStore();
  const theme = useTheme();
  const [enableManualInput, setEnableManualInput] = useState(false);

  // Automatically set netReceivedInput to netAmount when payment method is octopus, credit_card, or cash (when manual input is disabled)
  useEffect(() => {
    if (paymentMethod === "octopus" || paymentMethod === "credit_card") {
      onNetReceivedChange(netAmount.toFixed(2));
    } else if (paymentMethod === "cash" && !enableManualInput) {
      onNetReceivedChange(netAmount.toFixed(2));
    }
  }, [paymentMethod, netAmount, onNetReceivedChange, enableManualInput]);

  // Reset manual input toggle when switching away from cash
  useEffect(() => {
    if (paymentMethod !== "cash") {
      setEnableManualInput(false);
    }
  }, [paymentMethod]);

  const handleDecrement = () => {
    const current = parseFloat(netReceivedInput) || 0;
    if (current > 0) {
      onNetReceivedChange(Math.max(0, current - 1).toFixed(2));
    }
  };

  const handleIncrement = () => {
    const current = parseFloat(netReceivedInput) || 0;
    onNetReceivedChange(Math.min(100000, current + 1).toFixed(2));
  };

  const handleOpenNumberPad = () => {
    netReceivedNumberPad.open(netReceivedInput, (newValue) => {
      onNetReceivedChange(newValue);
    });
  };

  const handleCashButtonPress = (value: number) => {
    console.log("🔘 handleCashButtonPress called", value);
    const current = parseFloat(netReceivedInput) || 0;
    if (current + value <= 100000) {
      console.log(
        "🔘 onNetReceivedChange will be called",
        (current + value).toFixed(2)
      );
      onNetReceivedChange((current + value).toFixed(2));
    }
  };

  const netReceivedRightProp = useMemo(() => {
    return parseFloat(netReceivedInput) > 0 ? (
      <TextInput.Icon
        icon="close-circle"
        onPress={() => onNetReceivedChange("0.00")}
      />
    ) : undefined;
  }, [netReceivedInput, onNetReceivedChange]);

  return (
    <Card
      style={{
        marginBottom: 16,
        backgroundColor: theme.colors.surface,
      }}
      elevation={2}
    >
      <Card.Content style={{ padding: 16 }}>
        {/* Payment Method Selection */}
        <View className="mb-3">
          <Text variant="bodyLarge" style={{ marginBottom: 8 }}>
            {language === "en" ? "Payment Method" : "付款方式"}
          </Text>
          <View className="flex-row gap-2">
            <Button
              mode={paymentMethod === "cash" ? "contained" : "outlined"}
              onPress={() => {
                onPaymentMethodChange("cash");
                // Reset to netAmount when switching to cash (manual input disabled by default)
                if (!enableManualInput) {
                  onNetReceivedChange(netAmount.toFixed(2));
                } else {
                  onNetReceivedChange("0.00");
                }
              }}
              compact
              style={{ flex: 1 }}
            >
              {language === "en" ? "Cash" : "現金"}
            </Button>
            <Button
              mode={paymentMethod === "octopus" ? "contained" : "outlined"}
              onPress={() => onPaymentMethodChange("octopus")}
              compact
              style={{ flex: 1 }}
            >
              {language === "en" ? "Octopus" : "八達通"}
            </Button>
            <Button
              mode={paymentMethod === "credit_card" ? "contained" : "outlined"}
              onPress={() => onPaymentMethodChange("credit_card")}
              compact
              style={{ flex: 1 }}
            >
              {language === "en" ? "Credit Card" : "信用卡"}
            </Button>
          </View>
        </View>

        <View className="flex-row justify-between items-center mb-3">
          <Text variant="bodyLarge">
            {language === "en" ? "Net Received (+) HKD" : "淨收款(+)港幣"}
          </Text>
        </View>

        {/* Manual Input Toggle - Only show when cash payment method is selected */}
        {paymentMethod === "cash" && (
          <View className="flex-row items-center justify-between mb-3">
            <Text variant="bodyMedium">
              {language === "en" ? "Manual Input" : "手動輸入"}
            </Text>
            <Switch
              value={enableManualInput}
              onValueChange={(value) => {
                setEnableManualInput(value);
                if (value) {
                  // When enabling manual input, reset to 0.00
                  onNetReceivedChange("0.00");
                } else {
                  // When disabling manual input, set to netAmount
                  onNetReceivedChange(netAmount.toFixed(2));
                }
              }}
            />
          </View>
        )}

        {paymentMethod === "cash" && enableManualInput ? (
          <>
            <View className="flex-row flex-wrap gap-2 mb-3">
              {cashButtons.map((button, index) => {
                const current = parseFloat(netReceivedInput) || 0;
                const wouldExceedMax = current + button.value > 100000;
                return (
                  <Chip
                    key={index}
                    mode="outlined"
                    onPress={() => handleCashButtonPress(button.value)}
                    className="mr-1 mb-1"
                    disabled={wouldExceedMax}
                  >
                    {language === "en" ? `$${button.value}` : `$${button.value}`}
                  </Chip>
                );
              })}
            </View>

            <View
              className="flex-row items-center mb-4 gap-2"
              style={{ width: "100%" }}
            >
              <IconButton
                icon="minus"
                mode="contained"
                size={20}
                onPress={handleDecrement}
                className="m-0"
                disabled={parseFloat(netReceivedInput) <= 0}
              />
              <Pressable style={{ flex: 1 }} onPress={handleOpenNumberPad}>
                <TextInput
                  mode="outlined"
                  label={language === "en" ? "Paid Amount" : "收款金額"}
                  value={netReceivedInput}
                  editable={false}
                  showSoftInputOnFocus={false}
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                  style={{ flex: 1 }}
                  right={netReceivedRightProp}
                />
              </Pressable>
              <IconButton
                icon="plus"
                mode="contained"
                size={20}
                onPress={handleIncrement}
                className="m-0"
                disabled={parseFloat(netReceivedInput) >= 100000}
              />
            </View>
          </>
        ) : (
          <View className="mb-4">
            <Text variant="headlineMedium" style={{ textAlign: "center" }}>
              ${parseFloat(netReceivedInput || "0").toFixed(2)}
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

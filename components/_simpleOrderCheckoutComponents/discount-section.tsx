import { useNumberPad } from "@/hooks/use-number-pad";
import { useLanguageStore } from "@/lib/stores";
import { useMemo } from "react";
import { Pressable, View } from "react-native";
import {
  Card,
  Chip,
  IconButton,
  TextInput as PaperTextInput,
  Text,
  useTheme,
} from "react-native-paper";

export function DiscountSection({
  discountInput,
  localProductsTotal,
  localMisc,
  onDiscountChange,
  onApplyDiscountAmount,
  discountNumberPad,
  discountButtons,
}: {
  discountInput: string;
  localProductsTotal: number;
  localMisc: number;
  onDiscountChange: (value: string) => void;
  onApplyDiscountAmount: (amount: number) => void;
  discountNumberPad: ReturnType<typeof useNumberPad>;
  discountButtons: Array<{ label: string; value: number }>;
}) {
  const { language } = useLanguageStore();
  const theme = useTheme();

  const handleDecrement = () => {
    const current = parseFloat(discountInput) || 0;
    if (current > 0) {
      onDiscountChange(Math.max(0, current - 1).toFixed(2));
    }
  };

  const handleIncrement = () => {
    const current = parseFloat(discountInput) || 0;
    const currentTotalAmount = localProductsTotal + localMisc;
    const maxDiscount = Math.min(10000, currentTotalAmount);
    const newDiscount = Math.min(current + 1, maxDiscount);
    onDiscountChange(newDiscount.toFixed(2));
  };

  const handleOpenNumberPad = () => {
    discountNumberPad.open(discountInput, (newValue) => {
      onDiscountChange(newValue);
    });
  };

  const discountRightProp = useMemo(() => {
    return parseFloat(discountInput) > 0 ? (
      <PaperTextInput.Icon
        icon="close-circle"
        onPress={() => onDiscountChange("0.00")}
      />
    ) : undefined;
  }, [discountInput, onDiscountChange]);

  const getMaxDiscount = () => {
    const currentTotalAmount = localProductsTotal + localMisc;
    return Math.min(10000, currentTotalAmount);
  };

  const isDiscountDisabled = () => {
    const currentDiscount = parseFloat(discountInput) || 0;
    return currentDiscount >= getMaxDiscount();
  };

  return (
    <Card
      style={{
        marginBottom: 16,
        backgroundColor: theme.colors.surface,
      }}
      elevation={2}
    >
      <Card.Content style={{ padding: 16 }}>
        <View className="flex-row justify-between items-center mb-3">
          <Text variant="bodyLarge">
            {language === "en" ? "Discount (-)" : "折扣 (-)"}
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-2 mb-4">
          {discountButtons.map((button, index) => {
            const currentDiscount = parseFloat(discountInput) || 0;
            const maxDiscount = getMaxDiscount();
            const wouldExceedMax = currentDiscount + button.value > maxDiscount;
            const isDisabled = currentDiscount >= maxDiscount || wouldExceedMax;

            return (
              <Chip
                key={index}
                mode="outlined"
                onPress={() => onApplyDiscountAmount(button.value)}
                className="mb-2"
                disabled={isDisabled}
                style={{ opacity: isDisabled ? 0.5 : 1 }}
              >
                {button.label}
              </Chip>
            );
          })}
        </View>

        <View className="mb-4" style={{ width: "100%" }}>
          <View
            className="flex-row items-center gap-2"
            style={{ width: "100%" }}
          >
            <IconButton
              icon="minus"
              mode="contained"
              size={20}
              onPress={handleDecrement}
              className="m-0"
              disabled={parseFloat(discountInput) <= 0}
            />
            <Pressable style={{ flex: 1 }} onPress={handleOpenNumberPad}>
              <PaperTextInput
                mode="outlined"
                label={language === "en" ? "Discount Amount" : "折扣金額"}
                value={discountInput}
                editable={false}
                showSoftInputOnFocus={false}
                keyboardType="decimal-pad"
                inputMode="decimal"
                style={{ flex: 1 }}
                right={discountRightProp}
              />
            </Pressable>
            <IconButton
              icon="plus"
              mode="contained"
              size={20}
              onPress={handleIncrement}
              className="m-0"
              disabled={isDiscountDisabled()}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

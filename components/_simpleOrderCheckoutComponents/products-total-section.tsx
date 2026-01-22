import { useNumberPad } from "@/hooks/use-number-pad";
import { useLanguageStore } from "@/lib/stores";
import { Pressable, View } from "react-native";
import {
  Checkbox,
  IconButton,
  Text,
  TextInput,
} from "react-native-paper";

export function ProductsTotalSection({
  overrideTotalPrice,
  overriddenProductsTotal,
  localProductsTotal,
  productsTotal,
  onToggleOverride,
  onOverrideValueChange,
  totalPriceNumberPad,
}: {
  overrideTotalPrice: boolean;
  overriddenProductsTotal: string;
  localProductsTotal: number;
  productsTotal: number;
  onToggleOverride: () => void;
  onOverrideValueChange: (value: string) => void;
  totalPriceNumberPad: ReturnType<typeof useNumberPad>;
}) {
  const { language } = useLanguageStore();

  const handleDecrement = () => {
    const current = parseFloat(overriddenProductsTotal) || 0;
    if (current > 0) {
      onOverrideValueChange(Math.max(0, current - 1).toFixed(2));
    }
  };

  const handleIncrement = () => {
    const current = parseFloat(overriddenProductsTotal) || 0;
    onOverrideValueChange(Math.min(1000000, current + 1).toFixed(2));
  };

  const handleOpenNumberPad = () => {
    totalPriceNumberPad.open(overriddenProductsTotal, (newValue) => {
      onOverrideValueChange(newValue);
    });
  };

  return (
    <>
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center gap-2">
          <Text variant="bodyLarge">
            {language === "en" ? "Products" : "產品"}
          </Text>
          <Checkbox
            status={overrideTotalPrice ? "checked" : "unchecked"}
            onPress={onToggleOverride}
          />
          <Text variant="bodySmall" onPress={onToggleOverride}>
            {language === "en" ? "Override Total Price" : "覆蓋總價"}
          </Text>
        </View>
        <Text variant="bodyLarge" className="text-lg font-semibold">
          {localProductsTotal.toFixed(2)}
        </Text>
      </View>

      {overrideTotalPrice && (
        <View className="mb-3" style={{ width: "100%" }}>
          <Text variant="bodyMedium" className="mb-2">
            {language === "en" ? "Total Products Price" : "產品總價"}
          </Text>
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
              disabled={parseFloat(overriddenProductsTotal) <= 0}
            />
            <Pressable style={{ flex: 1 }} onPress={handleOpenNumberPad}>
              <TextInput
                mode="outlined"
                label={language === "en" ? "Total Price" : "總價"}
                value={overriddenProductsTotal}
                editable={false}
                showSoftInputOnFocus={false}
                keyboardType="decimal-pad"
                inputMode="decimal"
                style={{ flex: 1 }}
                right={
                  parseFloat(overriddenProductsTotal) > 0 ? (
                    <TextInput.Icon
                      icon="close-circle"
                      onPress={() => onOverrideValueChange("0.00")}
                    />
                  ) : undefined
                }
              />
            </Pressable>
            <IconButton
              icon="plus"
              mode="contained"
              size={20}
              onPress={handleIncrement}
              className="m-0"
              disabled={parseFloat(overriddenProductsTotal) >= 1000000}
            />
          </View>
        </View>
      )}
    </>
  );
}


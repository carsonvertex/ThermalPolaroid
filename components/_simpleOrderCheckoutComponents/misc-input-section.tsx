import { useNumberPad } from "@/hooks/use-number-pad";
import { useLanguageStore } from "@/lib/stores";
import { useMemo } from "react";
import { Pressable, View } from "react-native";
import {
  IconButton,
  Text,
  TextInput,
} from "react-native-paper";

export function MiscInputSection({
  miscInput,
  onMiscChange,
  miscNumberPad,
}: {
  miscInput: string;
  onMiscChange: (value: string) => void;
  miscNumberPad: ReturnType<typeof useNumberPad>;
}) {
  const { language } = useLanguageStore();

  const handleDecrement = () => {
    const current = parseFloat(miscInput) || 0;
    if (current > 0) {
      onMiscChange(Math.max(0, current - 1).toFixed(2));
    }
  };

  const handleIncrement = () => {
    const current = parseFloat(miscInput) || 0;
    onMiscChange(Math.min(10000, current + 1).toFixed(2));
  };

  const handleOpenNumberPad = () => {
    miscNumberPad.open(miscInput, (newValue) => {
      const num = parseFloat(newValue) || 0;
      onMiscChange(Math.min(10000, Math.max(0, num)).toFixed(2));
    });
  };

  const miscRightProp = useMemo(() => {
    return parseFloat(miscInput) > 0 ? (
      <TextInput.Icon icon="close-circle" onPress={() => onMiscChange("0.00")} />
    ) : undefined;
  }, [miscInput, onMiscChange]);

  return (
    <View className="mb-3" style={{ width: "100%" }}>
      <Text variant="bodyLarge" className="mb-2">
        {language === "en" ? "Misc (+)" : "雜項 (+)"}
      </Text>
      <View className="flex-row items-center gap-2" style={{ width: "100%" }}>
        <IconButton
          icon="minus"
          mode="contained"
          size={20}
          onPress={handleDecrement}
          className="m-0"
          disabled={parseFloat(miscInput) <= 0}
        />
        <Pressable style={{ flex: 1 }} onPress={handleOpenNumberPad}>
          <TextInput
            mode="outlined"
            label={language === "en" ? "Misc Amount" : "雜項金額"}
            value={miscInput}
            editable={false}
            showSoftInputOnFocus={false}
            keyboardType="decimal-pad"
            inputMode="decimal"
            style={{ flex: 1 }}
            right={miscRightProp}
          />
        </Pressable>
        <IconButton
          icon="plus"
          mode="contained"
          size={20}
          onPress={handleIncrement}
          className="m-0"
          disabled={parseFloat(miscInput) >= 10000}
        />
      </View>
    </View>
  );
}


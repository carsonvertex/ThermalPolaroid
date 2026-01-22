import { useInputFocusSetter } from "@/hooks/use-input-focus-group";
import { useLanguageStore } from "@/lib/stores/language-store";
import { View } from "react-native";
import { IconButton, TextInput, useTheme } from "react-native-paper";
import DraggableBottomDrawer from "../shared/draggable-bottom-drawer";
import { ThemedText } from "../ui";

// Inner component that uses the hook (must be inside InputFocusProvider)
function DrawerContent({
  product,
  index,
  deleteProduct,
  setFieldValue,
}: {
  product: any;
  index: number;
  deleteProduct: (index: number) => void;
  setFieldValue: (field: string, value: any) => void;
}) {
  const theme = useTheme();
  const { language } = useLanguageStore();
  const setInputFocused = useInputFocusSetter();
  
  return (
        <>
          <View
            className="flex-row justify-between py-3 border-b"
            style={{ borderBottomColor: theme.colors.outline }}
          >
            <ThemedText className="text-sm font-medium opacity-60">
              {language === "en" ? "Item #" : "編號"}
            </ThemedText>
            <ThemedText className="text-sm font-semibold">
              {index + 1}
            </ThemedText>
          </View>
          <View
            className="flex-row justify-between py-3 border-b"
            style={{ borderBottomColor: theme.colors.outline }}
          >
            <ThemedText className="text-sm font-medium opacity-60">
              {language === "en" ? "SKU" : "SKU "}
            </ThemedText>
            <ThemedText className="text-sm font-semibold">
              {product.sku || "N/A"}
            </ThemedText>
          </View>
          {product.model && (
            <View
              className="flex-row justify-between py-3 border-b"
              style={{ borderBottomColor: theme.colors.outline }}
            >
              <ThemedText className="text-sm font-medium opacity-60">
                {language === "en" ? "Model" : "型號"}
              </ThemedText>
              <ThemedText className="text-sm font-semibold">
                {product.model}
              </ThemedText>
            </View>
          )}
          <View
            className="flex-row justify-between py-3 border-b"
            style={{ borderBottomColor: theme.colors.outline }}
          >
            <ThemedText className="text-sm font-medium opacity-60">
              {language === "en" ? "Product Detail" : "商品詳細"}
            </ThemedText>
            <ThemedText className="text-sm font-semibold text-right flex-1 ml-4">
              {product.productDetail}
            </ThemedText>
          </View>
          <View
            className="flex-row justify-between py-3 border-b"
            style={{ borderBottomColor: theme.colors.outline }}
          >
            <ThemedText className="text-sm font-medium opacity-60">
              {language === "en" ? "Quantity" : "数量"}
            </ThemedText>

            <View className="flex-row items-center gap-2">
              <IconButton
                icon="minus"
                size={16}
                mode="contained"
                onPress={(e) => {
                  e.stopPropagation();
                  const current = product.quantity;
                  if (current > 1) {
                    setFieldValue(`products.${index}.quantity`, current - 1);
                  }
                }}
                containerColor={theme.colors.primaryContainer}
                iconColor={theme.colors.primary}
                disabled={product.quantity <= 1}
              />
              <TextInput
                mode="outlined"
                keyboardType="number-pad"
                inputMode="numeric"
                value={product.quantity.toString()}
                onChangeText={(text: string) => {
                  const cleaned = text.replace(/[^0-9]/g, "");
                  if (cleaned === "") {
                    setFieldValue(`products.${index}.quantity`, 1);
                  } else {
                    const num = parseInt(cleaned, 10) || 1;
                    setFieldValue(`products.${index}.quantity`, Math.min(100, Math.max(1, num)));
                  }
                }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                style={{
                  width: 80,
                  height: 45,
                }}
                contentStyle={{
                  textAlign: "center",
                  paddingHorizontal: 8,
                }}
                outlineStyle={{
                  borderRadius: 8,
                }}
                dense
              />

              <IconButton
                icon="plus"
                size={16}
                mode="contained"
                onPress={(e) => {
                  e.stopPropagation();
                  const current = product.quantity;
                  setFieldValue(`products.${index}.quantity`, current + 1);
                }}
                containerColor={theme.colors.primaryContainer}
                iconColor={theme.colors.primary}
                disabled={product.quantity >= 100}
              />
            </View>
          </View>
          <View
            className="flex-row justify-between py-3 border-b"
            style={{ borderBottomColor: theme.colors.outline }}
          >
            <ThemedText className="text-sm font-medium opacity-60">
              {language === "en" ? "Unit Price" : "單價"}
            </ThemedText>
            <ThemedText className="text-sm font-semibold">
              ${product.unitPrice.toFixed(2)}
            </ThemedText>
          </View>
          <View className="px-3 py-2 rounded-lg mt-2">
            <View className="flex-row justify-between">
              <ThemedText className="text-base font-bold">
                {language === "en" ? "Total" : "總計"}
              </ThemedText>
              <ThemedText className="text-base font-bold">
                ${(product.quantity * product.unitPrice).toFixed(2)}
              </ThemedText>
            </View>
          </View>
        </>
  );
}

export default function SimpleOrderItemDrawer({
  showDrawer,
  setShowDrawer,
  product,
  index,
  deleteProduct,
  setFieldValue,
}: {
  showDrawer: boolean;
  setShowDrawer: (show: boolean) => void;
  product: any;
  index: number;
  deleteProduct: (index: number) => void;
  setFieldValue: (field: string, value: any) => void;
}) {
  return (
    <DraggableBottomDrawer
      showDrawer={showDrawer}
      setShowDrawer={setShowDrawer}
      title="Product Details"
      children={
        <DrawerContent
          product={product}
          index={index}
          deleteProduct={deleteProduct}
          setFieldValue={setFieldValue}
        />
      }
    />
  );
}

import { roadShowProductRepository } from "@/endpoints/sqlite/repositories/roadshow-product-repository";
import { useSnackbar } from "@/lib/hooks/use-snackbar";
import { useLanguageStore } from "@/lib/stores/language-store";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  TextInput as RNTextInput,
  View,
} from "react-native";
import { Button, Card, Switch, TextInput, useTheme } from "react-native-paper";
import { AppSnackbar } from "../shared";
import { ThemedText } from "../ui";

interface ScanProductProps {
  values?: any;
  setFieldValue?: (field: string, value: any) => void;
  onScanActive?: (isActive: boolean) => void;
  manualInput?: boolean;
  setManualInput?: (value: boolean) => void;
}

export default function ScanProduct({
  values,
  setFieldValue,
  onScanActive,
  manualInput,
  setManualInput,
}: ScanProductProps) {
  const { language } = useLanguageStore();
  const theme = useTheme();
  const { visible, message, type, showSnackbar, hideSnackbar } = useSnackbar();

  const [sku, setSku] = useState("");
  const [loading, setLoading] = useState(false);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<RNTextInput>(null);
  // Cache for product lookups to avoid repeated database queries
  const productCacheRef = useRef<Map<string, any | null>>(new Map());

  // Auto-focus on mount and when switching to scan mode
  // Use a longer delay to avoid interfering with modal/drawer inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!manualInput) {
        // Only focus if input exists and we're not in a modal/drawer context
        // This prevents stealing focus when checkout modal or bottom drawer opens
        if (inputRef.current) {
          inputRef.current?.focus();
          onScanActive?.(true);
        }
      } else {
        onScanActive?.(false);
      }
    }, 300); // Increased delay to allow modals/drawers to render first

    return () => clearTimeout(timer);
  }, [manualInput, onScanActive]);

  // Refocus input when screen comes into focus (when navigating back)
  // Use longer delay to avoid interfering with modal/drawer inputs
  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        if (!manualInput && inputRef.current) {
          // Only refocus if we're not in a modal/drawer context
          inputRef.current.focus();
        }
      }, 500); // Increased delay to allow modals/drawers to handle focus first

      return () => clearTimeout(timer);
    }, [manualInput])
  );

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, []);

  // Prevent hardware back button and other key events from triggering drawer when scanning
  useEffect(() => {
    // Only intercept if we're in scan mode and input is focused
    if (!manualInput && inputRef.current) {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          // If input is focused, don't let back button do anything (prevent drawer)
          if (inputRef.current?.isFocused()) {
            return true; // Prevent default behavior
          }
          return false; // Allow default behavior
        }
      );

      return () => backHandler.remove();
    }
  }, [manualInput]);

  const scanProduct = async () => {
    // Validation: empty SKU check
    if (!sku.trim()) {
      if (manualInput) {
        showSnackbar(
          language === "en" ? "Please enter a SKU" : "請輸入SKU",
          "error",
          1000
        );
      }
      return;
    }

    // Prevent duplicate calls
    if (loading) return;

    try {
      setLoading(true);

      // Search by SKU and barcode in parallel for faster response
      const trimmedSku = sku.trim();
      
      // Check cache first
      if (productCacheRef.current.has(trimmedSku)) {
        const cachedProduct = productCacheRef.current.get(trimmedSku);
        setLoading(false);
        
        if (cachedProduct) {
          // Use cached product
          const product = cachedProduct;
          const productDetailString = `${product.product_name || "Product"} - ${
            product.brand_name || ""
          } (SKU: ${product.sku})`.trim();

          if (values && setFieldValue) {
            const existingProducts = values.products || [];
            const existingIndex = existingProducts.findIndex(
              (p: any) => p.productDetail === productDetailString
            );

            if (existingIndex !== -1) {
              // Update existing product quantity
              const updatedProducts = [...existingProducts];
              updatedProducts[existingIndex] = {
                ...updatedProducts[existingIndex],
                quantity: updatedProducts[existingIndex].quantity + 1,
              };
              setFieldValue("products", updatedProducts);

              const msg = `${language === "en" ? "Updated" : "已更新"}: ${
                product.product_name || "Product"
              } (${language === "en" ? "Qty" : "數量"}: ${
                updatedProducts[existingIndex].quantity
              })`;
              showSnackbar(msg, "success", 300);
            } else {
              // Add new product
              setFieldValue("products", [
                ...existingProducts,
                {
                  sku: product.sku || "",
                  productDetail: productDetailString,
                  quantity: 1,
                  unitPrice: product.price || 0,
                  model: product.model_number || "",
                },
              ]);

              const msg = `${language === "en" ? "Added" : "已添加"}: ${
                product.product_name || "Product"
              } - $${product.price?.toFixed(2) || "0.00"}`;
              showSnackbar(msg, "success", 300);
            }

            // Clear input immediately - no delay
            if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
            setSku("");
            return; // Exit early
          }
        } else {
          // Cached as not found
          showSnackbar(
            language === "en"
              ? `No product found with SKU: ${sku}`
              : `找不到SKU為 ${sku} 的產品`,
            "error",
            800
          );
          setSku("");
          return; // Exit early
        }
      }

      // Not in cache, query database
      const [skuProduct, barcodeProduct] = await Promise.all([
        roadShowProductRepository.getBySku(trimmedSku),
        roadShowProductRepository.getByBarcode(trimmedSku),
      ]);

      const product = skuProduct || barcodeProduct;
      
      // Cache the result (even if null, to avoid re-querying non-existent products)
      productCacheRef.current.set(trimmedSku, product);

      if (product) {
        const productDetailString = `${product.product_name || "Product"} - ${
          product.brand_name || ""
        } (SKU: ${product.sku})`.trim();

        if (values && setFieldValue) {
          const existingProducts = values.products || [];
          const existingIndex = existingProducts.findIndex(
            (p: any) => p.productDetail === productDetailString
          );

          if (existingIndex !== -1) {
            // Update existing product quantity
            const updatedProducts = [...existingProducts];
            updatedProducts[existingIndex] = {
              ...updatedProducts[existingIndex],
              quantity: updatedProducts[existingIndex].quantity + 1,
            };
            setFieldValue("products", updatedProducts);

            const msg = `${language === "en" ? "Updated" : "已更新"}: ${
              product.product_name || "Product"
            } (${language === "en" ? "Qty" : "數量"}: ${
              updatedProducts[existingIndex].quantity
            })`;
            showSnackbar(msg, "success", 300);
          } else {
            // Add new product
            setFieldValue("products", [
              ...existingProducts,
              {
                sku: product.sku || "",
                productDetail: productDetailString,
                quantity: 1,
                unitPrice: product.price || 0,
                model: product.model_number || "",
              },
            ]);

            const msg = `${language === "en" ? "Added" : "已添加"}: ${
              product.product_name || "Product"
            } - $${product.price?.toFixed(2) || "0.00"}`;
            showSnackbar(msg, "success", 300);
          }

          // Clear input immediately - no delay
          if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
          setSku("");
          setLoading(false); // Clear loading state immediately after success
          return; // Exit early to skip finally block
        }
      } else {
        // Product not found
        showSnackbar(
          language === "en"
            ? `No product found with SKU: ${sku}`
            : `找不到SKU為 ${sku} 的產品`,
          "error",
          800
        );
        setSku("");
        setLoading(false);
      }
    } catch (error) {
      console.error("❌ Error searching product:", error);
      showSnackbar(
        language === "en"
          ? "Failed to search for product"
          : "搜索產品時發生錯誤",
        "error",
        800
      );
      setSku("");
      setLoading(false);
    }
  };

  // Auto-scan mode: trigger search when SKU changes (with debounce)
  useEffect(() => {
    // Clear previous debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Only auto-scan if not in manual mode and SKU is not empty
    if (!manualInput && sku.trim()) {
      // Minimal debounce to wait for complete barcode input (0ms - instant)
      debounceTimeoutRef.current = setTimeout(() => {
        scanProduct();
      }, 0);
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [sku, manualInput]);

  return (
    <Card
      style={{
        marginBottom: 16,
        backgroundColor: theme.colors.surface,
      }}
      elevation={2}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => false}
    >
      <Card.Content style={{ padding: 16 }}>
        {/* Title */}
        <ThemedText
          style={{
            fontSize: 16,
            fontWeight: "600",
            marginBottom: 12,
          }}
        >
          {language === "en"
            ? "Scan Product SKU/ Barcode"
            : "掃描產品SKU/條碼  "}
        </ThemedText>

        {/* Switch to toggle manual input */}
        <View className="flex-row items-center justify-between gap-2 mb-3">
          <ThemedText>
            {language === "en" ? "Manual Input" : "手動輸入"}
          </ThemedText>
          <Switch
            value={manualInput === undefined ? false : manualInput}
            onValueChange={(value) => {
              if (setManualInput) {
                setManualInput(value);
              }
            }}
          />
        </View>

        {/* Input to scan product */}
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            marginBottom: 12,
            position: "relative",
          }}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => false}
        >
          {/* Hidden input for barcode scanner - always active but invisible in scan mode */}
          <TextInput
            ref={inputRef}
            mode="outlined"
            placeholder={
              manualInput
                ? language === "en"
                  ? "Enter SKU or Barcode..."
                  : "請輸入SKU或條碼..."
                : language === "en"
                ? "Scan Barcode"
                : "掃描條碼"
            }
            value={sku}
            onChangeText={(text) => setSku(text)}
            disabled={loading}
            left={
              manualInput ? <TextInput.Icon icon="barcode-scan" /> : undefined
            }
            onSubmitEditing={scanProduct}
            onKeyPress={(e) => {
              // Prevent any key events from bubbling up that might trigger drawer
              e.stopPropagation?.();
            }}
            onFocus={() => {
              // Ensure input stays focused and captures all keyboard events
              inputRef.current?.focus();
              if (!manualInput) {
                onScanActive?.(true);
              }
            }}
            onBlur={() => {
              // Don't immediately refocus - allow other inputs (like in checkout modal/drawer) to focus
              // Only refocus after a delay if user isn't interacting with other inputs
              if (!manualInput && !loading) {
                onScanActive?.(false);
                // Use a longer delay to allow modals/drawers to focus their inputs
                setTimeout(() => {
                  // Only refocus if input still exists and no other input is likely focused
                  // This prevents stealing focus from checkout modal and bottom drawer inputs
                  if (inputRef.current) {
                    inputRef.current?.focus();
                    onScanActive?.(true);
                  }
                }, 1000); // Increased delay to allow modal/drawer inputs to focus
              } else {
                onScanActive?.(false);
              }
            }}
            style={{
              backgroundColor: theme.colors.surface,
              flex: 1,
              // Hide the input visually when in scan mode, but keep it in layout to receive input
              ...(manualInput
                ? {}
                : {
                    position: "absolute",
                    opacity: 0,
                    width: "100%",
                    height: 56,
                    zIndex: 0, // Lower z-index so it doesn't block modal/drawer inputs
                    pointerEvents: "auto", // Keep auto to receive barcode scanner keyboard events
                    // But positioned behind modals/drawers (zIndex: 0) so it won't block their inputs
                  }),
            }}
            showSoftInputOnFocus={manualInput}
            autoFocus={false}
            blurOnSubmit={false}
          />
          {/* Show visual indicator and scan button when in scan mode */}
          {!manualInput && (
            <>
              <Pressable
                style={{
                  flex: 1,
                  height: 56,
                  borderWidth: 2,
                  borderColor: loading
                    ? theme.colors.primary
                    : theme.colors.outline,
                  borderStyle: "dashed",
                  borderRadius: 4,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: loading
                    ? theme.colors.surfaceVariant
                    : theme.colors.surface,
                }}
                onPress={() => {
                  inputRef.current?.focus();
                }}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                  />
                ) : (
                  <ThemedText style={{ color: theme.colors.primary }}>
                    {language === "en" ? "Ready to Scan..." : "準備掃描..."}
                  </ThemedText>
                )}
              </Pressable>
            </>
          )}
          {manualInput && (
            <Pressable
              onPressIn={(e) => {
                e.stopPropagation();
              }}
              onPress={(e) => {
                e.stopPropagation();
                if (!loading && sku.trim()) {
                  scanProduct();
                }
              }}
              disabled={loading || !sku.trim()}
            >
              <Button
                mode="contained"
                disabled={loading || !sku.trim()}
                style={{
                  justifyContent: "center",
                  opacity: loading || !sku.trim() ? 0.5 : 1,
                }}
                contentStyle={{ height: 56 }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialIcons name="add" size={24} color="#fff" />
                )}
              </Button>
            </Pressable>
          )}
        </View>
      </Card.Content>

      <AppSnackbar
        visible={visible}
        message={message}
        type={type}
        onDismiss={hideSnackbar}
      />
    </Card>
  );
}

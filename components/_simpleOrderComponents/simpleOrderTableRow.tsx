import { useAuthStore } from "@/lib/stores/auth-store";
import { useEffect, useRef, useState } from "react";
import { Animated, TouchableOpacity, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { DataTable, IconButton, TextInput, useTheme } from "react-native-paper";
import { ThemedText } from "../ui/themed";
import SimpleOrderItemDrawer from "./simpleOrderItemDrawer";

export default function SimpleOrderTableRow({
  values,
  product,
  setFieldValue,
  index,
  manualInput,
  setManualInput,
}: {
  values: any;
  product: any;
  setFieldValue: (field: string, value: any) => void;
  index: number;
  manualInput?: boolean;
  setManualInput: (value: boolean) => void;
}) {
  const { user: currentUser } = useAuthStore();
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const swipeableRef = useRef<Swipeable>(null);
  const prevDrawerStateRef = useRef(false);
  const savedManualInputRef = useRef<boolean | null>(null);

  const deleteProduct = (index: number) => {
    const newProducts = [...values.products];
    newProducts.splice(index, 1);
    setFieldValue("products", newProducts);
    // Close the swipeable after delete
    swipeableRef.current?.close();
  };

  const handleRowPress = () => {
    // Close swipeable before opening drawer
    swipeableRef.current?.close();
    setShowDrawer(true);
  };
  
  // Set manual input to true when drawer opens, restore previous state when it closes
  useEffect(() => {
    // Only update if drawer state actually changed
    if (prevDrawerStateRef.current !== showDrawer) {
      const wasOpen = prevDrawerStateRef.current;
      prevDrawerStateRef.current = showDrawer;
      
      if (showDrawer && !wasOpen) {
        // Drawer just opened - save current state before forcing manual input
        savedManualInputRef.current = manualInput ?? false;
        setManualInput(true);
      } else if (!showDrawer && wasOpen) {
        // Drawer just closed - restore previous state
        if (savedManualInputRef.current !== null) {
          setManualInput(savedManualInputRef.current);
          savedManualInputRef.current = null;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDrawer]); // Only depend on showDrawer, read manualInput when needed

  const handleSetShowDrawer = (show: boolean) => {
    setShowDrawer(show);
    // Close swipeable when drawer closes
    if (!show) {
      swipeableRef.current?.close();
    }
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View
        style={{
          width: 80,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View
          style={{
            transform: [{ scale }],
          }}
        >
          <TouchableOpacity
            onPress={() => deleteProduct(index)}
            style={{
              backgroundColor: '#ff3b30',
              justifyContent: 'center',
              alignItems: 'center',
              width: 80,
              height: 60,
              borderRadius: 8,
            }}
          >
            <IconButton
              icon="delete"
              iconColor="#fff"
              size={18}
            />
      
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <>
      <Swipeable 
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        overshootRight={false}
      >
        <View style={{ backgroundColor: theme.colors.surface }}>
          <TouchableOpacity onPress={handleRowPress}>
            <DataTable.Row>
          <DataTable.Cell aria-label="Item Index">
            <ThemedText style={{ fontSize: 10 }}>{index + 1}</ThemedText>
          </DataTable.Cell>

          <DataTable.Cell aria-label="SKU"  numeric>
            <ThemedText style={{ fontSize: 10 }}>{product.sku}</ThemedText>
          </DataTable.Cell>

          <DataTable.Cell aria-label="Quantity"  numeric>
            <ThemedText style={{ fontSize: 10 }}>{product.quantity}</ThemedText>
          </DataTable.Cell>

          <DataTable.Cell aria-label="Unit Price"  numeric>
            {isEditing ? (
              <TextInput
                mode="outlined"
                dense
                keyboardType="numeric"
                placeholder="Price"
                value={product.unitPrice.toString()}
                onChangeText={(text) => {
                  const num = Number(text);
                  setFieldValue(
                    `products.${index}.unitPrice`,
                    isNaN(num) ? 0 : num
                  );
                }}
                className="  h-8 min-w-15"
              />
            ) : (
              <ThemedText style={{ fontSize: 10 }}>
                {product.unitPrice}
              </ThemedText>
            )}
          </DataTable.Cell>

          <DataTable.Cell aria-label="Total Price"  numeric>
            <ThemedText style={{ fontSize: 10 }}>
              {(product.quantity * product.unitPrice).toFixed(2)}
            </ThemedText>
          </DataTable.Cell>
        </DataTable.Row>
          </TouchableOpacity>
        </View>
      </Swipeable>

      {/* Bottom Drawer Section */}
      <SimpleOrderItemDrawer
        showDrawer={showDrawer}
        setShowDrawer={handleSetShowDrawer}
        product={product}
        index={index}
        deleteProduct={deleteProduct}
        setFieldValue={setFieldValue}
      />
    </>
  );
}

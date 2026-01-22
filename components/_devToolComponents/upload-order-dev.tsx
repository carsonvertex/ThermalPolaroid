import { simpleOrderRepository } from "@/endpoints/sqlite/repositories/simple-order-repository";
import { userRepository } from "@/endpoints/sqlite/repositories/user-repository";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useLanguageStore } from "@/lib/stores/language-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Button, IconButton, TextInput, useTheme } from "react-native-paper";
import { ThemedText } from "../ui";

interface UploadOrderDevProps {
  onClose?: () => void;
}

export default function UploadOrderDev({ onClose }: UploadOrderDevProps) {
  const theme = useTheme();
  const { language } = useLanguageStore();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [sampleCount, setSampleCount] = useState("5");

  // Mutation: Reset all orders to pending
  const resetAllMutation = useMutation({
    mutationFn: async () => {
      const allOrders = await simpleOrderRepository.findByPage(1, 10000);
      for (const order of allOrders.orders) {
        // Reset both sync_status to pending and status to completed
        await simpleOrderRepository.update(order.id!, {
          sync_status: "pending",
          status: "completed",
        });
      }
      return allOrders.totalCount;
    },
    onSuccess: (count: number) => {
      queryClient.invalidateQueries({ queryKey: ["pending-upload-orders"] });
      queryClient.invalidateQueries({ queryKey: ["today-sales"] });
      queryClient.invalidateQueries({ queryKey: ["today-sales-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-records"] });
      Alert.alert(
        language === "en" ? "Success" : "成功",
        language === "en"
          ? `${count} orders reset to pending and completed`
          : `${count} 個訂單已重置為待處理和已完成`
      );
    },
    onError: (error: unknown) => {
      Alert.alert(
        language === "en" ? "Error" : "錯誤",
        language === "en" ? `Failed to reset: ${error}` : `重置失敗：${error}`
      );
    },
  });

  // Mutation: Create sample orders
  const createSampleMutation = useMutation({
    mutationFn: async (count: number) => {
      const sampleProducts = [
        {
          sku: "00000288",
          productDetail: "X-Speed MINI-Z MOTOR-V 50T",
          quantity: 1,
          unitPrice: 103,
          model: "MOTOR-V-50T",
        },
        {
          sku: "00000294",
          productDetail: "Parts Wheel Nuts - Kyosho",
          quantity: 2,
          unitPrice: 38,
          model: "WN-KY-001",
        },
        {
          sku: "00000439",
          productDetail: "Alloy Front Bumper (BU)",
          quantity: 1,
          unitPrice: 124,
          model: "BU-AL-001",
        },
        {
          sku: "00000099",
          productDetail: "Mini-X R.Drive shaft",
          quantity: 3,
          unitPrice: 20,
          model: "DS-MX-001",
        },
      ];

      for (let i = 0; i < count; i++) {
        const randomProduct =
          sampleProducts[Math.floor(Math.random() * sampleProducts.length)];
        const productsTotal = randomProduct.quantity * randomProduct.unitPrice;
        const discount = Math.floor(Math.random() * 20); // Random discount 0-20
        const misc = Math.random() < 0.3 ? Math.floor(Math.random() * 10) : 0; // 30% chance of misc fee
        const totalAmount = productsTotal + misc;
        const netAmount = totalAmount - discount;

        const orderData = {
          staff_id: user?.email || "test@example.com",
          timestamp: Date.now() - Math.floor(Math.random() * 86400000), // Random time within last 24h
          products: JSON.stringify([randomProduct]),
          products_total: productsTotal,
          misc: misc,
          total_amount: totalAmount,
          discount: discount,
          net_amount: netAmount,
          net_received: netAmount + Math.floor(Math.random() * 1000), // Random received amount
          change_amount: Math.floor(Math.random() * 1000),
          payment_reference: "",
          status: "completed",
          sync_status: "pending",
        };

        await simpleOrderRepository.create(orderData);
      }

      return count;
    },
    onSuccess: (count: number) => {
      queryClient.invalidateQueries({ queryKey: ["pending-upload-orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-orders"] });
      Alert.alert(
        language === "en" ? "Success" : "成功",
        language === "en"
          ? `${count} sample orders created`
          : `已創建 ${count} 個示例訂單`
      );
      setSampleCount("5"); // Reset to default
    },
    onError: (error: unknown) => {
      Alert.alert(
        language === "en" ? "Error" : "錯誤",
        language === "en"
          ? `Failed to create orders: ${error}`
          : `創建訂單失敗：${error}`
      );
    },
  });

  // Mutation: Delete all orders
  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const allOrders = await simpleOrderRepository.findByPage(1, 10000);
      for (const order of allOrders.orders) {
        await simpleOrderRepository.delete(order.id!);
      }
      return allOrders.totalCount;
    },
    onSuccess: (count: number) => {
      queryClient.invalidateQueries({ queryKey: ["pending-upload-orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-records"] });
      Alert.alert(
        language === "en" ? "Success" : "成功",
        language === "en" ? `${count} orders deleted` : `已刪除 ${count} 個訂單`
      );
    },
    onError: (error: unknown) => {
      Alert.alert(
        language === "en" ? "Error" : "錯誤",
        language === "en"
          ? `Failed to delete orders: ${error}`
          : `刪除訂單失敗：${error}`
      );
    },
  });

  const handleResetAllToPending = () => {
    Alert.alert(
      language === "en" ? "Reset Sync Status Pending" : "重置同步狀態為待處理",
      language === "en"
        ? "Set all orders to 'pending' for testing?"
        : "將所有訂單設置為「待處理」以進行測試？",
      [
        { text: language === "en" ? "Cancel" : "取消", style: "cancel" },
        {
          text: language === "en" ? "Reset" : "重置",
          style: "destructive",
          onPress: () => resetAllMutation.mutate(),
        },
      ]
    );
  };

  const handleCreateSample = () => {
    const count = parseInt(sampleCount) || 0;
    if (count < 1 || count > 1000) {
      Alert.alert(
        language === "en" ? "Invalid Number" : "無效數字",
        language === "en"
          ? "Please enter a number between 1 and 1000"
          : "請輸入 1 到 1000 之間的數字"
      );
      return;
    }

    Alert.alert(
      language === "en" ? "Create Sample Orders" : "創建示例訂單",
      language === "en"
        ? `Create ${count} sample pending orders?`
        : `創建 ${count} 個待處理示例訂單？`,
      [
        { text: language === "en" ? "Cancel" : "取消", style: "cancel" },
        {
          text: language === "en" ? "Create" : "創建",
          onPress: () => createSampleMutation.mutate(count),
        },
      ]
    );
  };

  const handleDeleteAll = () => {
    Alert.alert(
      language === "en" ? "Delete All Orders" : "刪除所有訂單",
      language === "en"
        ? "⚠️ This will permanently delete ALL orders from the database. Are you sure?"
        : "⚠️ 這將永久刪除資料庫中的所有訂單。您確定嗎？",
      [
        { text: language === "en" ? "Cancel" : "取消", style: "cancel" },
        {
          text: language === "en" ? "Delete All" : "刪除全部",
          style: "destructive",
          onPress: () => deleteAllMutation.mutate(),
        },
      ]
    );
  };

  const handleShowUsers = async () => {
    try {
      const allUsers = await userRepository.findAll();
      const userList = allUsers.map(u => 
        `${u.email} (${u.role}) - Active: ${u.is_active === 1 ? 'Yes' : 'No'}\nHash: ${u.password_hash}`
      ).join('\n\n');
      
      Alert.alert(
        language === "en" ? "Users in Database" : "資料庫中的用戶",
        userList || "No users found",
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert("Error", `Failed to fetch users: ${error}`);
    }
  };

  const isRefreshing =
    resetAllMutation.isPending ||
    createSampleMutation.isPending ||
    deleteAllMutation.isPending;

  return (
    <ScrollView style={{ maxHeight: 600 }}>
      <View>
        {/* Header with Close Button */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <ThemedText style={{ fontSize: 20, fontWeight: "bold" }}>
            {language === "en" ? "Development Tools" : "開發工具"}
          </ThemedText>
          {onClose && (
            <IconButton
              icon="close"
              size={24}
              onPress={onClose}
              style={{ margin: 0 }}
            />
          )}
        </View>

        <View
          style={{
            backgroundColor: theme.colors.errorContainer,
            padding: 16,
            borderRadius: 8,
          }}
        >

            {/* Reset All Section */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <ThemedText style={{ fontSize: 11, opacity: 0.7 }}>
                {language === "en" ? "Reset sync status to pending" : "重置同步狀態為待處理"}
              </ThemedText>
              <Button
                mode="outlined"
                onPress={handleResetAllToPending}
                icon="refresh"
                compact
                style={{ borderColor: theme.colors.error }}
                textColor={theme.colors.error}
                contentStyle={{ height: 36 }}
                labelStyle={{ fontSize: 11 }}
                disabled={isRefreshing}
              >
                {language === "en" ? "Reset All to Pending" : "全部重置為待處理"}
              </Button>
            </View>

            {/* Create Sample Orders Section */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <ThemedText style={{ fontSize: 11, opacity: 0.7 }}>
                {language === "en" ? "Create Orders:" : "創建訂單："}
              </ThemedText>
              <TextInput
                mode="outlined"
                value={sampleCount}
                onChangeText={(text) => {
                  // Only allow numbers
                  const numericValue = text.replace(/[^0-9]/g, "");
                  setSampleCount(numericValue);
                }}
                keyboardType="number-pad"
                style={{
                  width: 70,
                  height: 36,
                }}
                contentStyle={{ paddingVertical: 0 }}
                outlineStyle={{ borderRadius: 6 }}
                dense
                disabled={isRefreshing}
              />
              <Button
                mode="contained"
                onPress={handleCreateSample}
                icon="plus"
                compact
                contentStyle={{ height: 36 }}
                labelStyle={{ fontSize: 11 }}
                disabled={isRefreshing || !sampleCount}
                style={{ flex: 1 }}
              >
                {language === "en" ? "Create Sample Orders" : "創建示例訂單"}
              </Button>
            </View>

            {/* Delete All Section */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <ThemedText style={{ fontSize: 11, opacity: 0.7 }}>
                {language === "en" ? "⚠️ Delete All Orders" : "⚠️ 刪除所有訂單"}
              </ThemedText>
              <Button
                mode="contained"
                onPress={handleDeleteAll}
                icon="delete"
                compact
                buttonColor={theme.colors.error}
                contentStyle={{ height: 36 }}
                labelStyle={{ fontSize: 11 }}
                disabled={isRefreshing}
              >
                {language === "en" ? "Delete All Orders" : "刪除所有訂單"}
              </Button>
            </View>

            {/* Debug: Show Users Section */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <ThemedText style={{ fontSize: 11, opacity: 0.7 }}>
                {language === "en" ? "🔍 Debug" : "🔍 調試"}
              </ThemedText>
              <Button
                mode="outlined"
                onPress={handleShowUsers}
                icon="account-multiple"
                compact
                contentStyle={{ height: 36 }}
                labelStyle={{ fontSize: 11 }}
              >
                {language === "en" ? "Show Users" : "顯示用戶"}
              </Button>
            </View>
          </View>
        </View>
    </ScrollView>
  );
}

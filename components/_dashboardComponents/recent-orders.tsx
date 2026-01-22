import { useLanguageStore } from "@/lib/stores/language-store";
import { MaterialIcons } from "@expo/vector-icons";
import { View } from "react-native";
import { Card, useTheme } from "react-native-paper";
import { ThemedText } from "../ui";

export function RecentOrders({ orders }: { orders: any[] }) {
  const theme = useTheme();
  const { language } = useLanguageStore();
  
  // Filter out void orders
  const nonVoidOrders = orders.filter((order) => order.status !== "voided");
  
  return (
    <Card
      style={{
        backgroundColor: theme.colors.surface,
      }}
      elevation={2}
    >
      <Card.Content className="p-4">
        <View className="flex-row justify-between items-center mb-4">
          <ThemedText className="text-xl font-bold">
            {language === "en" ? "Recent Orders" : "最近訂單"}
          </ThemedText>
          {/* <ThemedText className="text-sm text-primary">
            {language === "en" ? "View All" : "查看全部"}
          </ThemedText> */}
        </View>
        {nonVoidOrders.slice(0, 5).map((order, index: number) => (
          <View
            key={order.id}
            className="flex-row justify-between items-center py-3 border-b border-outline"
          >
            <View className="flex-1">
              <ThemedText className="font-semibold mb-2">
                Order #{order.id}
              </ThemedText>
              <ThemedText className="text-sm opacity-70">
                {new Date(order.timestamp).toLocaleDateString()} -{" "}
                {new Date(order.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </ThemedText>
            </View>
            <ThemedText className="text-lg font-bold text-primary">
              ${order.net_amount.toFixed(2)}
            </ThemedText>
          </View>
        ))}

        {nonVoidOrders.length === 0 && (
          <View className="items-center py-8">
            <MaterialIcons
              name="receipt"
              size={48}
              color={theme.colors.outline}
            />
            <ThemedText className="mt-4 text-center text-sm opacity-70">
              {language === "en"
                ? "No orders yet. Create your first order!"
                : "尚無訂單。創建您的第一個訂單！"}
            </ThemedText>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

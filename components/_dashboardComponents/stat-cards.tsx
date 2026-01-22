import { useRouter } from "expo-router";
import { View } from "react-native";
import { StatCard } from "./stat-card";

export function StatCards({
  stats,
  language,
}: {
  stats: any;
  language: string;
}) {
  const router = useRouter();
  return (
    <>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
        <View style={{ flex: 1 }}>
          <StatCard
            title={language === "en" ? "Total Sales" : "總銷售額"}
            value={`$${stats.totalSales.toFixed(2)}`}
            icon="attach-money"
            color="#4CAF50"
            onPress={() => {}}
          />
        </View>
        <View style={{ flex: 1 }}>
          <StatCard
    
            title={language === "en" ? "Today's Sales" : "今日銷售額"}
            value={`$${stats.todaySales.toFixed(2)}`}
            icon="today"
            color="#2196F3"
            onPress={() => {
              router.push("/(tabs)/today-sales");
            }}
          />
        </View>
      </View>

      {/* Row 2 */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <StatCard
            title={language === "en" ? "Total Orders" : "總訂單數"}
            value={stats.totalOrders.toString()}
            icon="receipt"
            color="#FF9800"
            onPress={() => {}}
          />
        </View>
        <View style={{ flex: 1 }}>
          <StatCard
            title={language === "en" ? "Average Order" : "平均訂單"}
            value={`$${stats.averageOrder.toFixed(2)}`}
            icon="trending-up"
            color="#9C27B0"
            onPress={() => {}}
          />
        </View>
      </View>
    </>
  );
}

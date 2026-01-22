import { MaterialIcons } from "@expo/vector-icons";
import { View } from "react-native";
import { Card, useTheme } from "react-native-paper";
import { ThemedText } from "../ui";

export function StatCard({
  title,
  value,
  icon,
  color,
  onPress,
}: {
  title: string;
  value: string;
  icon: string;
  color: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Card
      className="cursor-pointer"
      style={{
        backgroundColor: theme.colors.surface,
      }}
      elevation={2}
      onPress={onPress}
    >
      <Card.Content className="p-4">
        <View className="flex-col justify-between items-start">
          <View className="flex-row items-center gap-2 ">
            <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
              {title}
            </ThemedText>

            <View
              style={{
                backgroundColor: color,
                padding: 4,
                borderRadius: 4,
              }}
            >
              <MaterialIcons name={icon as any} size={12} color="#fff" />
            </View>
          </View>

          <ThemedText className="text-2xl font-bold">{value}</ThemedText>
        </View>
      </Card.Content>
    </Card>
  );
}

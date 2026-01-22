import { userRepository } from "@/endpoints/sqlite/repositories/user-repository";
import { User } from "@/endpoints/sqlite/schema";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useLanguageStore } from "@/lib/stores/language-store";
import { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { useTheme } from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";
import { ThemedText } from "../ui";

interface StaffSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export default function StaffSelector({
  value,
  onValueChange,
  disabled = false,
}: StaffSelectorProps) {
  const { language } = useLanguageStore();
  const { user: currentUser } = useAuthStore();
  const theme = useTheme();
  const [staffList, setStaffList] = useState<
    { label: string; value: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Load users from database
  useEffect(() => {
    loadStaffFromDatabase();
  }, [currentUser]);

  const loadStaffFromDatabase = async () => {
    if (Platform.OS === "web") {
      // For web, use mock data based on user role
      const allStaff = [
        {
          label: "Admin (admin@pos.com)",
          value: "admin@pos.com",
          role: "admin",
        },
        {
          label: "Manager (manager@pos.com)",
          value: "manager@pos.com",
          role: "manager",
        },
        {
          label: "Cashier (cashier@pos.com)",
          value: "cashier@pos.com",
          role: "cashier",
        },
      ];

      // Filter based on role
      const filteredStaff =
        currentUser?.role === "cashier"
          ? allStaff.filter((s) => s.role === "cashier")
          : allStaff;

      setStaffList(filteredStaff.map(({ label, value }) => ({ label, value })));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Get all active users from the database
      const users = await userRepository.findAll();

      // Filter active users
      let filteredUsers = users.filter((user: User) => user.is_active === 1);

      // Role-based filtering: Cashiers can only select cashiers
      // Managers and Admins can select anyone
      if (currentUser?.role === "cashier") {
        filteredUsers = filteredUsers.filter(
          (user: User) => user.role === "cashier"
        );
      }

      // Format for dropdown and sort
      const formattedUsers = filteredUsers
        .map((user: User) => ({
          label: `${user.name} (${user.email})`,
          value: user.email,
        }))
        .sort((a: { label: string }, b: { label: string }) =>
          a.label.localeCompare(b.label)
        );

      setStaffList(formattedUsers);
    } catch (error) {
      console.error("❌ Error loading staff from database:", error);
      // Fallback to empty list
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ThemedText
        style={{
          fontSize: 14,
          fontWeight: "600",
          marginBottom: 8,
        }}
      >
        {language === "en" ? "Staff Information" : "員工信息"}
      </ThemedText>
      <View style={{ width: "100%" }}>
        {loading ? (
          <View
            style={{
              padding: 12,
              backgroundColor: theme.colors.surfaceVariant,
              borderRadius: 6,
            }}
          >
            <ThemedText
              style={{ textAlign: "center", opacity: 0.7, fontSize: 13 }}
            >
              {language === "en" ? "Loading staff..." : "加載員工中..."}
            </ThemedText>
          </View>
        ) : (
          <View
            style={{
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <Dropdown
              label={language === "en" ? "Select Staff" : "選擇員工"}
              placeholder={
                language === "en" ? "Select a staff member" : "選擇員工"
              }
              options={staffList}
              value={value}
              onSelect={(val) => val && onValueChange(val)}
              disabled={disabled}
              mode="outlined"
            />
          </View>
        )}
      </View>
    </>
  );
}

import { ThemedText, ThemedView } from "@/components/ui";
import { userRepository } from "@/endpoints/sqlite/repositories";
import { User } from "@/endpoints/sqlite/schema";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useLanguageStore } from "@/lib/stores/language-store";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, Card, Modal, TextInput as PaperInput, Portal, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AccountsScreen() {
  const theme = useTheme();
  const { language } = useLanguageStore();
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  // Calculate tab bar height: paddingTop(8) + icon(28) + text margin(4) + text(~14) + padding(8) + safe area
  const TAB_BAR_HEIGHT = 8 + 28 + 4 + 14 + 8 + insets.bottom;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    role: "cashier" as User["role"],
  });

  // Check if user is admin or developer - only admins/developers can access this page
  if (currentUser?.role !== "admin" && currentUser?.role !== "developer") {
    return (
      <ThemedView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 32,
          }}
        >
          <View
            style={{
              backgroundColor: theme.colors.errorContainer,
              padding: 20,
              borderRadius: 50,
              marginBottom: 24,
            }}
          >
            <MaterialIcons name="lock" size={64} color={theme.colors.error} />
          </View>
          <ThemedText
            style={{
              fontSize: 24,
              fontWeight: "bold",
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            {language === "en" ? "Access Denied" : "訪問被拒絕"}
          </ThemedText>
          <ThemedText
            style={{
              fontSize: 16,
              opacity: 0.7,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            {language === "en"
              ? "You do not have permission to access this page."
              : "您沒有權限訪問此頁面。"}
          </ThemedText>
          <ThemedText
            style={{
              fontSize: 14,
              opacity: 0.5,
              textAlign: "center",
            }}
          >
            {language === "en"
              ? "Only administrators can manage user accounts."
              : "只有管理員才能管理用戶帳戶。"}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  // Fetch all users
  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const allUsers = await userRepository.findAll();
      return allUsers;
    },
  });

  // Helper: Check if there's only one active admin
  const getActiveAdminCount = () => {
    return users.filter((u) => u.role === "admin" && u.is_active === 1).length;
  };

  // Helper: Check if user is the last active admin
  const isLastActiveAdmin = (user: User) => {
    return user.role === "admin" && user.is_active === 1 && getActiveAdminCount() === 1;
  };

  // Helper: Check if there's only one active developer
  const getActiveDeveloperCount = () => {
    return users.filter((u) => u.role === "developer" && u.is_active === 1).length;
  };

  // Helper: Check if user is the last active developer
  const isLastActiveDeveloper = (user: User) => {
    return user.role === "developer" && user.is_active === 1 && getActiveDeveloperCount() === 1;
  };

  const resetForm = () => {
    setFormData({
      email: "",
      name: "",
      password: "",
      role: "cashier",
    });
  };

  const handleAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEdit = (user: User) => {
    // Prevent admins from editing developer accounts
    if (user.role === "developer" && currentUser?.role !== "developer") {
      Alert.alert(
        language === "en" ? "Access Denied" : "拒絕訪問",
        language === "en"
          ? "Only developers can edit developer accounts."
          : "只有開發者可以編輯開發者帳戶。"
      );
      return;
    }

    setSelectedUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      password: "",
      role: user.role,
    });
    setShowEditModal(true);
  };

  const handleSaveNew = async () => {
    if (!formData.email.trim() || !formData.name.trim() || !formData.password.trim()) {
      Alert.alert(
        "Error",
        language === "en" ? "Please fill in all fields" : "請填寫所有欄位"
      );
      return;
    }

    // Prevent admins from creating developer accounts
    if (formData.role === "developer" && currentUser?.role !== "developer") {
      Alert.alert(
        language === "en" ? "Access Denied" : "拒絕訪問",
        language === "en"
          ? "Only developers can create developer accounts."
          : "只有開發者可以創建開發者帳戶。"
      );
      return;
    }

    try {
      const hashedPassword = userRepository.hashPassword(formData.password);
      
      // Create user in backend pos_system database
      interface BackendUserResponse {
        success: boolean;
        data: {
          id: number;
          email: string;
          name: string;
          passwordHash: string;
          role: string;
          isActive: boolean;
        };
        message?: string;
      }
      
      const backendUser = {
        email: formData.email.trim(),
        name: formData.name.trim(),
        passwordHash: hashedPassword,
        role: formData.role,
        isActive: true,
      };
      
      const backendResponse = await apiClient.post<BackendUserResponse>('/pos/users', backendUser);
      
      if (!backendResponse.success || !backendResponse.data) {
        throw new Error(backendResponse.message || 'Failed to create user in backend');
      }
      
      // Create user in local SQLite database with backend_user_id
      const userId = await userRepository.create({
        backend_user_id: backendResponse.data.id,
        email: formData.email.trim(),
        name: formData.name.trim(),
        password_hash: hashedPassword,
        role: formData.role,
        is_active: 1,
      });

      Alert.alert(
        "Success",
        language === "en" ? "User created successfully!" : "用戶創建成功！"
      );
      setShowAddModal(false);
      resetForm();

      // Refetch to get the newly created user with all database fields
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (error) {
      console.error('Error creating user:', error);
      Alert.alert(
        "Error",
        language === "en"
          ? `Failed to create user: ${error instanceof Error ? error.message : String(error)}`
          : `創建用戶失敗: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    if (!formData.name.trim()) {
      Alert.alert(
        "Error",
        language === "en" ? "Please enter a name" : "請輸入名稱"
      );
      return;
    }

    // Check if trying to change the last active admin's role
    if (
      selectedUser.role === "admin" &&
      formData.role !== "admin" &&
      getActiveAdminCount() === 1
    ) {
      Alert.alert(
        "Error",
        language === "en"
          ? "Cannot change role. At least one admin account must remain."
          : "無法更改角色。必須保留至少一個管理員帳戶。"
      );
      return;
    }

    // Check if trying to change the last active developer's role
    if (
      selectedUser.role === "developer" &&
      formData.role !== "developer" &&
      getActiveDeveloperCount() === 1
    ) {
      Alert.alert(
        "Error",
        language === "en"
          ? "Cannot change role. At least one developer account must remain."
          : "無法更改角色。必須保留至少一個開發者帳戶。"
      );
      return;
    }

    // Prevent admins from changing any user's role TO developer
    if (formData.role === "developer" && currentUser?.role !== "developer") {
      Alert.alert(
        language === "en" ? "Access Denied" : "拒絕訪問",
        language === "en"
          ? "Only developers can assign developer role."
          : "只有開發者可以分配開發者角色。"
      );
      return;
    }

    try {
      const updateData: any = {
        name: formData.name.trim(),
        role: formData.role,
      };

      // Only update password if a new one is provided
      if (formData.password.trim()) {
        updateData.password_hash = userRepository.hashPassword(formData.password);
      }

      // Update user in backend pos_system database
      interface BackendUserResponse {
        success: boolean;
        data: {
          id: number;
          email: string;
          name: string;
          passwordHash?: string;
          role: string;
          isActive: boolean;
        };
        message?: string;
      }
      
      // Check if we have backend_user_id stored
      if (!selectedUser.backend_user_id) {
        throw new Error('Backend user ID not found. Please re-sync users from backend.');
      }
      
      const backendUpdateData: any = {
        name: formData.name.trim(),
        role: formData.role,
      };
      
      if (formData.password.trim()) {
        backendUpdateData.passwordHash = updateData.password_hash;
      }
      
      const backendResponse = await apiClient.put<BackendUserResponse>(
        `/pos/users/${selectedUser.backend_user_id}`,
        backendUpdateData
      );
      
      if (!backendResponse.success || !backendResponse.data) {
        throw new Error(backendResponse.message || 'Failed to update user in backend');
      }

      // Update user in local SQLite database with data from backend response
      const sqliteUpdateData: any = {
        name: backendResponse.data.name,
        role: backendResponse.data.role,
      };
      
      // Only update password if it was changed
      if (formData.password.trim()) {
        sqliteUpdateData.password_hash = updateData.password_hash;
      }
      
      // Ensure backend_user_id is preserved
      if (selectedUser.backend_user_id) {
        sqliteUpdateData.backend_user_id = selectedUser.backend_user_id;
      }
      
      await userRepository.update(selectedUser.id, sqliteUpdateData);

      // Immediately update the UI optimistically with backend response data
      queryClient.setQueryData(["users"], (oldUsers: User[] | undefined) => {
        if (!oldUsers) return oldUsers;
        return oldUsers.map((u) =>
          u.id === selectedUser.id
            ? { 
                ...u, 
                ...sqliteUpdateData, 
                name: backendResponse.data.name,
                role: backendResponse.data.role,
                updated_at: new Date().toISOString() 
              }
            : u
        );
      });

      Alert.alert(
        "Success",
        language === "en" ? "User updated successfully!" : "用戶更新成功！"
      );
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();

      // Refetch to ensure data is in sync
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert(
        "Error",
        language === "en"
          ? `Failed to update user: ${error instanceof Error ? error.message : String(error)}`
          : `更新用戶失敗: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  const handleToggleActive = async (user: User) => {
    // Prevent admins from toggling developer accounts
    if (user.role === "developer" && currentUser?.role !== "developer") {
      Alert.alert(
        language === "en" ? "Access Denied" : "拒絕訪問",
        language === "en"
          ? "Only developers can manage developer accounts."
          : "只有開發者可以管理開發者帳戶。"
      );
      return;
    }

    // Prevent deactivating the last active admin
    if (user.role === "admin" && user.is_active === 1 && getActiveAdminCount() === 1) {
      Alert.alert(
        "Error",
        language === "en"
          ? "Cannot deactivate admin accounts. At least one admin must remain active."
          : "無法停用管理員帳戶。必須保留至少一個啟用的管理員。"
      );
      return;
    }

    // Prevent deactivating the last active developer
    if (user.role === "developer" && user.is_active === 1 && getActiveDeveloperCount() === 1) {
      Alert.alert(
        "Error",
        language === "en"
          ? "Cannot deactivate developer accounts. At least one developer must remain active."
          : "無法停用開發者帳戶。必須保留至少一個啟用的開發者。"
      );
      return;
    }

    // Prevent deactivating yourself
    if (user.id === currentUser?.id) {
      Alert.alert(
        "Error",
        language === "en"
          ? "You cannot deactivate your own account"
          : "您無法停用自己的帳戶"
      );
      return;
    }

    try {
      const newStatus = user.is_active === 1 ? 0 : 1;

      // Update user status in backend pos_system database
      interface BackendUserResponse {
        success: boolean;
        data: {
          id: number;
          email: string;
          name: string;
          role: string;
          isActive: boolean;
        };
        message?: string;
      }
      
      // Check if we have backend_user_id stored
      if (!user.backend_user_id) {
        throw new Error('Backend user ID not found. Please re-sync users from backend.');
      }
      
      const backendResponse = await apiClient.patch<BackendUserResponse>(
        `/pos/users/${user.backend_user_id}/status?isActive=${newStatus === 1}`
      );
      
      if (!backendResponse.success || !backendResponse.data) {
        throw new Error(backendResponse.message || 'Failed to update user status in backend');
      }

      // Update user status in local SQLite database with data from backend response
      const sqliteUpdateData: any = {
        is_active: backendResponse.data.isActive ? 1 : 0,
      };
      
      // Preserve backend_user_id
      if (user.backend_user_id) {
        sqliteUpdateData.backend_user_id = user.backend_user_id;
      }
      
      // Update SQLite with the exact data from backend to ensure sync
      await userRepository.update(user.id, sqliteUpdateData);

      // Immediately update the UI optimistically with backend response data
      queryClient.setQueryData(["users"], (oldUsers: User[] | undefined) => {
        if (!oldUsers) return oldUsers;
        return oldUsers.map((u) =>
          u.id === user.id
            ? { 
                ...u, 
                ...sqliteUpdateData, 
                is_active: backendResponse.data.isActive ? 1 : 0,
                updated_at: new Date().toISOString() 
              }
            : u
        );
      });

      Alert.alert(
        "Success",
        language === "en"
          ? user.is_active === 1
            ? "User deactivated"
            : "User activated"
          : user.is_active === 1
          ? "用戶已停用"
          : "用戶已啟用"
      );

      // Refetch to ensure data is in sync
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (error) {
      console.error('Error toggling user status:', error);
      Alert.alert(
        "Error",
        `Failed to toggle user status: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  const getRoleColor = (role: User["role"]) => {
    switch (role) {
      case "admin":
        return "#F44336";
      case "manager":
        return "#FF9800";
      case "cashier":
        return "#4CAF50";
      case "developer":
        return "#9C27B0"; // Purple for developer
      default:
        return theme.colors.primary;
    }
  };

  const getRoleLabel = (role: User["role"]) => {
    if (language === "en") {
      return role.charAt(0).toUpperCase() + role.slice(1);
    }
    switch (role) {
      case "admin":
        return "管理員";
      case "manager":
        return "經理";
      case "cashier":
        return "收銀員";
      case "developer":
        return "開發者";
      default:
        return role;
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ThemedView style={{ flex: 1 }}>
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 16 }}
        >
        <View style={{ padding: 16 }}>
          {/* Header */}
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <View style={{ flex: 1 }}>
                <ThemedText
                  style={{
                    fontSize: 28,
                    fontWeight: "bold",
                    marginBottom: 4,
                  }}
                >
                  {language === "en" ? "Accounts" : "帳戶"}
                </ThemedText>
                <ThemedText style={{ fontSize: 14, opacity: 0.7 }}>
                  {language === "en"
                    ? "Manage user accounts and permissions"
                    : "管理用戶帳戶和權限"}
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={handleAdd}
                style={{
                  backgroundColor: theme.colors.primary,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <MaterialIcons name="person-add" size={20} color="#fff" />
                <ThemedText
                  style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}
                >
                  {language === "en" ? "Add User" : "新增用戶"}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Users List */}
          {isLoading ? (
            <Card
              style={{
                backgroundColor: theme.colors.surface,
                padding: 32,
              }}
              elevation={2}
            >
              <ThemedText style={{ textAlign: "center", opacity: 0.7 }}>
                {language === "en" ? "Loading users..." : "載入用戶中..."}
              </ThemedText>
            </Card>
          ) : users.length === 0 ? (
            <Card
              style={{
                backgroundColor: theme.colors.surface,
                padding: 32,
              }}
              elevation={2}
            >
              <View style={{ alignItems: "center" }}>
                <MaterialIcons
                  name="person-outline"
                  size={64}
                  color={theme.colors.outline}
                />
                <ThemedText
                  style={{ marginTop: 16, opacity: 0.7, textAlign: "center" }}
                >
                  {language === "en"
                    ? "No users found. Add your first user!"
                    : "未找到用戶。新增您的第一個用戶！"}
                </ThemedText>
              </View>
            </Card>
          ) : (
            users.map((user) => (
              <Card
                key={user.id}
                style={{
                  marginBottom: 12,
                  backgroundColor: theme.colors.surface,
                }}
                elevation={2}
              >
                <Card.Content style={{ padding: 16 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <ThemedText
                          style={{ fontSize: 18, fontWeight: "600" }}
                        >
                          {user.name}
                        </ThemedText>
                        {user.is_active === 0 && (
                          <View
                            style={{
                              backgroundColor: theme.colors.errorContainer,
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 4,
                              marginLeft: 8,
                            }}
                          >
                            <ThemedText
                              style={{
                                fontSize: 10,
                                color: theme.colors.error,
                                fontWeight: "600",
                              }}
                            >
                              {language === "en" ? "INACTIVE" : "停用"}
                            </ThemedText>
                          </View>
                        )}
                      </View>
                      <ThemedText
                        style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}
                      >
                        {user.email}
                      </ThemedText>
                      <View
                        style={{
                          backgroundColor: getRoleColor(user.role) + "20",
                          paddingHorizontal: 12,
                          paddingVertical: 4,
                          borderRadius: 12,
                          alignSelf: "flex-start",
                        }}
                      >
                        <ThemedText
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: getRoleColor(user.role),
                          }}
                        >
                          {getRoleLabel(user.role)}
                        </ThemedText>
                      </View>
                    </View>
                    {/* Only show edit/toggle buttons if not a developer account, or if current user is developer */}
                    {(user.role !== "developer" || currentUser?.role === "developer") && (
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => handleEdit(user)}
                          style={{
                            backgroundColor: theme.colors.primaryContainer,
                            padding: 10,
                            borderRadius: 8,
                          }}
                        >
                          <MaterialIcons
                            name="edit"
                            size={20}
                            color={theme.colors.primary}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleToggleActive(user)}
                          style={{
                            backgroundColor:
                              user.is_active === 1
                                ? theme.colors.errorContainer
                                : theme.colors.primaryContainer,
                            padding: 10,
                            borderRadius: 8,
                            opacity:
                              isLastActiveAdmin(user) ||
                              isLastActiveDeveloper(user) ||
                              user.id === currentUser?.id
                                ? 0.3
                                : 1,
                          }}
                          disabled={
                            user.id === currentUser?.id ||
                            isLastActiveAdmin(user) ||
                            isLastActiveDeveloper(user)
                          }
                        >
                          <MaterialIcons
                            name={user.is_active === 1 ? "block" : "check-circle"}
                            size={20}
                            color={
                              user.is_active === 1
                                ? theme.colors.error
                                : theme.colors.primary
                            }
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add User Modal */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => {
            setShowAddModal(false);
            resetForm();
          }}
          contentContainerStyle={{
            backgroundColor: theme.colors.surface,
            padding: 24,
            marginHorizontal: 20,
            borderRadius: 12,
          }}
        >
          <ThemedText style={{ fontSize: 20, fontWeight: "bold", marginBottom: 20 }}>
            {language === "en" ? "Add New User" : "新增用戶"}
          </ThemedText>

          <PaperInput
            mode="outlined"
            label={language === "en" ? "Email" : "電子郵件"}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            style={{ marginBottom: 16, backgroundColor: theme.colors.surface }}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <PaperInput
            mode="outlined"
            label={language === "en" ? "Name" : "姓名"}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            style={{ marginBottom: 16, backgroundColor: theme.colors.surface }}
          />

          <PaperInput
            mode="outlined"
            label={language === "en" ? "Password" : "密碼"}
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            secureTextEntry
            style={{ marginBottom: 16, backgroundColor: theme.colors.surface }}
          />

          <ThemedText style={{ fontSize: 14, marginBottom: 8, fontWeight: "600" }}>
            {language === "en" ? "Role" : "角色"}
          </ThemedText>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
            {(["admin", "manager", "cashier", "developer"] as User["role"][])
              .filter(role => currentUser?.role === "developer" || role !== "developer")
              .map((role) => (
              <TouchableOpacity
                key={role}
                onPress={() => setFormData({ ...formData, role })}
                style={{
                  flex: 1,
                  backgroundColor:
                    formData.role === role
                      ? getRoleColor(role)
                      : theme.colors.surfaceVariant,
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <ThemedText
                  style={{
                    color: formData.role === role ? "#fff" : theme.colors.onSurface,
                    fontWeight: "600",
                    fontSize: 12,
                  }}
                >
                  {getRoleLabel(role)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <Button
              mode="outlined"
              onPress={() => {
                setShowAddModal(false);
                resetForm();
              }}
              style={{ flex: 1 }}
            >
              {language === "en" ? "Cancel" : "取消"}
            </Button>
            <Button mode="contained" onPress={handleSaveNew} style={{ flex: 1 }}>
              {language === "en" ? "Save" : "保存"}
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Edit User Modal */}
      <Portal>
        <Modal
          visible={showEditModal}
          onDismiss={() => {
            setShowEditModal(false);
            setSelectedUser(null);
            resetForm();
          }}
          contentContainerStyle={{
            backgroundColor: theme.colors.surface,
            padding: 24,
            marginHorizontal: 20,
            borderRadius: 12,
          }}
        >
          <ThemedText style={{ fontSize: 20, fontWeight: "bold", marginBottom: 20 }}>
            {language === "en" ? "Edit User" : "編輯用戶"}
          </ThemedText>

          <PaperInput
            mode="outlined"
            label={language === "en" ? "Email" : "電子郵件"}
            value={formData.email}
            disabled
            style={{ marginBottom: 16, backgroundColor: theme.colors.surfaceVariant }}
          />

          <PaperInput
            mode="outlined"
            label={language === "en" ? "Name" : "姓名"}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            style={{ marginBottom: 16, backgroundColor: theme.colors.surface }}
          />

          <PaperInput
            mode="outlined"
            label={
              language === "en"
                ? "New Password (leave empty to keep current)"
                : "新密碼 (留空以保持現有密碼)"
            }
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            secureTextEntry
            style={{ marginBottom: 16, backgroundColor: theme.colors.surface }}
          />

          <ThemedText style={{ fontSize: 14, marginBottom: 8, fontWeight: "600" }}>
            {language === "en" ? "Role" : "角色"}
          </ThemedText>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
            {(["admin", "manager", "cashier", "developer"] as User["role"][])
              .filter(role => currentUser?.role === "developer" || role !== "developer")
              .map((role) => (
              <TouchableOpacity
                key={role}
                onPress={() => setFormData({ ...formData, role })}
                style={{
                  flex: 1,
                  backgroundColor:
                    formData.role === role
                      ? getRoleColor(role)
                      : theme.colors.surfaceVariant,
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <ThemedText
                  style={{
                    color: formData.role === role ? "#fff" : theme.colors.onSurface,
                    fontWeight: "600",
                    fontSize: 12,
                  }}
                >
                  {getRoleLabel(role)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <Button
              mode="outlined"
              onPress={() => {
                setShowEditModal(false);
                setSelectedUser(null);
                resetForm();
              }}
              style={{ flex: 1 }}
            >
              {language === "en" ? "Cancel" : "取消"}
            </Button>
            <Button mode="contained" onPress={handleSaveEdit} style={{ flex: 1 }}>
              {language === "en" ? "Save" : "保存"}
            </Button>
          </View>
        </Modal>
      </Portal>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

import { ThemedText } from "@/components/ui";
import { resetDatabase } from "@/endpoints/sqlite";
import { exampleRepository } from "@/endpoints/sqlite/repositories";
import { useAuthStore } from "@/lib/stores/auth-store";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { TextInput } from "react-native-paper";

interface ExampleItem {
  id: number;
  title: string;
  description: string | null;
  completed: number;
  created_at: string;
  updated_at: string;
}

 function ExampleScreen() {
  const [items, setItems] = useState<ExampleItem[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    console.log("📱 Example screen loaded");
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      console.log("🔄 Loading items from database...");

      const allItems = await exampleRepository.findAll();
      console.log("✅ Loaded", allItems.length, "items");
      setItems(allItems);
    } catch (error) {
      console.error("❌ Error loading items:", error);
      console.error("❌ Full error:", JSON.stringify(error, null, 2));
      Alert.alert(
        "Error",
        `Failed to load items: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddItem = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }

    try {
      await exampleRepository.create({
        title: title.trim(),
        description: description.trim() || null,
        completed: 0,
      });
      setTitle("");
      setDescription("");
      loadItems();
    } catch (error) {
      console.error("Error adding item:", error);
      Alert.alert("Error", "Failed to add item");
    }
  };

  const handleUpdateItem = async () => {
    if (!title.trim() || editingId === null) {
      Alert.alert("Error", "Please enter a title");
      return;
    }

    try {
      await exampleRepository.update(editingId, {
        title: title.trim(),
        description: description.trim() || null,
      });
      setTitle("");
      setDescription("");
      setEditingId(null);
      loadItems();
    } catch (error) {
      console.error("Error updating item:", error);
      Alert.alert("Error", "Failed to update item");
    }
  };

  const handleDeleteItem = (id: number) => {
    Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await exampleRepository.delete(id);
            loadItems();
          } catch (error) {
            console.error("Error deleting item:", error);
            Alert.alert("Error", "Failed to delete item");
          }
        },
      },
    ]);
  };

  const handleToggleComplete = async (id: number) => {
    try {
      await exampleRepository.toggleComplete(id);
      loadItems();
    } catch (error) {
      console.error("Error toggling completion:", error);
      Alert.alert("Error", "Failed to update item");
    }
  };

  const handleEditItem = (item: ExampleItem) => {
    setTitle(item.title);
    setDescription(item.description || "");
    setEditingId(item.id);
  };

  const handleCancelEdit = () => {
    setTitle("");
    setDescription("");
    setEditingId(null);
  };

  const handleResetDatabase = () => {
    Alert.alert(
      "Reset Database",
      "This will delete all data and recreate the database with default users. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await resetDatabase();
              await loadItems();
              Alert.alert("Success", "Database has been reset successfully!");
            } catch (error) {
              console.error("Error resetting database:", error);
              Alert.alert("Error", "Failed to reset database");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            useAuthStore.getState().logout();
            router.replace("/login");
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: ExampleItem }) => (
    <View className="mb-3  rounded-lg border border-gray-200 p-4 shadow-sm">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <TouchableOpacity
              onPress={() => handleToggleComplete(item.id)}
              className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                item.completed
                  ? "bg-green-500 border-green-500"
                  : "border-gray-300"
              }`}
            >
              {item.completed && (
                <ThemedText className="text-white text-sm font-bold">
                  ✓
                </ThemedText>
              )}
            </TouchableOpacity>
            <ThemedText
              className={`flex-1 text-base ${
                item.completed ? "line-through opacity-50" : "font-semibold"
              }`}
            >
              {item.title}
            </ThemedText>
          </View>
          {item.description && (
            <ThemedText className="text-sm opacity-70 ml-9 mb-2">
              {item.description}
            </ThemedText>
          )}
          <ThemedText className="text-xs opacity-50 ml-9">
            {new Date(item.created_at).toLocaleString()}
          </ThemedText>
        </View>
        <View className="flex-row">
          <TouchableOpacity
            className="px-4 py-2 bg-blue-500 rounded-lg mr-2"
            onPress={() => handleEditItem(item)}
          >
            <ThemedText className="text-white text-sm font-semibold">
              Edit
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            className="px-4 py-2 bg-red-500 rounded-lg"
            onPress={() => handleDeleteItem(item.id)}
          >
            <ThemedText className="text-white text-sm font-semibold">
              Delete
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="p-4 pt-12 ">
          <View className="flex-row items-center justify-between mb-2">
            <View>
              <ThemedText className="text-2xl font-bold">Todo List</ThemedText>
              <ThemedText className="text-sm opacity-70">
                Simple CRUD example with SQLite
              </ThemedText>
            </View>
            <View className="flex-row items-center gap-2">
              {items.length > 0 && (
                <View className="bg-green-100 px-3 py-1 rounded-full">
                  <ThemedText className="text-green-800 text-sm font-semibold">
                    {items.length}
                  </ThemedText>
                </View>
              )}
              <TouchableOpacity
                onPress={handleResetDatabase}
                className="bg-red-500 px-3 py-1 rounded-lg"
              >
                <ThemedText className="text-white text-xs font-semibold">
                  🔄 Reset DB
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLogout}
                className="bg-gray-600 px-3 py-1 rounded-lg"
              >
                <ThemedText className="text-white text-xs font-semibold">
                  🚪 Logout
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Form */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-4">
            <View className="border border-gray-200 rounded-lg shadow-sm mb-4 ">
              <View className="p-4">
                <View className="gap-4">
                  <ThemedText className="text-lg font-bold">
                    {editingId ? "✏️ Edit Item" : "➕ Add New Item"}
                  </ThemedText>

                  <View className="gap-2">
                    <ThemedText className="text-sm font-semibold">
                      Title *
                    </ThemedText>
                    <TextInput
                      mode="outlined"
                      placeholder="Enter todo title..." 
                      value={title}
                      onChangeText={setTitle}
                      className=""
                    />
                  </View>

                  <View className="gap-2">
                    <ThemedText className="text-sm font-semibold">
                      Description (optional)
                    </ThemedText>
                    <TextInput
                      mode="outlined"
                      placeholder="Enter description..." 
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={3}
                      className=""
                    />
                  </View>

                  <View className="flex-row gap-2">
                    {editingId ? (
                      <>
                        <TouchableOpacity
                          className="flex-1 bg-blue-500 px-4 py-3 rounded-lg"
                          onPress={handleUpdateItem}
                        >
                          <ThemedText className="text-white font-semibold text-center">
                            💾 Update
                          </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="flex-1 border border-gray-300 px-4 py-3 rounded-lg"
                          onPress={handleCancelEdit}
                        >
                          <ThemedText className="text-gray-700 font-semibold text-center">
                            ❌ Cancel
                          </ThemedText>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity
                        className="flex-1 bg-green-500 px-4 py-3 rounded-lg"
                        onPress={handleAddItem}
                      >
                        <ThemedText className="text-white font-semibold text-center">
                          ➕ Add Item
                        </ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </View>

            {/* List */}
            <View className="border border-gray-200 rounded-lg shadow-sm ">
              <View className="p-4">
                <View className="gap-4">
                  <View className="flex-row items-center justify-between">
                    <ThemedText className="text-lg font-bold">
                      📋 Items ({items.length})
                    </ThemedText>
                    {items.length > 0 && (
                      <View className="border border-gray-300 px-3 py-1 rounded-full">
                        <ThemedText className="text-gray-700 text-sm font-semibold">
                          {items.filter((i) => i.completed).length} completed
                        </ThemedText>
                      </View>
                    )}
                  </View>

                  {loading ? (
                    <View className="items-center py-8">
                      <ActivityIndicator size="large" />
                      <ThemedText className="mt-4 text-gray-500">
                        Loading todos...
                      </ThemedText>
                    </View>
                  ) : items.length === 0 ? (
                    <View className="items-center py-12">
                      <ThemedText className="text-4xl mb-4">📝</ThemedText>
                      <ThemedText className="text-lg font-semibold mb-2">
                        No todos yet
                      </ThemedText>
                      <ThemedText className="text-center opacity-70">
                        Add your first todo above!
                      </ThemedText>
                    </View>
                  ) : (
                    <FlatList
                      data={items}
                      renderItem={renderItem}
                      keyExtractor={(item) => item.id.toString()}
                      scrollEnabled={false}
                    />
                  )}
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}


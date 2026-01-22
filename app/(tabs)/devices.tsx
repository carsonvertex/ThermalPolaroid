import { ThemedText, ThemedView } from "@/components/ui";
import { Device, getAllDevices, getDeviceById, registerDevice, updateDevice, updateDeviceStatus } from "@/endpoints/devices";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useLanguageStore } from "@/lib/stores/language-store";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useRef, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    TextInput as RNTextInput,
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native";
import { Button, Card, Modal, Portal, TextInput, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DevicesScreen() {
  const theme = useTheme();
  const { language } = useLanguageStore();
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  // Calculate tab bar height: paddingTop(8) + icon(28) + text margin(4) + text(~14) + padding(8) + safe area
  const TAB_BAR_HEIGHT = 8 + 28 + 4 + 14 + 8 + insets.bottom;

  // Modal states
  const [showScanModal, setShowScanModal] = useState(false);
  const [scannedDeviceId, setScannedDeviceId] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [registering, setRegistering] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isDeviceAlreadyRegistered, setIsDeviceAlreadyRegistered] = useState(false);
  const [scanningStepCompleted, setScanningStepCompleted] = useState(false);
  const scanInputRef = useRef<RNTextInput>(null);

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [editDeviceName, setEditDeviceName] = useState("");
  const [updating, setUpdating] = useState(false);

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
              ? "Only administrators can manage devices."
              : "只有管理員才能管理設備。"}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  // Fetch all devices
  const { data: devicesResponse, isLoading, refetch } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      return await getAllDevices();
    },
  });

  const devices = devicesResponse?.data || [];

  const handleToggleActive = async (device: Device) => {
    try {
      const newStatus = !device.isActive;
      await updateDeviceStatus(device.id, newStatus);

      // Update the local cache optimistically
      queryClient.setQueryData(["devices"], (oldData: any) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((d: Device) =>
            d.id === device.id
              ? { ...d, isActive: newStatus, updatedAt: new Date().toISOString() }
              : d
          ),
        };
      });

      Alert.alert(
        "Success",
        language === "en"
          ? `Device ${newStatus ? "activated" : "deactivated"} successfully`
          : `設備${newStatus ? "已啟用" : "已停用"}成功`
      );

      // Refetch to ensure data is in sync
      await queryClient.invalidateQueries({ queryKey: ["devices"] });
    } catch (error) {
      console.error('Error toggling device status:', error);
      Alert.alert(
        "Error",
        language === "en"
          ? `Failed to toggle device status: ${error instanceof Error ? error.message : String(error)}`
          : `切換設備狀態失敗: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  const handleOpenScanModal = () => {
    setShowScanModal(true);
    setScannedDeviceId("");
    setDeviceName("");
    setIsScanning(false);
    setIsDeviceAlreadyRegistered(false);
    setScanningStepCompleted(false);
  };

  const handleStartScanning = () => {
    setIsScanning(true);
    // Focus the hidden input after a short delay to allow state to update
    setTimeout(() => {
      scanInputRef.current?.focus();
    }, 100);
  };

  const handleProceedWithDeviceId = () => {
    if (!scannedDeviceId.trim()) {
      Alert.alert("Error", language === "en" ? "No device ID scanned" : "未掃描到設備ID");
      return;
    }

    // Proceed to the next step - device existence check already done
    setScanningStepCompleted(true);
  };

  const handleRegisterDevice = async () => {
    if (!scannedDeviceId.trim()) {
      Alert.alert("Error", language === "en" ? "Device ID is required" : "需要設備ID");
      return;
    }

    if (!deviceName.trim()) {
      Alert.alert("Error", language === "en" ? "Device name is required" : "需要設備名稱");
      return;
    }

    try {
      setRegistering(true);
      await registerDevice(scannedDeviceId, deviceName);

      Alert.alert(
        "Success",
        language === "en"
          ? "Device registered successfully"
          : "設備註冊成功"
      );

      setShowScanModal(false);
      setScannedDeviceId("");
      setDeviceName("");

      // Refetch devices to show the new one
      await queryClient.invalidateQueries({ queryKey: ["devices"] });
    } catch (error) {
      console.error('Error registering device:', error);
      Alert.alert(
        "Error",
        language === "en"
          ? `Failed to register device: ${error instanceof Error ? error.message : String(error)}`
          : `註冊設備失敗: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setRegistering(false);
    }
  };

  const handleCloseScanModal = () => {
    setShowScanModal(false);
    setScannedDeviceId("");
    setDeviceName("");
    setIsScanning(false);
    setIsDeviceAlreadyRegistered(false);
    setScanningStepCompleted(false);
  };

  const handleEditDevice = (device: Device) => {
    setEditingDevice(device);
    setEditDeviceName(device.deviceName || "");
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingDevice) return;

    if (!editDeviceName.trim()) {
      Alert.alert("Error", language === "en" ? "Device name is required" : "需要設備名稱");
      return;
    }

    try {
      setUpdating(true);
      await updateDevice(editingDevice.id, {
        ...editingDevice,
        deviceName: editDeviceName.trim(),
      });

      Alert.alert(
        "Success",
        language === "en"
          ? "Device name updated successfully"
          : "設備名稱更新成功"
      );

      setShowEditModal(false);
      setEditingDevice(null);
      setEditDeviceName("");

      // Refetch devices to show the updated name
      await queryClient.invalidateQueries({ queryKey: ["devices"] });
    } catch (error) {
      console.error('Error updating device:', error);
      Alert.alert(
        "Error",
        language === "en"
          ? `Failed to update device: ${error instanceof Error ? error.message : String(error)}`
          : `更新設備失敗: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingDevice(null);
    setEditDeviceName("");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return language === "en" ? "Never" : "從未";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
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
                  marginBottom: 16,
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
                    {language === "en" ? "Devices" : "設備"}
                  </ThemedText>
                  <ThemedText style={{ fontSize: 14, opacity: 0.7 }}>
                    {language === "en"
                      ? "Manage registered devices and their access"
                      : "管理已註冊的設備及其訪問權限"}
                  </ThemedText>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={handleOpenScanModal}
                  style={{
                    backgroundColor: theme.colors.primary,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    flex: 1,
                  }}
                >
                  <MaterialIcons name="qr-code-scanner" size={20} color="#fff" />
                  <ThemedText
                    style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}
                  >
                    {language === "en" ? "Register Device" : "註冊設備"}
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => refetch()}
                  style={{
                    backgroundColor: theme.colors.secondaryContainer,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <MaterialIcons name="refresh" size={20} color={theme.colors.onSecondaryContainer} />
                  <ThemedText
                    style={{ color: theme.colors.onSecondaryContainer, fontWeight: "600", fontSize: 14 }}
                  >
                    {language === "en" ? "Refresh" : "刷新"}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Devices List */}
            {isLoading ? (
              <Card
                style={{
                  backgroundColor: theme.colors.surface,
                  padding: 32,
                }}
                elevation={2}
              >
                <ThemedText style={{ textAlign: "center", opacity: 0.7 }}>
                  {language === "en" ? "Loading devices..." : "載入設備中..."}
                </ThemedText>
              </Card>
            ) : devices.length === 0 ? (
              <Card
                style={{
                  backgroundColor: theme.colors.surface,
                  padding: 32,
                }}
                elevation={2}
              >
                <View style={{ alignItems: "center" }}>
                  <MaterialIcons
                    name="devices"
                    size={64}
                    color={theme.colors.outline}
                  />
                  <ThemedText
                    style={{ marginTop: 16, opacity: 0.7, textAlign: "center" }}
                  >
                    {language === "en"
                      ? "No devices found. Devices will appear here when registered."
                      : "未找到設備。註冊後設備將顯示在此處。"}
                  </ThemedText>
                </View>
              </Card>
            ) : (
              devices.map((device) => (
                <Card
                  key={device.id}
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
                            {device.deviceName || device.deviceId}
                          </ThemedText>
                          {!device.isActive && (
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
                          style={{ fontSize: 14, opacity: 0.7, marginBottom: 8, fontFamily: "monospace" }}
                        >
                          ID: {device.deviceId}
                        </ThemedText>
                        <View style={{ marginBottom: 8 }}>
                          <ThemedText
                            style={{
                              fontSize: 12,
                              opacity: 0.6,
                              marginBottom: 4,
                            }}
                          >
                            {language === "en" ? "Registered" : "註冊時間"}: {formatDate(device.registeredAt)}
                          </ThemedText>
                          <ThemedText
                            style={{
                              fontSize: 12,
                              opacity: 0.6,
                            }}
                          >
                            {language === "en" ? "Last Seen" : "最後上線"}: {formatDate(device.lastSeenAt)}
                          </ThemedText>
                        </View>
                        <View
                          style={{
                            backgroundColor: device.isActive
                              ? "#4CAF5020"
                              : "#F4433620",
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
                              color: device.isActive ? "#4CAF50" : "#F44336",
                            }}
                          >
                            {device.isActive
                              ? (language === "en" ? "Active" : "啟用")
                              : (language === "en" ? "Inactive" : "停用")
                            }
                          </ThemedText>
                        </View>
                      </View>

                      {/* Action buttons */}
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => handleEditDevice(device)}
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
                          onPress={() => handleToggleActive(device)}
                          style={{
                            backgroundColor: device.isActive
                              ? theme.colors.errorContainer
                              : theme.colors.primaryContainer,
                            padding: 10,
                            borderRadius: 8,
                          }}
                        >
                          <MaterialIcons
                            name={device.isActive ? "block" : "check-circle"}
                            size={20}
                            color={
                              device.isActive
                                ? theme.colors.error
                                : theme.colors.primary
                            }
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              ))
            )}
          </View>
        </ScrollView>
      </ThemedView>

      {/* Register Device Modal */}
      <Portal>
        <Modal
          visible={showScanModal}
          onDismiss={handleCloseScanModal}
          contentContainerStyle={{
            margin: 20,
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            padding: 0,
          }}
        >
          <View style={{ padding: 20 }}>
            <View style={{ alignItems: "center", marginBottom: 24 }}>
              <MaterialIcons
                name="qr-code-scanner"
                size={48}
                color={theme.colors.primary}
                style={{ marginBottom: 12 }}
              />
              <ThemedText
                style={{
                  fontSize: 20,
                  fontWeight: "600",
                  color: theme.colors.onSurface,
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                {language === "en" ? "Register New Device" : "註冊新設備"}
              </ThemedText>
              <ThemedText
                style={{
                  fontSize: 14,
                  color: theme.colors.onSurfaceVariant,
                  textAlign: "center",
                }}
              >
                {scanningStepCompleted
                  ? (language === "en" ? "Enter device name to complete registration" : "輸入設備名稱以完成註冊")
                  : scannedDeviceId
                    ? isDeviceAlreadyRegistered
                      ? (language === "en" ? "This device is already registered" : "此設備已註冊")
                      : (language === "en" ? "Click Next to proceed with device registration" : "點擊下一步繼續設備註冊")
                    : isScanning
                      ? (language === "en" ? "Scanning QR code..." : "掃描QR碼中...")
                      : (language === "en" ? "Scan the device QR code to register it" : "掃描設備QR碼以註冊設備")
                }
              </ThemedText>
            </View>

            {/* Hidden input for barcode scanner */}
            <TextInput
              ref={scanInputRef}
              value={scannedDeviceId}
              onChangeText={async (text) => {
                setScannedDeviceId(text);
                if (text.trim()) {
                  // Check if device already exists when ID is scanned
                  try {
                    const existingDevice = await getDeviceById(text.trim());
                    if (existingDevice.success && existingDevice.data) {
                      setIsDeviceAlreadyRegistered(true);
                      setDeviceName(existingDevice.data.deviceName || "");
                    } else {
                      setIsDeviceAlreadyRegistered(false);
                      setDeviceName("");
                    }
                  } catch (error) {
                    // If device doesn't exist (404), that's fine - we can proceed with registration
                    console.log('Device check error (expected for new devices):', error);
                    setIsDeviceAlreadyRegistered(false);
                    setDeviceName("");
                  }
                } else {
                  setIsDeviceAlreadyRegistered(false);
                  setDeviceName("");
                }
              }}
              placeholder={language === "en" ? "Scan QR code..." : "掃描QR碼..."}
              style={{
                position: "absolute",
                opacity: 0,
                height: 0,
                width: 0,
              }}
            />

            {/* Start Scanning Button */}
            {!isScanning && !scannedDeviceId && (
              <View style={{ marginBottom: 24 }}>
                <Button
                  mode="contained"
                  onPress={handleStartScanning}
                  style={{ marginBottom: 16 }}
                >
                  {language === "en" ? "Start Scanning QR Code" : "開始掃描QR碼"}
                </Button>
                <ThemedText
                  style={{
                    fontSize: 14,
                    color: theme.colors.onSurfaceVariant,
                    textAlign: "center",
                  }}
                >
                  {language === "en"
                    ? "Tap to start scanning the device QR code"
                    : "點擊開始掃描設備QR碼"}
                </ThemedText>
              </View>
            )}

            {/* Scan area - only show when actively scanning */}
            {isScanning && !scannedDeviceId && (
              <View
                style={{
                  backgroundColor: theme.colors.surfaceVariant,
                  borderWidth: 2,
                  borderColor: theme.colors.primary,
                  borderStyle: "dashed",
                  borderRadius: 8,
                  padding: 40,
                  alignItems: "center",
                  marginBottom: 24,
                }}
              >
                <MaterialIcons
                  name="qr-code-2"
                  size={64}
                  color={theme.colors.primary}
                  style={{ marginBottom: 16 }}
                />
                <ThemedText
                  style={{
                    fontSize: 16,
                    color: theme.colors.primary,
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
                  {language === "en"
                    ? "Scanning... Point camera at device QR code"
                    : "掃描中... 將相機對準設備QR碼"}
                </ThemedText>
              </View>
            )}

            {/* Device ID display and Next button */}
            {scannedDeviceId && !scanningStepCompleted && (
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <ThemedText
                    style={{
                      fontSize: 14,
                      color: theme.colors.onSurfaceVariant,
                    }}
                  >
                    {language === "en" ? "Scanned Device ID:" : "掃描到的設備ID:"}
                  </ThemedText>
                  <Button
                    mode="text"
                    onPress={() => {
                      setScannedDeviceId("");
                      setDeviceName("");
                      setIsDeviceAlreadyRegistered(false);
                      setScanningStepCompleted(false);
                      // Start scanning again
                      setIsScanning(true);
                      setTimeout(() => {
                        scanInputRef.current?.focus();
                      }, 100);
                    }}
                    compact
                  >
                    {language === "en" ? "Rescan" : "重新掃描"}
                  </Button>
                </View>
                <View
                  style={{
                    backgroundColor: theme.colors.surfaceVariant,
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 16,
                  }}
                >
                  <ThemedText
                    style={{
                      fontSize: 16,
                      fontFamily: "monospace",
                      color: theme.colors.onSurface,
                      textAlign: "center",
                    }}
                  >
                    {scannedDeviceId}
                  </ThemedText>
                </View>
                <Button
                  mode="contained"
                  onPress={handleProceedWithDeviceId}
                  disabled={isDeviceAlreadyRegistered}
                  style={{ marginBottom: 8 }}
                >
                  {language === "en" ? "Next" : "下一步"}
                </Button>
                {isDeviceAlreadyRegistered && (
                  <ThemedText
                    style={{
                      fontSize: 12,
                      color: theme.colors.error,
                      textAlign: "center",
                      marginTop: 8,
                    }}
                  >
                    {language === "en" ? "This device is already registered" : "此設備已註冊"}
                  </ThemedText>
                )}
              </View>
            )}

            {/* Device name input */}
            {scanningStepCompleted && (
              <View style={{ marginBottom: 24 }}>
                <TextInput
                  mode="outlined"
                  label={language === "en" ? "Device Name" : "設備名稱"}
                  value={deviceName}
                  onChangeText={setDeviceName}
                  placeholder={language === "en" ? "Enter device name" : "輸入設備名稱"}
                  disabled={isDeviceAlreadyRegistered}
                  autoFocus={!isDeviceAlreadyRegistered}
                />
                {isDeviceAlreadyRegistered && (
                  <ThemedText
                    style={{
                      fontSize: 12,
                      color: theme.colors.onSurfaceVariant,
                      marginTop: 4,
                      textAlign: "center",
                    }}
                  >
                    {language === "en" ? "This device is already registered" : "此設備已註冊"}
                  </ThemedText>
                )}
              </View>
            )}

            {/* Action buttons */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Button
                mode="outlined"
                onPress={handleCloseScanModal}
                style={{ flex: 1 }}
              >
                {language === "en" ? "Cancel" : "取消"}
              </Button>
              <Button
                mode="contained"
                onPress={handleRegisterDevice}
                disabled={!scanningStepCompleted || !deviceName.trim() || registering || isDeviceAlreadyRegistered}
                loading={registering}
                style={{ flex: 1 }}
              >
                {registering
                  ? (language === "en" ? "Registering..." : "註冊中...")
                  : (language === "en" ? "Register" : "註冊")
                }
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>

      {/* Edit Device Modal */}
      <Portal>
        <Modal
          visible={showEditModal}
          onDismiss={handleCloseEditModal}
          contentContainerStyle={{
            margin: 20,
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            padding: 20,
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <MaterialIcons
              name="edit"
              size={48}
              color={theme.colors.primary}
              style={{ marginBottom: 12 }}
            />
            <ThemedText
              style={{
                fontSize: 20,
                fontWeight: "600",
                color: theme.colors.onSurface,
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              {language === "en" ? "Edit Device Name" : "編輯設備名稱"}
            </ThemedText>
            <ThemedText
              style={{
                fontSize: 14,
                color: theme.colors.onSurfaceVariant,
                textAlign: "center",
              }}
            >
              {language === "en" ? "Update the device name" : "更新設備名稱"}
            </ThemedText>
          </View>

          {/* Device ID display (read-only) */}
          <View style={{ marginBottom: 20 }}>
            <ThemedText
              style={{
                fontSize: 14,
                color: theme.colors.onSurfaceVariant,
                marginBottom: 8,
              }}
            >
              {language === "en" ? "Device ID:" : "設備ID:"}
            </ThemedText>
            <View
              style={{
                backgroundColor: theme.colors.surfaceVariant,
                padding: 12,
                borderRadius: 8,
              }}
            >
              <ThemedText
                style={{
                  fontSize: 16,
                  fontFamily: "monospace",
                  color: theme.colors.onSurfaceVariant,
                  textAlign: "center",
                }}
              >
                {editingDevice?.deviceId}
              </ThemedText>
            </View>
          </View>

          {/* Device name input */}
          <View style={{ marginBottom: 24 }}>
            <TextInput
              mode="outlined"
              label={language === "en" ? "Device Name" : "設備名稱"}
              value={editDeviceName}
              onChangeText={setEditDeviceName}
              placeholder={language === "en" ? "Enter device name" : "輸入設備名稱"}
              autoFocus
            />
          </View>

          {/* Action buttons */}
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Button
              mode="outlined"
              onPress={handleCloseEditModal}
              style={{ flex: 1 }}
            >
              {language === "en" ? "Cancel" : "取消"}
            </Button>
            <Button
              mode="contained"
              onPress={handleSaveEdit}
              disabled={!editDeviceName.trim() || updating}
              loading={updating}
              style={{ flex: 1 }}
            >
              {updating
                ? (language === "en" ? "Updating..." : "更新中...")
                : (language === "en" ? "Update" : "更新")
              }
            </Button>
          </View>
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
  );
}
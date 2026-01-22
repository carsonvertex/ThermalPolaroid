import { apiClient } from "@/lib/api/client";
import { config } from "@/lib/config/environment";
import { useDatabaseEnvironmentStore } from "@/lib/stores/database-environment-store";
import { useCallback, useEffect, useState } from "react";
import { useDeviceInfo } from "./use-device-info";

interface DeviceStatus {
  isRegistered: boolean | null;
  isLoading: boolean;
  deviceId: string | null;
}

export function useDeviceStatus() {
  const deviceInfo = useDeviceInfo();
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    isRegistered: null,
    isLoading: true,
    deviceId: null,
  });

  const checkDeviceStatus = useCallback(async () => {
    if (!deviceInfo.deviceId) {
      setDeviceStatus({
        isRegistered: null,
        isLoading: false,
        deviceId: null,
      });
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      setDeviceStatus((prev) => ({
        ...prev,
        isLoading: true,
        deviceId: deviceInfo.deviceId,
      }));

      // Ensure database environment is initialized for production server
      const initializeForProduction = useDatabaseEnvironmentStore.getState().initializeForProduction;
      initializeForProduction();
      
      // Get current environment - if production server, force PRD
      let dbEnvironment = useDatabaseEnvironmentStore.getState().environment;
      const isProductionServer = config.API_BASE_URL.includes('172.31.') || 
                                 config.API_BASE_URL.includes('ec2') || 
                                 config.API_BASE_URL.includes('amazonaws') ||
                                 (!config.API_BASE_URL.includes('10.0.2.2') && 
                                  !config.API_BASE_URL.includes('localhost') && 
                                  !config.API_BASE_URL.includes('127.0.0.1'));
      
      // Force PRD for production server
      if (isProductionServer && dbEnvironment !== 'prd') {
        console.warn(`🗄️ [Device Check] Production server detected but environment is '${dbEnvironment}', forcing to 'prd'`);
        useDatabaseEnvironmentStore.getState().setEnvironment('prd');
        dbEnvironment = 'prd';
      }
      
      console.log(
        "🔍 Checking device registration for deviceId:",
        deviceInfo.deviceId
      );
      console.log("🌐 API Base URL:", config.API_BASE_URL);
      console.log("🗄️ Database Environment:", dbEnvironment);
      console.log("🗄️ Server Type:", isProductionServer ? 'Production (EC2)' : 'Development (localhost)');
      console.log("🗄️ This will be sent as X-DB-Environment header:", dbEnvironment);

      interface DeviceResponse {
        success: boolean;
        data?: {
          id: number;
          deviceId: string;
          deviceName?: string;
          isActive: boolean;
        };
        message?: string;
      }

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(
            new Error(
              "TIMEOUT: Backend server not reachable. Check if backend is running at " +
                config.API_BASE_URL
            )
          );
        }, 5000);
      });

      const response = await Promise.race([
        apiClient.get<DeviceResponse>(`/pos/devices/${deviceInfo.deviceId}`),
        timeoutPromise,
      ]);

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      console.log(
        "📱 Device check response:",
        JSON.stringify(response, null, 2)
      );
      console.log("✅ Device registered:", response.success);
      console.log("✅ Device active:", response.data?.isActive);

      setDeviceStatus({
        isRegistered: response.success && response.data?.isActive === true,
        isLoading: false,
        deviceId: deviceInfo.deviceId,
      });
    } catch (error: any) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      const isTimeout =
        error?.message?.includes("TIMEOUT") ||
        error?.message?.includes("timed out");
      const isNetworkError =
        error?.message?.includes("Network request failed") ||
        error?.message?.includes("Failed to fetch");

      if (isTimeout || isNetworkError) {
        const isSunmiDevice =
          deviceInfo.brand?.toLowerCase().includes("sunmi") ||
          deviceInfo.modelName?.toLowerCase().includes("sunmi");
        const isPrivateIP =
          config.API_BASE_URL.includes("172.31.") ||
          config.API_BASE_URL.includes("10.0.") ||
          config.API_BASE_URL.includes("192.168.");

        console.warn("⚠️ Backend not reachable:", config.API_BASE_URL);
        console.warn(
          "⚠️ Device check skipped - backend may be offline or network issue"
        );
        console.warn("⚠️ Device ID:", deviceInfo.deviceId || "not available");
        console.warn("⚠️ Device Brand:", deviceInfo.brand || "unknown");
        console.warn("⚠️ Error type:", isTimeout ? "TIMEOUT" : "NETWORK_ERROR");

        if (isSunmiDevice) {
          console.warn(
            "⚠️ SUNMI DEVICE DETECTED - Chinese devices may have network restrictions"
          );
          console.warn("⚠️ Solutions:");
          console.warn(
            "   1. Use PUBLIC IP instead of private IP (172.31.x.x)"
          );
          console.warn("   2. Check firewall/VPN settings on Sunmi device");
          console.warn("   3. Ensure device can access external networks");
        }

        if (isPrivateIP) {
          console.warn(
            "⚠️ PRIVATE IP DETECTED - Not accessible from external networks"
          );
          console.warn(
            "⚠️ Private IPs (172.31.x.x, 10.0.x.x, 192.168.x.x) only work within same network/VPN"
          );
          console.warn("⚠️ For external devices, use PUBLIC IP or domain name");
          console.warn(
            "⚠️ Get public IP: curl http://checkip.amazonaws.com (from EC2)"
          );
        }

        console.warn("⚠️ Full error:", JSON.stringify(error, null, 2));

        setDeviceStatus({
          isRegistered: null,
          isLoading: false,
          deviceId: deviceInfo.deviceId,
        });
      } else {
        const errorStatus = error?.message?.match(/API Error: (\d+)/)?.[1];
        console.error("❌ Device registration check failed:", error);
        console.error("❌ Error message:", error?.message);
        console.error("❌ Error status:", errorStatus || "unknown");
        console.error(
          "❌ Device ID used:",
          deviceInfo.deviceId || "not available"
        );
        console.error(
          "❌ API URL attempted:",
          `${config.API_BASE_URL}/pos/devices/${deviceInfo.deviceId}`
        );

        if (errorStatus === "404") {
          console.warn("⚠️ Device not found in database (404)");
          setDeviceStatus({
            isRegistered: false,
            isLoading: false,
            deviceId: deviceInfo.deviceId,
          });
        } else {
          console.warn("⚠️ Server error - cannot determine device status");
          setDeviceStatus({
            isRegistered: null,
            isLoading: false,
            deviceId: deviceInfo.deviceId,
          });
        }
      }
    }
  }, [deviceInfo.deviceId, deviceInfo.brand, deviceInfo.modelName]);

  useEffect(() => {
    checkDeviceStatus();
  }, [checkDeviceStatus]);

  return { deviceStatus, checkDeviceStatus };
}


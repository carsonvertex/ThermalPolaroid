import { config } from "@/lib/config/environment";
import { apiClient } from "@/lib/api/client";

export interface Device {
  id: number;
  deviceId: string;
  deviceName: string | null;
  isActive: boolean;
  lastSeenAt: string | null;
  registeredAt: string;
  updatedAt: string;
}

export interface DeviceResponse {
  success: boolean;
  data: Device[];
  count: number;
  message?: string;
}

export interface SingleDeviceResponse {
  success: boolean;
  data: Device;
  message?: string;
}

export interface DeviceUpdateResponse {
  success: boolean;
  data: Device;
  message: string;
}

/**
 * Get all registered devices
 */
export const getAllDevices = async (): Promise<DeviceResponse> => {
  return await apiClient.get<DeviceResponse>(`/pos/devices`);
};

/**
 * Get device by device ID
 */
export const getDeviceById = async (deviceId: string): Promise<SingleDeviceResponse> => {
  return await apiClient.get<SingleDeviceResponse>(`/pos/devices/${deviceId}`);
};

/**
 * Register a new device
 */
export const registerDevice = async (deviceId: string, deviceName?: string): Promise<DeviceUpdateResponse> => {
  return await apiClient.post<DeviceUpdateResponse>(`/pos/devices/register`, {
    deviceId,
    deviceName: deviceName || null,
  });
};

/**
 * Update device information
 */
export const updateDevice = async (id: number, device: Partial<Device>): Promise<DeviceUpdateResponse> => {
  return await apiClient.put<DeviceUpdateResponse>(`/pos/devices/${id}`, device);
};

/**
 * Update device status (enable/disable)
 */
export const updateDeviceStatus = async (id: number, isActive: boolean): Promise<DeviceUpdateResponse> => {
  return await apiClient.patch<DeviceUpdateResponse>(`/pos/devices/${id}/status?isActive=${isActive}`);
};

/**
 * Delete a device
 */
export const deleteDevice = async (id: number): Promise<{ success: boolean; message: string }> => {
  return await apiClient.delete<{ success: boolean; message: string }>(`/pos/devices/${id}`);
};
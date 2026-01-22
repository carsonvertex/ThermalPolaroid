import { config } from '@/lib/config/environment';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useDatabaseEnvironmentStore } from '@/lib/stores/database-environment-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * API Configuration
 * Points to the Spring Boot backend
 * 
 * Development: Uses local IP (10.0.2.2 for Android emulator, localhost for iOS/Web)
 * Production: Uses EC2 server (http://172.31.235.136:8080/api)
 */
const API_BASE_URL = config.API_BASE_URL;

// Storage key for persistent device ID (same as in use-device-info.ts)
const DEVICE_ID_STORAGE_KEY = '@pos_device_id';

// Cache device ID to avoid repeated async calls
let cachedDeviceId: string | null = null;

/**
 * Get device ID (cached and persistent)
 */
const getDeviceId = async (): Promise<string | null> => {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  try {
    // First, try to get from persistent storage
    try {
      const storedDeviceId = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
      if (storedDeviceId) {
        cachedDeviceId = storedDeviceId;
        console.log('📱 API Client: Using stored device ID:', cachedDeviceId);
        return cachedDeviceId;
      }
    } catch (error) {
      console.warn('Failed to read device ID from storage:', error);
    }

    // If not in storage, try to get from native module
    let Application: any = null;
    try {
      Application = require('expo-application');
    } catch (e) {
      // expo-application not available
    }

    if (Application) {
      try {
        if (Platform.OS === 'android') {
          cachedDeviceId = Application.getAndroidId();
        } else if (Platform.OS === 'ios') {
          cachedDeviceId = await Application.getIosIdForVendorAsync();
        }
        
        // Store the native device ID for future use
        if (cachedDeviceId) {
          try {
            await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, cachedDeviceId);
            console.log('📱 API Client: Stored native device ID:', cachedDeviceId);
            return cachedDeviceId;
          } catch (error) {
            console.warn('Failed to store device ID:', error);
          }
        }
      } catch (error) {
        console.warn('Failed to get native device ID:', error);
      }
    }

    // Fallback for web/dev mode
    if (!cachedDeviceId) {
      // Try to get from localStorage (for web) or generate a persistent one
      if (typeof window !== 'undefined' && window.localStorage) {
        cachedDeviceId = window.localStorage.getItem('deviceId');
        if (!cachedDeviceId) {
          cachedDeviceId = 'web-device-' + Math.random().toString(36).substr(2, 9);
          window.localStorage.setItem('deviceId', cachedDeviceId);
        }
        // Also store in AsyncStorage for consistency
        try {
          await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, cachedDeviceId);
        } catch (error) {
          // Ignore if AsyncStorage not available on web
        }
      } else {
        // Generate a persistent device ID and store it
        cachedDeviceId = 'dev-device-' + Math.random().toString(36).substr(2, 9);
        try {
          await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, cachedDeviceId);
          console.log('📱 API Client: Generated and stored new device ID:', cachedDeviceId);
        } catch (error) {
          console.warn('Failed to store generated device ID:', error);
        }
      }
    }

    return cachedDeviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    return null;
  }
};

/**
 * API Client class for making HTTP requests
 */
class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Get authorization header with token
   */
  private async getAuthHeader(): Promise<Record<string, string>> {
    const accessToken = useAuthStore.getState().accessToken;
    
    if (accessToken) {
      return {
        Authorization: `Bearer ${accessToken}`,
      };
    }
    
    return {};
  }

  /**
   * Get device ID header
   */
  private async getDeviceIdHeader(): Promise<Record<string, string>> {
    const deviceId = await getDeviceId();
    
    if (deviceId) {
      return {
        'X-Device-ID': deviceId,
      };
    }
    
    return {};
  }

  /**
   * Get database environment header
   */
  private getDatabaseEnvironmentHeader(): Record<string, string> {
    const environment = useDatabaseEnvironmentStore.getState().environment;
    console.log(`🗄️ [API Client] Database environment from store: ${environment}`);
    return {
      'X-DB-Environment': environment,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
        return true;
      }
      
      throw new Error('Token refresh failed');
    } catch (error) {
      console.error('Token refresh error:', error);
      useAuthStore.getState().logout();
      return false;
    }
  }

  /**
   * Make an API request with automatic token refresh
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
    
    // Add auth header, device ID header, and database environment header
    const authHeader = await this.getAuthHeader();
    const deviceIdHeader = await this.getDeviceIdHeader();
    const dbEnvironmentHeader = this.getDatabaseEnvironmentHeader();
    const headers = {
      'Content-Type': 'application/json',
      ...authHeader,
      ...deviceIdHeader,
      ...dbEnvironmentHeader,
      ...options.headers,
    };
    
    // Log headers for debugging
    if (deviceIdHeader['X-Device-ID']) {
      console.log(`📱 API Request with Device ID: ${deviceIdHeader['X-Device-ID']}`);
    } else {
      console.warn(`⚠️ API Request WITHOUT Device ID header!`);
    }
    console.log(`🗄️ API Request with DB Environment: ${dbEnvironmentHeader['X-DB-Environment']}`);

    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/6127fcd3-159c-469b-bdde-5c1734ea3665',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:223',message:'API request starting',data:{url,method:options.method || 'GET',hasAuth:!!authHeader.Authorization,hasDeviceId:!!deviceIdHeader['X-Device-ID'],dbEnv:dbEnvironmentHeader['X-DB-Environment']},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,C,E'})}).catch(()=>{});
    // #endregion

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/6127fcd3-159c-469b-bdde-5c1734ea3665',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:228',message:'Fetch response received',data:{status:response.status,statusText:response.statusText,ok:response.ok,url:response.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,C'})}).catch(()=>{});
      // #endregion

      // If unauthorized, try to refresh token
      if (response.status === 401) {
        const refreshed = await this.refreshToken();
        
        if (refreshed) {
          // Retry request with new token
          const newAuthHeader = await this.getAuthHeader();
          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              ...headers,
              ...newAuthHeader,
              ...deviceIdHeader, // Ensure device ID is still included
              ...dbEnvironmentHeader, // Ensure DB environment is still included
            },
          });
          
          if (!retryResponse.ok) {
            const errorText = await retryResponse.text();
            console.error(`❌ API Error ${retryResponse.status}:`, errorText);
            throw new Error(`API Error: ${retryResponse.status} - ${errorText.substring(0, 100)}`);
          }
          
          const retryText = await retryResponse.text();
          if (!retryText || retryText.trim() === '') {
            console.error('❌ Empty response from backend');
            throw new Error('Empty response from backend');
          }
          
          return JSON.parse(retryText);
        }
        
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error ${response.status}:`, errorText);
        console.error(`❌ Failed URL: ${url}`);
        console.error(`❌ Request headers:`, JSON.stringify(headers, null, 2));
        console.error(`❌ Request body:`, options.body);
        
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/6127fcd3-159c-469b-bdde-5c1734ea3665',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:264',message:'API response not ok',data:{status:response.status,statusText:response.statusText,errorText:errorText.substring(0,200),url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,C'})}).catch(()=>{});
        // #endregion
        
        // Handle 403 Forbidden (Device not authorized)
        if (response.status === 403) {
          let errorMessage = 'Device not authorized';
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.message) {
              errorMessage = errorJson.message;
            }
          } catch (e) {
            // If parsing fails, use the raw error text
            if (errorText) {
              errorMessage = errorText.substring(0, 200);
            }
          }
          
          // Check if device ID was included
          const deviceId = deviceIdHeader?.['X-Device-ID'];
          if (!deviceId) {
            errorMessage = 'Device ID is missing. Please restart the app.';
          } else {
            console.error(`❌ Device ID was sent: ${deviceId}, but backend rejected it`);
          }
          
          console.error(`❌ Device Authorization Error: ${errorMessage}`);
          throw new Error(`DEVICE_NOT_AUTHORIZED: ${errorMessage}`);
        }
        
        throw new Error(`API Error: ${response.status} - ${errorText.substring(0, 200)}`);
      }

      // Check if response has content before parsing JSON
      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();
      
      if (!text || text.trim() === '') {
        console.error('❌ Empty response from backend');
        throw new Error('Empty response from backend');
      }

      // Handle text/plain responses (e.g., health check endpoints)
      if (contentType.includes('text/plain')) {
        // For health check endpoints, return a simple success object
        if (endpoint.includes('/health')) {
          return { success: true, message: text.trim() };
        }
        // For other text responses, try to parse as JSON, otherwise return as text
        try {
          return JSON.parse(text);
        } catch (e) {
          return { success: true, data: text.trim() };
        }
      }

      // Handle JSON responses
      if (contentType.includes('application/json')) {
        return JSON.parse(text);
      }

      // For other content types, try to parse as JSON anyway
      try {
        return JSON.parse(text);
      } catch (e) {
        console.warn(`⚠️ Response is not JSON (${contentType}), returning as text:`, text.substring(0, 100));
        return { success: true, data: text.trim() };
      }
    } catch (error) {
      console.error('API request error:', error);
      
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/6127fcd3-159c-469b-bdde-5c1734ea3665',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:336',message:'API request exception',data:{errorType:error?.constructor?.name,errorMessage:error instanceof Error ? error.message : String(error),url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,E'})}).catch(()=>{});
      // #endregion
      
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new APIClient(API_BASE_URL);


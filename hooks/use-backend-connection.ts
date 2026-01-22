import { apiClient } from '@/lib/api/client';
import { config } from '@/lib/config/environment';
import { useEffect, useState } from 'react';

interface BackendConnectionStatus {
  isConnected: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
  responseTime: number | null;
  error: string | null;
  backendUrl: string;
}

/**
 * Hook to check backend connection status
 * Polls the backend health endpoint to determine connectivity
 */
export function useBackendConnection(pollInterval: number = 30000) {
  const [status, setStatus] = useState<BackendConnectionStatus>({
    isConnected: false,
    isChecking: true,
    lastChecked: null,
    responseTime: null,
    error: null,
    backendUrl: config.API_BASE_URL,
  });

  const checkConnection = async () => {
    const startTime = Date.now();
    const fullUrl = `${config.API_BASE_URL}/products/health`;
    
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/6127fcd3-159c-469b-bdde-5c1734ea3665',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-backend-connection.ts:28',message:'checkConnection started',data:{backendUrl:config.API_BASE_URL,fullUrl,endpoint:'/products/health'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
    // #endregion
    
    setStatus((prev) => ({ ...prev, isChecking: true, error: null }));

    try {
      // Health check endpoint is now excluded from device authentication on backend
      // But we'll still use apiClient for consistency (it will include device ID if available)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 5000);
      });

      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/6127fcd3-159c-469b-bdde-5c1734ea3665',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-backend-connection.ts:40',message:'Before health check request',data:{timeout:5000},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,D'})}).catch(()=>{});
      // #endregion
      
      const response = await Promise.race([
        apiClient.get('/products/health'),
        timeoutPromise,
      ]);

      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/6127fcd3-159c-469b-bdde-5c1734ea3665',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-backend-connection.ts:44',message:'Health check success',data:{response:JSON.stringify(response)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      const responseTime = Date.now() - startTime;

      setStatus({
        isConnected: true,
        isChecking: false,
        lastChecked: new Date(),
        responseTime,
        error: null,
        backendUrl: config.API_BASE_URL,
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/6127fcd3-159c-469b-bdde-5c1734ea3665',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-backend-connection.ts:53',message:'Status set to connected',data:{responseTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    } catch (error) {
      const responseTime = Date.now() - startTime;
      let errorMessage = 'Connection failed';
      let isConnected = false;
      
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/6127fcd3-159c-469b-bdde-5c1734ea3665',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-backend-connection.ts:55',message:'Health check error caught',data:{errorType:error?.constructor?.name,errorMessage:error instanceof Error ? error.message : String(error),errorStack:error instanceof Error ? error.stack : undefined,responseTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
      // #endregion
      
      if (error instanceof Error) {
        if (error.message === 'Request timeout') {
          errorMessage = 'Request timeout';
          // #region agent log
          fetch('http://127.0.0.1:7245/ingest/6127fcd3-159c-469b-bdde-5c1734ea3665',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-backend-connection.ts:61',message:'Timeout error detected',data:{responseTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,D'})}).catch(()=>{});
          // #endregion
        } else if (error.message.includes('DEVICE_NOT_AUTHORIZED')) {
          // Device not authorized - backend is reachable but device is not registered
          errorMessage = 'Device not authorized';
          isConnected = false; // Still mark as not connected since we can't use the API
          // #region agent log
          fetch('http://127.0.0.1:7245/ingest/6127fcd3-159c-469b-bdde-5c1734ea3665',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-backend-connection.ts:65',message:'Device not authorized error',data:{responseTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
        } else if (error.message.includes('Failed to fetch') || 
                   error.message.includes('Network request failed') ||
                   error.message.includes('NetworkError')) {
          errorMessage = 'Network error';
          // #region agent log
          fetch('http://127.0.0.1:7245/ingest/6127fcd3-159c-469b-bdde-5c1734ea3665',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-backend-connection.ts:69',message:'Network error detected',data:{responseTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
        } else {
          errorMessage = error.message || 'Connection failed';
          // #region agent log
          fetch('http://127.0.0.1:7245/ingest/6127fcd3-159c-469b-bdde-5c1734ea3665',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-backend-connection.ts:72',message:'Other error',data:{errorMessage,responseTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,E'})}).catch(()=>{});
          // #endregion
        }
      }

      setStatus({
        isConnected,
        isChecking: false,
        lastChecked: new Date(),
        responseTime: responseTime > 5000 ? null : responseTime,
        error: errorMessage,
        backendUrl: config.API_BASE_URL,
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/6127fcd3-159c-469b-bdde-5c1734ea3665',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-backend-connection.ts:82',message:'Status set to disconnected',data:{isConnected,errorMessage,responseTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
      // #endregion
    }
  };

  useEffect(() => {
    // Initial check
    checkConnection();

    // Set up polling
    const intervalId = setInterval(checkConnection, pollInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [pollInterval]);

  return {
    ...status,
    refresh: checkConnection,
  };
}


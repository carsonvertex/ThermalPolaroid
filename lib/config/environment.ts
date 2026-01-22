
/**
 * __DEV__ is set by React Native automatically:
 * - npm start → __DEV__ = true (Development mode)
 * - EAS build → __DEV__ = false (Production build)
 * 
 * Logic:
 * - When __DEV__ = true (development) → isProduction should be false
 * - When __DEV__ = false (production) → isProduction should be true
 * 
 * Therefore: isProduction = __DEV__ === false
 */
// Option 1: Auto-detect based on __DEV__ (default - CORRECT)
// export const isProduction = __DEV__ === false; // true when __DEV__ is false (production build)

// Option 2: Force production mode (EC2 server) even in development
// Uncomment the line below and comment out the line above to use EC2 while running npm start:
export const isProduction = true; // ← Currently forcing EC2 server for testing

export const devRoadShowUploadUrl = 'https://v2.dev.ThermalPolaroid.com/index.php?route=react/roadshow/createOrder';
export const productionRoadShowUploadUrl = 'https://www.ThermalPolaroid.com/index.php?route=react/roadshow/createOrder';

export const getApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (isProduction) {
    // ⚠️ IMPORTANT: Use PUBLIC IP for external devices (Sunmi, phones, etc.)
    // Private IP (172.31.x.x) only works within AWS VPC
    // Get public IP: SSH into EC2 and run: curl http://checkip.amazonaws.com
    // Then either:
    //   1. Set EXPO_PUBLIC_API_URL environment variable when building, OR
    //   2. Replace the IP below with your EC2 public IP
    return 'http://172.31.235.136:8080/api'; // TODO: Replace with public IP (e.g., http://54.255.118.185:8080/api)
  }
  return 'http://10.0.2.2:8080/api'; // Emulator localhost
};

export const config = {
  API_BASE_URL: getApiBaseUrl(),
  ROADSHOW_UPLOAD_URL: devRoadShowUploadUrl,
};

console.log(`🌐 API: ${config.API_BASE_URL} (${isProduction ? 'Production' : 'Development'})`);

export default config;


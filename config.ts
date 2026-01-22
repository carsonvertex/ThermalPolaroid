/**
 * App Configuration
 * EC2 Backend Server Configuration
 */

export const config = {
  // EC2 Backend URL
  // API_URL: 'http://54.255.118.185:8080/api',
  
  // Local Backend URL (for testing)
  API_URL: '', // Will use platform default (localhost/10.0.2.2)
  
  // Environment
  ENV: 'development',
  
  // App Info
  APP_NAME: 'RC POS',
  VERSION: '1.0.0',
} as const;


import { config } from '@/lib/config/environment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface DatabaseEnvironmentState {
  environment: 'dev' | 'prd';
  setEnvironment: (environment: 'dev' | 'prd') => void;
  initializeForProduction: () => void;
}

// Helper to determine if we're connecting to production server
const isProductionServer = (): boolean => {
  const apiUrl = config.API_BASE_URL;
  // Check if connecting to EC2/production server
  return apiUrl.includes('172.31.') || 
         apiUrl.includes('ec2') || 
         apiUrl.includes('amazonaws') ||
         apiUrl.includes('54.') || // Common EC2 public IP pattern
         (!apiUrl.includes('10.0.2.2') && !apiUrl.includes('localhost') && !apiUrl.includes('127.0.0.1'));
};

export const useDatabaseEnvironmentStore = create<DatabaseEnvironmentState>()(
  persist(
    (set, get) => ({
      environment: 'prd', // Default to production
      setEnvironment: (environment) => {
        console.log(`🗄️ [Store] Setting database environment to: ${environment}`);
        set({ environment });
        // Log after state update to verify
        setTimeout(() => {
          const currentEnv = get().environment;
          console.log(`🗄️ [Store] Database environment is now: ${currentEnv}`);
          console.log(`🗄️ [Store] This value will be sent as X-DB-Environment header in all API requests`);
        }, 100);
      },
      initializeForProduction: () => {
        const isProd = isProductionServer();
        const currentEnv = get().environment;
        
        if (isProd && currentEnv !== 'prd') {
          console.log(`🗄️ [Store] Production server detected, forcing PRD database environment`);
          console.log(`🗄️ [Store] Previous environment was: ${currentEnv}, changing to: prd`);
          set({ environment: 'prd' });
        } else {
          console.log(`🗄️ [Store] Current environment: ${currentEnv}, Server type: ${isProd ? 'Production' : 'Development'}`);
        }
      },
    }),
    {
      name: 'database-environment-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          console.log(`🗄️ [Store] No state to rehydrate, using default 'prd'`);
          return;
        }
        
        const rehydratedEnv = state.environment || 'prd';
        const isProd = isProductionServer();
        
        console.log(`🗄️ [Store] Rehydrated database environment from storage: ${rehydratedEnv}`);
        console.log(`🗄️ [Store] API URL: ${config.API_BASE_URL}`);
        console.log(`🗄️ [Store] Server type: ${isProd ? 'Production (EC2)' : 'Development (localhost)'}`);
        
        // If connecting to production server but store has 'dev', force to 'prd' IMMEDIATELY
        if (isProd && rehydratedEnv === 'dev') {
          console.log(`🗄️ [Store] ⚠️ WARNING: Production server detected but environment is 'dev'`);
          console.log(`🗄️ [Store] ⚠️ Auto-correcting to 'prd' for production server (SYNC)`);
          // Update state synchronously to avoid race conditions
          state.environment = 'prd';
          // Also update the store immediately
          useDatabaseEnvironmentStore.setState({ environment: 'prd' });
        }
      },
    }
  )
);


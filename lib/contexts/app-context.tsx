import { devRoadShowUploadUrl, productionRoadShowUploadUrl } from '@/lib/config/environment';
import React, { createContext, ReactNode, useContext, useState } from 'react';

interface AppContextType {
  useProductionUrl: boolean;
  setUseProductionUrl: (value: boolean) => void;
  uploadUrl: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [useProductionUrl, setUseProductionUrl] = useState(true);
  
  const uploadUrl = useProductionUrl ? productionRoadShowUploadUrl : devRoadShowUploadUrl;

  return (
    <AppContext.Provider
      value={{
        useProductionUrl,
        setUseProductionUrl,
        uploadUrl,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}


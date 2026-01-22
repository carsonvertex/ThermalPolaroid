import React, { createContext, ReactNode, useContext, useState } from 'react';

interface AppContextType {
  useProductionUrl: boolean;
  setUseProductionUrl: (value: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [useProductionUrl, setUseProductionUrl] = useState(true);
  

  return (
    <AppContext.Provider
      value={{
        useProductionUrl,
        setUseProductionUrl,
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


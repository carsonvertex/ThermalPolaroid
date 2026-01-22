import React, { createContext, useContext, useState, ReactNode } from 'react';

type SwipeableTab = 'dashboard' | 'simple-order' | 'order-record';

interface TabContextType {
  activeTab: SwipeableTab;
  setActiveTab: (tab: SwipeableTab) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export const TabProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<SwipeableTab>('dashboard');

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabContext.Provider>
  );
};

export const useTabContext = () => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTabContext must be used within TabProvider');
  }
  return context;
};

// Type guard for type safety
export const isSwipeableTab = (tab: string): tab is SwipeableTab => {
  return ['dashboard', 'simple-order', 'order-record'].includes(tab);
};

export type { SwipeableTab };


import React, { useCallback, useRef } from 'react';
import { useTabContext, isSwipeableTab } from '@/lib/contexts/tab-context';
import SwipeableContainer from './swipeable-container';

type TabsSwipeableContainerProps = {
  children: React.ReactNode[];
  activeIndex: number;
};

export default function TabsSwipeableContainer({
  children,
  activeIndex,
}: TabsSwipeableContainerProps) {
  const { activeTab, setActiveTab } = useTabContext();

  const activeTabRef = useRef(activeTab);

  // Keep ref updated with latest activeTab value
  React.useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const indexToTab = ['dashboard', 'simple-order', 'order-record'] as const;
  const onIndexChange = useCallback(
    (index: number) => {
      // Get the latest activeTab value from ref to avoid stale closure
      const currentActiveTab = activeTabRef.current;
      // Safety check
      if (index < 0 || index >= indexToTab.length) {
        return;
      }

      const newTab = indexToTab[index];
      if (newTab && newTab !== currentActiveTab && isSwipeableTab(newTab)) {
        setActiveTab(newTab);
        // Only navigate if we're not already on the index route
        // This prevents unnecessary re-renders during swiping
        // The SwipeableContainer already handles the visual transition
      }
    },
    [setActiveTab]
  );

  return (
    <SwipeableContainer activeIndex={activeIndex} onIndexChange={onIndexChange}>
      {children}
    </SwipeableContainer>
  );
}


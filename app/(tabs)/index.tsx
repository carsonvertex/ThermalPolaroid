import TabsSwipeableContainer from '@/components/shared/tabs-swipeable-container';
import { isSwipeableTab, useTabContext } from '@/lib/contexts/tab-context';
import { useSegments } from 'expo-router';
import { useEffect } from 'react';
import DashboardScreen from './dashboard';
import OrderRecordScreen from './order-record';
import SimpleOrderScreen from './simple-order';

// Map tab names to indices
const tabToIndex = {
  dashboard: 0,
  'simple-order': 1,
  'order-record': 2,
} as const;

export default function TabsIndex() {
  const { activeTab, setActiveTab } = useTabContext();
  const segments = useSegments();

  // Initialize activeTab to dashboard immediately if not already set
  // This is especially important when redirecting from login
  // We do this in useEffect to avoid side effects during render
  useEffect(() => {
    // Always ensure we have a valid activeTab when on index route
    if (!isSwipeableTab(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [activeTab, setActiveTab]); // Run whenever activeTab changes or on mount

  // Sync activeTab with current route when on a swipeable tab route
  useEffect(() => {
    const currentRoute = segments[segments.length - 1];
    if (currentRoute && isSwipeableTab(currentRoute)) {
      setActiveTab(currentRoute);
    } else {
      // If we're on the index route (not a specific swipeable tab route),
      // ensure we have a valid activeTab
      // This handles redirects from login where activeTab might not be set
      if (!isSwipeableTab(activeTab)) {
        setActiveTab('dashboard');
      }
    }
  }, [segments, setActiveTab, activeTab]);

  // Ensure we always have a valid swipeable tab
  const currentTab = isSwipeableTab(activeTab) ? activeTab : 'dashboard';
  const activeIndex = tabToIndex[currentTab] ?? 0;

  return (
    <TabsSwipeableContainer activeIndex={activeIndex}>
      <DashboardScreen />
      <SimpleOrderScreen />
      <OrderRecordScreen />
    </TabsSwipeableContainer>
  );
}


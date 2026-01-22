import TabsSwipeableContainer from '@/components/shared/tabs-swipeable-container';
import { isSwipeableTab, SwipeableTab, useTabContext } from '@/lib/contexts/tab-context';
import { useSegments } from 'expo-router';
import { useEffect } from 'react';
import PhotoPrintScreen from './photo-print';

// Map tab names to indices
const tabToIndex = {
    'photo-print': 0,
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
      setActiveTab('photo-print' as SwipeableTab);
    }
  }, [activeTab, setActiveTab]); 

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
        setActiveTab('photo-print' as SwipeableTab);
      }
    }
  }, [segments, setActiveTab, activeTab]);

  // Ensure we always have a valid swipeable tab
  const currentTab = isSwipeableTab(activeTab) ? activeTab : 'photo-print' as SwipeableTab  ;
  const activeIndex = tabToIndex[currentTab as keyof typeof tabToIndex] ?? 0;

  return (
    <TabsSwipeableContainer activeIndex={activeIndex}>
      <PhotoPrintScreen/>
      <PhotoPrintScreen/>
    </TabsSwipeableContainer>
  );
}


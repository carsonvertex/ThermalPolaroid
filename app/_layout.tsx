
import '@/global.css';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppProvider } from '@/lib/contexts/app-context';
import { TabProvider } from '@/lib/contexts/tab-context';
import { useUIStore } from '@/lib/stores/ui-store';
import { MD3Theme } from 'react-native-paper/lib/typescript/types';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Custom Blue Theme Palette
const bluePalette = {
  primary40: '#3B82F6', // blue-500
  primary90: '#DBEAFE', // blue-100
  primary10: '#1E3A8A', // blue-900
  primary100: '#FFFFFF',
  primary80: '#93C5FD', // blue-300
  neutral99: '#FAFAFA',
  neutral90: '#F5F5F5',
  neutralVariant90: '#F4F4F5',
  neutralVariant30: '#A1A1AA',
  neutral10: '#18181B',
  neutral0: '#000000',
  neutralVariant50: '#71717A',
  neutralVariant80: '#E4E4E7',
  error40: '#EF4444',
  error90: '#FEE2E2',
  error100: '#FFFFFF',
  error10: '#7F1D1D',
  neutral20: '#27272A',
  neutral95: '#F4F4F5',
};

const darkBluePalette = {
  primary40: '#60A5FA', // blue-400
  primary90: '#1E3A8A', // blue-900
  primary10: '#DBEAFE', // blue-100
  primary100: '#FFFFFF',
  primary80: '#93C5FD', // blue-300
  neutral99: '#18181B',
  neutral90: '#27272A',
  neutralVariant90: '#3F3F46',
  neutralVariant30: '#A1A1AA',
  neutral10: '#FAFAFA',
  neutral0: '#FFFFFF',
  neutralVariant50: '#71717A',
  neutralVariant80: '#52525B',
  error40: '#F87171',
  error90: '#7F1D1D',
  error100: '#FFFFFF',
  error10: '#FEE2E2',
  neutral20: '#F4F4F5',
  neutral95: '#52525B',
};

// Custom Blue Light Theme
const CustomBlueLightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: bluePalette.primary40,
    primaryContainer: bluePalette.primary90,
    onPrimary: bluePalette.primary100,
    onPrimaryContainer: bluePalette.primary10,
    inversePrimary: bluePalette.primary80,
  },
};

// Custom Blue Dark Theme
const CustomBlueDarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: darkBluePalette.primary40,
    primaryContainer: darkBluePalette.primary90,
    onPrimary: darkBluePalette.primary100,
    onPrimaryContainer: darkBluePalette.primary10,
    inversePrimary: darkBluePalette.primary80,
  },
};

// Create a client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function RootLayoutNav() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  const { theme } = useUIStore();
  
  // Use manual theme if set, otherwise fall back to system
  const effectiveTheme = theme === 'auto' ? systemColorScheme : theme;
  const paperTheme = effectiveTheme === 'dark' ? CustomBlueDarkTheme : CustomBlueLightTheme;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
            <TabProvider>
              <ThemeProvider value={effectiveTheme === 'dark' ? DarkTheme : DefaultTheme}>
                <RootLayoutNav />
                <StatusBar style="auto" />
              </ThemeProvider>
            </TabProvider>
          </AppProvider>
        </QueryClientProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

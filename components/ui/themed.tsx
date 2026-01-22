import React from 'react';
import { Text as RNText, View as RNView } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from 'react-native-paper';
import { useUIStore } from '@/lib/stores/ui-store';

// Themed Text Component using React Native Paper
export function ThemedText({ 
  children, 
  style, 
  ...props 
}: {
  children: React.ReactNode;
  style?: any;
  [key: string]: any;
}) {
  const systemColorScheme = useColorScheme();
  const { theme } = useUIStore();
  const paperTheme = useTheme();
  
  const effectiveTheme = theme === 'auto' ? systemColorScheme : theme;
  
  return (
    <RNText 
      style={[
        { color: effectiveTheme === 'dark' ? paperTheme.colors.onSurface : paperTheme.colors.onBackground },
        style
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}

// Themed View Component using React Native Paper
export function ThemedView({ 
  children, 
  style, 
  ...props 
}: {
  children: React.ReactNode;
  style?: any;
  [key: string]: any;
}) {
  const systemColorScheme = useColorScheme();
  const { theme } = useUIStore();
  const paperTheme = useTheme();
  
  const effectiveTheme = theme === 'auto' ? systemColorScheme : theme;
  
  return (
    <RNView 
      style={[
        { backgroundColor: effectiveTheme === 'dark' ? paperTheme.colors.background : paperTheme.colors.surface },
        style
      ]}
      {...props}
    >
      {children}
    </RNView>
  );
}

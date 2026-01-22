import { ThemedText, ThemedView } from '@/components/ui';
import { initializeDatabaseFromBackendAPI, isDatabaseInitialized, resetDatabase } from '@/endpoints/sqlite';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, TouchableOpacity, View } from 'react-native';

export default function DatabaseInitScreen() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    if (Platform.OS === 'web') {
      setIsChecking(false);
      return;
    }

    try {
      setIsChecking(true);
      const initialized = await isDatabaseInitialized();
      setIsInitialized(initialized);
    } catch (error) {
      console.error('Failed to check database status:', error);
      setIsInitialized(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleInitializeDatabase = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'SQLite is not available on web platform');
      return;
    }

    Alert.alert(
      'Initialize Database',
      'This will fetch the database schema from the backend and create the local SQLite database. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Initialize',
          onPress: async () => {
            try {
              setIsInitializing(true);
              
              const result = await initializeDatabaseFromBackendAPI();
              
              if (result.success) {
                // Clear all React Query cache after database initialization
                queryClient.clear();
                
                Alert.alert('Success', result.message, [
                  {
                    text: 'OK',
                    onPress: () => {
                      checkDatabaseStatus();
                    }
                  }
                ]);
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              console.error('Database initialization error:', error);
              Alert.alert('Error', 'Failed to initialize database. Please check your connection to the backend.');
            } finally {
              setIsInitializing(false);
            }
          }
        }
      ]
    );
  };

  const handleResetDatabase = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'SQLite is not available on web platform');
      return;
    }

    Alert.alert(
      'Reset Database',
      'This will delete all local data and reset the database. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsInitializing(true);
              await resetDatabase();
              
              // Clear all React Query cache after database reset
              queryClient.clear();
              
              Alert.alert('Success', 'Database has been reset. Please initialize it again.', [
                {
                  text: 'OK',
                  onPress: () => checkDatabaseStatus()
                }
              ]);
            } catch (error) {
              console.error('Database reset error:', error);
              Alert.alert('Error', 'Failed to reset database');
            } finally {
              setIsInitializing(false);
            }
          }
        }
      ]
    );
  };

  const handleGoToLogin = () => {
    router.replace('/login');
  };

  if (Platform.OS === 'web') {
    return (
      <ThemedView className="flex-1 justify-center items-center px-6">
        <ThemedText className="text-2xl font-bold mb-4">Not Available</ThemedText>
        <ThemedText className="text-center opacity-70">
          SQLite database is not available on web platform.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView contentContainerClassName="flex-grow">
      <ThemedView className="flex-1 justify-center px-6 py-8">
        {/* Header */}
        <View className="mb-8">
          <ThemedText className="text-3xl font-bold text-center mb-2">
            Database Setup
          </ThemedText>
          <ThemedText className="text-base text-center opacity-70">
            Initialize your local SQLite database
          </ThemedText>
        </View>

        {/* Status Card */}
        <View className=" rounded-lg p-6 mb-6 shadow">
          <ThemedText className="text-lg font-semibold mb-3">
            Database Status
          </ThemedText>
          
          {isChecking ? (
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color="#0066CC" />
              <ThemedText className="ml-2 opacity-70">Checking...</ThemedText>
            </View>
          ) : (
            <View className="flex-row items-center">
              <View className={`w-3 h-3 rounded-full mr-2 ${isInitialized ? 'bg-green-500' : 'bg-red-500'}`} />
              <ThemedText className={isInitialized ? 'text-green-600' : 'text-red-600'}>
                {isInitialized ? 'Initialized' : 'Not Initialized'}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Info Card */}
        <View className="bg-blue-50 rounded-lg p-4 mb-6">
          <ThemedText className="text-sm font-semibold mb-2">
            ℹ️ How it works:
          </ThemedText>
          <ThemedText className="text-xs opacity-70 mb-1">
            • Backend provides the SQL schema
          </ThemedText>
          <ThemedText className="text-xs opacity-70 mb-1">
            • Schema is executed on your device's SQLite
          </ThemedText>
          <ThemedText className="text-xs opacity-70 mb-1">
            • Data is stored locally on your device
          </ThemedText>
          <ThemedText className="text-xs opacity-70">
            • Backend must be running on port 8080
          </ThemedText>
        </View>

        {/* Action Buttons */}
        <View className="space-y-3">
          {!isInitialized && (
            <TouchableOpacity
              className={`bg-primary-100 rounded-lg py-4 ${isInitializing ? 'opacity-50' : ''}`}
              onPress={handleInitializeDatabase}
              disabled={isInitializing}>
              {isInitializing ? (
                <View className="flex-row justify-center items-center">
                  <ActivityIndicator size="small" color="#fff" />
                  <ThemedText className="text-white text-center text-lg font-semibold ml-2">
                    Initializing...
                  </ThemedText>
                </View>
              ) : (
                <ThemedText className="text-white text-center text-lg font-semibold">
                  Initialize Database
                </ThemedText>
              )}
            </TouchableOpacity>
          )}

          {isInitialized && (
            <>
              <TouchableOpacity
                className="bg-green-600 rounded-lg py-4"
                onPress={handleGoToLogin}>
                <ThemedText className="text-white text-center text-lg font-semibold">
                  Go to Login
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                className={`bg-red-600 rounded-lg py-4 ${isInitializing ? 'opacity-50' : ''}`}
                onPress={handleResetDatabase}
                disabled={isInitializing}>
                <ThemedText className="text-white text-center text-lg font-semibold">
                  Reset Database
                </ThemedText>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            className="bg-gray-200 rounded-lg py-4"
            onPress={checkDatabaseStatus}>
            <ThemedText className="text-gray-700 text-center text-lg font-semibold">
              Refresh Status
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </ScrollView>
  );
}


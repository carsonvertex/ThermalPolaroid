import { ThemedText } from '@/components/ui';
import { useBackendConnection } from '@/hooks/use-backend-connection';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import { Card, useTheme } from 'react-native-paper';

interface BackendConnectionCardProps {
  language: 'en' | 'zh';
}

export function BackendConnectionCard({ language }: BackendConnectionCardProps) {
  const { isConnected, isChecking, lastChecked, responseTime, error, backendUrl, refresh } = 
    useBackendConnection(30000); // Check every 30 seconds
  const paperTheme = useTheme();

  const InfoRow = ({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) => {
    const valueStyle: any = { fontSize: 14, fontWeight: '500' };
    if (valueColor) {
      valueStyle.color = valueColor;
    }
    
    return (
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: paperTheme.colors.surfaceVariant,
        }}
      >
        <ThemedText style={{ fontSize: 14, opacity: 0.7 }}>{label}</ThemedText>
        <ThemedText style={valueStyle}>
          {value}
        </ThemedText>
      </View>
    );
  };

  const formatTime = (date: Date | null) => {
    if (!date) return language === 'en' ? 'Never' : '從未';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) {
      return language === 'en' ? 'Just now' : '剛剛';
    } else if (diffSecs < 3600) {
      const mins = Math.floor(diffSecs / 60);
      return language === 'en' ? `${mins}m ago` : `${mins}分鐘前`;
    } else {
      return date.toLocaleTimeString();
    }
  };

  return (
    <Card
      style={{
        marginBottom: 16,
        backgroundColor: paperTheme.colors.surface,
      }}
      elevation={2}
    >
      <Card.Content style={{ padding: 16 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <View
            style={{
              backgroundColor: isConnected ? '#4CAF50' : '#F44336',
              padding: 12,
              borderRadius: 12,
              marginRight: 16,
            }}
          >
            <MaterialIcons name="cloud" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontSize: 16, fontWeight: '600', marginBottom: 4 }}>
              {language === 'en' ? 'Backend Connection' : '後端連接'}
            </ThemedText>
            <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
              {language === 'en'
                ? 'Spring Boot API server status'
                : 'Spring Boot API 服務器狀態'}
            </ThemedText>
          </View>
          {/* Refresh Button */}
          <TouchableOpacity
            onPress={refresh}
            disabled={isChecking}
            style={{
              padding: 8,
              opacity: isChecking ? 0.5 : 1,
            }}
          >
            <MaterialIcons 
              name="refresh" 
              size={24} 
              color={paperTheme.colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Connection Status */}
        {isChecking && !lastChecked ? (
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <ActivityIndicator size="large" color={paperTheme.colors.primary} />
            <ThemedText style={{ marginTop: 12, fontSize: 14, opacity: 0.7 }}>
              {language === 'en' ? 'Checking connection...' : '檢查連接中...'}
            </ThemedText>
          </View>
        ) : (
          <View>
            {/* Status */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: paperTheme.colors.surfaceVariant,
              }}
            >
              <ThemedText style={{ fontSize: 14, opacity: 0.7 }}>
                {language === 'en' ? 'Status' : '狀態'}
              </ThemedText>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: isConnected ? '#4CAF50' : '#F44336',
                    marginRight: 8,
                  }}
                />
                <ThemedText 
                  style={{ 
                    fontSize: 14, 
                    fontWeight: '500',
                    color: isConnected ? '#4CAF50' : '#F44336',
                  }}
                >
                  {isConnected
                    ? language === 'en' ? 'Connected' : '已連接'
                    : language === 'en' ? 'Disconnected' : '未連接'}
                </ThemedText>
              </View>
            </View>

            {/* Backend URL */}
            <InfoRow
              label={language === 'en' ? 'Backend URL' : '後端地址'}
              value={backendUrl.replace('http://', '').replace('/api', '')}
            />

            {/* Response Time */}
            {responseTime !== null && (
              <InfoRow
                label={language === 'en' ? 'Response Time' : '響應時間'}
                value={`${responseTime}ms`}
                valueColor={
                  responseTime < 500 
                    ? '#4CAF50' 
                    : responseTime < 1500 
                    ? '#FF9800' 
                    : '#F44336'
                }
              />
            )}

            {/* Last Checked */}
            <InfoRow
              label={language === 'en' ? 'Last Checked' : '最後檢查'}
              value={formatTime(lastChecked)}
            />

            {/* Error Message */}
            {error && (
              <View
                style={{
                  marginTop: 12,
                  padding: 12,
                  backgroundColor: '#FFF3E0',
                  borderRadius: 8,
                  borderLeftWidth: 4,
                  borderLeftColor: '#FF9800',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name="warning" size={20} color="#FF9800" />
                  <ThemedText 
                    style={{ 
                      marginLeft: 8, 
                      fontSize: 13, 
                      color: '#E65100',
                      fontWeight: '500',
                    }}
                  >
                    {language === 'en' ? 'Error: ' : '錯誤：'}{error}
                  </ThemedText>
                </View>
              </View>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );
}


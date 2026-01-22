import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Card, useTheme } from 'react-native-paper';
import { ThemedText } from '@/components/ui';
import { useDeviceInfo } from '@/hooks/use-device-info';

interface DeviceInfoCardProps {
  language: 'en' | 'zh';
}

export function DeviceInfoCard({ language }: DeviceInfoCardProps) {
  const deviceInfo = useDeviceInfo();
  const paperTheme = useTheme();

  const InfoRow = ({ label, value }: { label: string; value: string | null }) => (
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
      <ThemedText style={{ fontSize: 14, fontWeight: '500' }}>
        {value || (language === 'en' ? 'Loading...' : '加載中...')}
      </ThemedText>
    </View>
  );

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
              backgroundColor: '#FF9800',
              padding: 12,
              borderRadius: 12,
              marginRight: 16,
            }}
          >
            <MaterialIcons name="phone-android" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontSize: 16, fontWeight: '600', marginBottom: 4 }}>
              {language === 'en' ? 'Device Information' : '設備信息'}
            </ThemedText>
            <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
              {language === 'en'
                ? 'Hardware and network details'
                : '硬件和網絡詳情'}
            </ThemedText>
          </View>
        </View>

        {/* Device Info */}
        {!deviceInfo.deviceId ? (
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <ActivityIndicator size="large" color={paperTheme.colors.primary} />
          </View>
        ) : (
          <View>
            <InfoRow
              label={language === 'en' ? 'Device ID' : '設備ID'}
              value={deviceInfo.deviceId || null}
            />
            {deviceInfo.deviceIdSource && (
              <InfoRow
                label={language === 'en' ? 'ID Source' : 'ID來源'}
                value={
                  deviceInfo.deviceIdSource === 'native'
                    ? language === 'en' ? 'Native (Android ID / iOS ID)' : '原生 (Android ID / iOS ID)'
                    : deviceInfo.deviceIdSource === 'stored'
                    ? language === 'en' ? 'Stored (Native)' : '已儲存 (原生)'
                    : language === 'en' ? 'Generated (Dev/Emulator)' : '生成 (開發/模擬器)'
                }
              />
            )}
            <InfoRow
              label={language === 'en' ? 'IP Address' : 'IP地址'}
              value={deviceInfo.ipAddress}
            />
            <InfoRow
              label={language === 'en' ? 'Brand' : '品牌'}
              value={deviceInfo.brand}
            />
            <InfoRow
              label={language === 'en' ? 'Model' : '型號'}
              value={deviceInfo.modelName}
            />
            <InfoRow
              label={language === 'en' ? 'OS' : '操作系統'}
              value={deviceInfo.osName ? `${deviceInfo.osName} ${deviceInfo.osVersion}` : null}
            />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingVertical: 8,
              }}
            >
              <ThemedText style={{ fontSize: 14, opacity: 0.7 }}>
                {language === 'en' ? 'Connection' : '連接狀態'}
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
                    backgroundColor: deviceInfo.isConnected ? '#4CAF50' : '#F44336',
                    marginRight: 8,
                  }}
                />
                <ThemedText style={{ fontSize: 14, fontWeight: '500' }}>
                  {deviceInfo.isConnected
                    ? language === 'en'
                      ? 'Online'
                      : '在線'
                    : language === 'en'
                    ? 'Offline'
                    : '離線'}
                </ThemedText>
              </View>
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}


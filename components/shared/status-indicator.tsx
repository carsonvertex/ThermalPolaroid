import { cn } from '@/lib/utils/cn';
import { Text, View } from 'react-native';

export type StatusType = 'online' | 'offline' | 'syncing' | 'error';

export interface StatusIndicatorProps {
  type: StatusType;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig = {
  online: {
    color: 'opacity-70',
    label: 'Online',
  },
  offline: {
    color: 'opacity-40',
    label: 'Offline',
  },
  syncing: {
    color: 'opacity-60',
    label: 'Syncing',
  },
  error: {
    color: 'opacity-50',
    label: 'Error',
  },
};

const sizeClasses = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
};

export function StatusIndicator({
  type,
  showLabel = false,
  size = 'md',
  className,
}: StatusIndicatorProps) {
  const config = statusConfig[type];

  return (
    <View className={cn('flex-row items-center', className)}>
      <View className={cn('rounded-full', config.color, sizeClasses[size])} />
      {showLabel && (
        <Text className="ml-2 text-xs opacity-60">
          {config.label}
        </Text>
      )}
    </View>
  );
}

// Sync Status Indicator Component
export interface SyncStatusIndicatorProps {
  pendingCount: number;
  failedCount: number;
  isSyncing: boolean;
  className?: string;
}

export function SyncStatusIndicator({
  pendingCount,
  failedCount,
  isSyncing,
  className,
}: SyncStatusIndicatorProps) {
  if (isSyncing) {
    return (
      <View className={cn('flex-row items-center', className)}>
        <StatusIndicator type="syncing" showLabel />
      </View>
    );
  }

  if (failedCount > 0) {
    return (
      <View className={cn('flex-row items-center', className)}>
        <StatusIndicator type="error" showLabel />
        <Text className="ml-2 text-xs opacity-60">
          {failedCount} failed
        </Text>
      </View>
    );
  }

  if (pendingCount > 0) {
    return (
      <View className={cn('flex-row items-center', className)}>
        <StatusIndicator type="offline" showLabel />
        <Text className="ml-2 text-xs opacity-60">
          {pendingCount} pending
        </Text>
      </View>
    );
  }

  return (
    <View className={cn('flex-row items-center', className)}>
      <StatusIndicator type="online" showLabel />
    </View>
  );
}


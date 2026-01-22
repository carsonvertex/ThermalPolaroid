import { Button, ButtonText } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import { Text, View } from 'react-native';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon = '📦',
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <View className={cn('items-center justify-center px-6 py-12', className)}>
      <Text className="mb-4 text-6xl">{icon}</Text>
      <Text className="mb-2 text-center text-xl font-semibold">
        {title}
      </Text>
      {description && (
        <Text className="mb-6 text-center text-base opacity-60">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button className="px-6 py-3 rounded-lg" onPress={onAction}>
          <ButtonText className="font-semibold">
            {actionLabel}
          </ButtonText>
        </Button>
      )}
    </View>
  );
}


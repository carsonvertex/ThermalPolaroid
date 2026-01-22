// Avatar components temporarily replaced with simple View
import { cn } from '@/lib/utils/cn';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  rightAction?: React.ReactNode;
  user?: {
    name: string;
    avatar?: string;
    role: string;
  };
  className?: string;
}

export function Header({
  title,
  subtitle,
  showBackButton = false,
  rightAction,
  user,
  className,
}: HeaderProps) {
  const router = useRouter();

  return (
    <View
      className={cn(
        'border-b px-4 py-3',
        className
      )}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center">
          {showBackButton && (
            <TouchableOpacity
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              className="mr-3">
              <Text className="text-2xl opacity-60">←</Text>
            </TouchableOpacity>
          )}
          <View className="flex-1">
            <Text className="text-lg font-semibold">
              {title}
            </Text>
            {subtitle && (
              <Text className="text-sm opacity-60">
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          {/* Online/Offline Status Indicator */}
          <View className="flex-row items-center">
            <View
              className={cn(
                'h-2 w-2 rounded-full',
                true ? 'opacity-70' : 'opacity-40'
              )}
            />
            <Text className="ml-1 text-xs opacity-60">
              {true ? 'Online' : 'Offline'}
            </Text>
          </View>

          {/* User Avatar */}
          {user && (
            <View className="h-10 w-10 rounded-full border-2 items-center justify-center">
              <Text className="text-sm font-semibold">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </Text>
            </View>
          )}

          {/* Right Action */}
          {rightAction}
        </View>
      </View>
    </View>
  );
}


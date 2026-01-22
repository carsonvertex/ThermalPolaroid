import { cn } from '@/lib/utils/cn';
import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  className?: string;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 4, className }: SkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius,
        opacity,
      }}
      className={cn('opacity-20', className)}
    />
  );
}

// Predefined skeleton components
export function ProductCardSkeleton() {
  return (
    <View className="rounded-lg border p-4">
      <Skeleton width={80} height={80} borderRadius={8} className="mb-3" />
      <Skeleton width="80%" height={16} className="mb-2" />
      <Skeleton width="60%" height={14} className="mb-3" />
      <Skeleton width="40%" height={20} />
    </View>
  );
}

export function ListItemSkeleton() {
  return (
    <View className="flex-row items-center border-b p-4">
      <Skeleton width={40} height={40} borderRadius={20} className="mr-3" />
      <View className="flex-1">
        <Skeleton width="70%" height={16} className="mb-2" />
        <Skeleton width="50%" height={14} />
      </View>
    </View>
  );
}

export function CardSkeleton() {
  return (
    <View className="rounded-lg border p-4">
      <Skeleton width="60%" height={20} className="mb-3" />
      <Skeleton width="100%" height={16} className="mb-2" />
      <Skeleton width="100%" height={16} className="mb-2" />
      <Skeleton width="80%" height={16} />
    </View>
  );
}


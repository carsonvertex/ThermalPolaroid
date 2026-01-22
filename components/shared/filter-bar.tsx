import { cn } from '@/lib/utils/cn';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface FilterBarProps {
  options: FilterOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  className?: string;
}

export function FilterBar({ options, selectedValue, onSelect, className }: FilterBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className={cn('flex-row', className)}>
      <View className="flex-row gap-2 px-4">
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => onSelect(option.value)}
            className={cn(
              'rounded-full border-2 px-4 py-2',
              selectedValue === option.value
                ? 'border-opacity-70'
                : 'border-opacity-30'
            )}>
            <Text
              className={cn(
                'text-sm font-medium',
                selectedValue === option.value
                  ? 'opacity-90'
                  : 'opacity-60'
              )}>
              {option.label}
              {option.count !== undefined && ` (${option.count})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}


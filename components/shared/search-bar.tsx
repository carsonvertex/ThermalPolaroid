import { cn } from '@/lib/utils/cn';
import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  showClearButton?: boolean;
  className?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
  showClearButton = true,
  className,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View
      className={cn(
        'flex-row items-center rounded-lg border-2  px-3 py-2',
        isFocused ? 'border-opacity-60' : 'border-opacity-30',
        className
      )}>
      <Text className="mr-2 opacity-60">🔍</Text>
      <TextInput
        className="flex-1 text-base"
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {showClearButton && value.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          accessibilityRole="button"
          accessibilityLabel="Clear search">
          <Text className="opacity-60">✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}


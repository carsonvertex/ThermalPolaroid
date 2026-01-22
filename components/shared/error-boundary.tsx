import { Button, ButtonText } from '@/components/ui';
import React, { Component, ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="mb-4 text-6xl">⚠️</Text>
          <Text className="mb-2 text-center text-xl font-semibold">
            Something went wrong
          </Text>
          <Text className="mb-6 text-center text-base opacity-60">
            An unexpected error occurred. Please try again.
          </Text>
          {this.state.error && (
            <ScrollView className="mb-6 max-h-40 w-full rounded-lg p-4">
              <Text className="font-mono text-xs">
                {this.state.error.message}
              </Text>
            </ScrollView>
          )}
          <Button className="px-6 py-3 rounded-lg" onPress={this.handleReset}>
            <ButtonText className="font-semibold">
              Try Again
            </ButtonText>
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}


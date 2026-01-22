import React from 'react';
import { View, ViewProps } from 'react-native';

type CardSectionProps = ViewProps & {
  className?: string;
  children?: React.ReactNode;
};

export function CardHeader({ children, ...props }: CardSectionProps) {
  return <View {...props}>{children}</View>;
}

export function CardBody({ children, ...props }: CardSectionProps) {
  return <View {...props}>{children}</View>;
}

export function CardFooter({ children, ...props }: CardSectionProps) {
  return <View {...props}>{children}</View>;
}



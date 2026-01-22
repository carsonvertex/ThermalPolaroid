import React from 'react';
import { Linking, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface ExternalLinkProps extends TouchableOpacityProps {
  href: string;
  children: React.ReactNode;
}

export function ExternalLink({ href, children, ...props }: ExternalLinkProps) {
  const handlePress = async () => {
    const canOpen = await Linking.canOpenURL(href);
    if (canOpen) {
      await Linking.openURL(href);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} {...props}>
      {children}
    </TouchableOpacity>
  );
}


import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

/**
 * Custom hook to detect keyboard visibility
 * Returns true when keyboard is visible (TextInput focused)
 * 
 * @returns {boolean} isKeyboardVisible - true when keyboard is shown
 */
export const useKeyboardVisibility = (): boolean => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return isKeyboardVisible;
};


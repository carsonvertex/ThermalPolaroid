import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

/**
 * Context to track focus state of inputs with a specific className group
 */
interface InputFocusContextType {
  isAnyInputFocused: boolean;
  setInputFocused: (focused: boolean) => void;
}

const InputFocusContext = createContext<InputFocusContextType | undefined>(undefined);

/**
 * Provider component that tracks if any input in the group is focused
 */
export function InputFocusProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [focusedCount, setFocusedCount] = useState(0);
  const isAnyInputFocused = focusedCount > 0;

  const setInputFocused = useCallback((focused: boolean) => {
    setFocusedCount((prev) => {
      if (focused) {
        return prev + 1;
      } else {
        return Math.max(0, prev - 1);
      }
    });
  }, []);

  return (
    <InputFocusContext.Provider value={{ isAnyInputFocused, setInputFocused }}>
      {children}
    </InputFocusContext.Provider>
  );
}

/**
 * Hook to use the input focus context
 * Returns true if any input in the group is currently focused
 */
export function useInputFocusGroup(): boolean {
  const context = useContext(InputFocusContext);
  if (!context) {
    // If no provider, return false (no inputs focused)
    return false;
  }
  return context.isAnyInputFocused;
}

/**
 * Hook to get the setter function for input focus
 * Components should call this when their inputs focus/blur
 */
export function useInputFocusSetter(): (focused: boolean) => void {
  const context = useContext(InputFocusContext);
  if (!context) {
    return () => {}; // No-op if no provider
  }
  return context.setInputFocused;
}


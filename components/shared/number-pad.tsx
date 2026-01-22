// components/shared/number-pad.tsx
import { useLanguageStore } from "@/lib/stores/language-store";
import { useEffect, useRef, useState } from "react";
import { Text as RNText, TextInput, TouchableOpacity, View } from "react-native";
import { useTheme } from "react-native-paper";

interface NumberPadProps {
  value?: string;
  onChange?: (value: string) => void;
  onConfirm?: (value: string) => void;
  onCancel?: () => void;
  hasDecimal?: boolean;
  showDisplay?: boolean;
  maxLength?: number;
  maxDecimals?: number;
  displayPrefix?: string;
  disabled?: boolean;
  title?: string;
}

export default function NumberPad({
  value = "",
  onChange,
  onConfirm,
  onCancel,
  hasDecimal = true,
  showDisplay = true,
  maxLength,
  maxDecimals = 2,
  displayPrefix = "$",
  disabled = false,
  title,
}: NumberPadProps) {
  const theme = useTheme();
  const { language } = useLanguageStore();
  // Local state that updates immediately - independent of prop changes while user is typing
  const [displayValue, setDisplayValue] = useState( "0");
  const previousValueRef = useRef<string>(value || "0");
  const inputRef = useRef<TextInput>(null);
  const cursorPositionRef = useRef<number>(0);
  const isInputFocusedRef = useRef<boolean>(false);
  const pendingCursorPosRef = useRef<number | null>(null);
  const isProgrammaticUpdateRef = useRef<boolean>(false);

  // Reset to initial value each time the value prop changes (when modal opens with new value)
  useEffect(() => {
    if (value !== undefined) {
      let newValue = value || "0";
      // If the value prop changed from outside (e.g., modal opened with new initial value), reset
      if (previousValueRef.current !== newValue) {
        // If hasDecimal is true and value doesn't have a decimal point, add one
        if (hasDecimal && !newValue.includes(".") && newValue !== "0") {
          newValue = newValue + ".";
        }
        
        setDisplayValue(newValue);
        previousValueRef.current = newValue;
        
        // Position cursor right after the decimal point if it exists, otherwise at end
        if (newValue.includes(".")) {
          const decimalIndex = newValue.indexOf(".");
          cursorPositionRef.current = decimalIndex + 1; // Position after decimal point
        } else {
          // Reset cursor to end of value if no decimal point
          cursorPositionRef.current = newValue.length;
        }
        
        // Auto-focus immediately using requestAnimationFrame for better timing
        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            // Set cursor position after focus
            setTimeout(() => {
              if (inputRef.current) {
                const cursorPos = newValue.includes(".") 
                  ? newValue.indexOf(".") + 1 // Position after decimal point
                  : newValue.length;
                const textInputCursorPos = cursorPos + displayPrefix.length;
                inputRef.current.setNativeProps({
                  selection: { start: textInputCursorPos, end: textInputCursorPos }
                });
              }
            }, 50);
          }
        });
      }
    }
  }, [value, displayPrefix, hasDecimal]);

  // Remove leading zeros (but keep "0" or "0." if that's the value)
  const removeLeadingZeros = (val: string): string => {
    if (!val || val === "0" || val === "0.") return val;
    if (val.startsWith("0.")) return val; // Keep "0.5" as is
    
    // Remove leading zeros from integer part
    const parts = val.split(".");
    if (parts.length > 1) {
      // Has decimal point
      const integerPart = parts[0].replace(/^0+/, "") || "0";
      return `${integerPart}.${parts[1]}`;
    } else {
      // No decimal point
      return val.replace(/^0+/, "") || "0";
    }
  };

  // Update cursor position after displayValue changes
  useEffect(() => {
    if (pendingCursorPosRef.current !== null && inputRef.current && isInputFocusedRef.current && isProgrammaticUpdateRef.current) {
      let textInputCursorPos = pendingCursorPosRef.current + displayPrefix.length;
      let cursorPos = pendingCursorPosRef.current;
      
      // Auto-focus to before decimal point if value has a decimal point
      if (hasDecimal && displayValue.includes(".")) {
        const parts = displayValue.split(".");
        // Always move cursor before decimal point when a number is pressed
        cursorPos = parts[0].length;
        textInputCursorPos = cursorPos + displayPrefix.length;
        cursorPositionRef.current = cursorPos;
      }
      
      // Use requestAnimationFrame followed by setTimeout to ensure the TextInput has fully updated
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (inputRef.current && isInputFocusedRef.current) {
            // Double-check the value matches what we expect
            const currentText = `${displayPrefix}${displayValue}`;
            inputRef.current.setNativeProps({
              text: currentText,
              selection: { start: textInputCursorPos, end: textInputCursorPos }
            });
            // Update the cursor position ref to match
            cursorPositionRef.current = cursorPos;
          }
          pendingCursorPosRef.current = null;
          isProgrammaticUpdateRef.current = false;
        }, 50);
      });
    }
  }, [displayValue, displayPrefix, hasDecimal]);

  const handleNumberPress = (num: string) => {
    if (disabled) return;

    // Ensure input is focused when a number button is pressed
    if (!isInputFocusedRef.current && inputRef.current) {
      inputRef.current.focus();
      isInputFocusedRef.current = true;
    }

    let newValue: string;
    let newCursorPos: number;
    
    // If TextInput is focused, insert at cursor position
    if (isInputFocusedRef.current && cursorPositionRef.current >= 0) {
      const valueWithoutPrefix = displayValue;
      const cursorPos = cursorPositionRef.current;
      
      // If cursor is at the start and value is "0", replace it
      if (cursorPos === 0 && valueWithoutPrefix === "0") {
        newValue = num;
        newCursorPos = 1;
      } else {
        const beforeCursor = valueWithoutPrefix.slice(0, cursorPos);
        const afterCursor = valueWithoutPrefix.slice(cursorPos);
        newValue = beforeCursor + num + afterCursor;
        newCursorPos = cursorPos + 1;
      }
      
      cursorPositionRef.current = newCursorPos;
    } else {
      // Default behavior: append to end or replace "0"
      newValue = displayValue === "0" ? num : displayValue + num;
      newCursorPos = newValue.length;
      cursorPositionRef.current = newCursorPos;
    }

    // Check max length (excluding decimal point)
    if (maxLength) {
      const withoutDot = newValue.replace(".", "");
      if (withoutDot.length > maxLength) return;
    }

    // Check max decimals - prevent typing beyond maxDecimals
    if (hasDecimal && newValue.includes(".")) {
      const parts = newValue.split(".");
      if (parts[1] && parts[1].length > maxDecimals) {
        return; // Don't allow typing beyond maxDecimals
      }
    }

    // Remove leading zeros (but keep "0" or "0." if that's the value)
    newValue = removeLeadingZeros(newValue);
    
    // Auto-focus to before decimal point if value has a decimal point
    if (hasDecimal && newValue.includes(".")) {
      const parts = newValue.split(".");
      newCursorPos = parts[0].length; // Position before decimal point
      cursorPositionRef.current = newCursorPos;
    }
    
    // Adjust cursor position if value changed due to leading zero removal
    if (newValue !== displayValue && isInputFocusedRef.current && !newValue.includes(".")) {
      const oldLength = displayValue.length;
      const newLength = newValue.length;
      const lengthDiff = oldLength - newLength;
      if (lengthDiff > 0 && newCursorPos > 0) {
        newCursorPos = Math.max(0, newCursorPos - lengthDiff);
        cursorPositionRef.current = newCursorPos;
      }
    }

    // Update local state immediately - don't call onChange here
    setDisplayValue(newValue);
    
    // Store cursor position to be applied after state update
    if (isInputFocusedRef.current) {
      pendingCursorPosRef.current = newCursorPos;
    }
  };

  const handleDecimalPress = () => {
    if (disabled || !hasDecimal || displayValue.includes(".")) return;

    const newValue = displayValue === "0" ? "0." : displayValue + ".";
    // Update local state immediately - don't call onChange here
    setDisplayValue(newValue);
    // onChange?.(newValue);
  };

  const handleBackspace = () => {
    if (disabled) return;

    let newValue: string;
    let newCursorPos: number;
    
    // If TextInput is focused, delete at cursor position
    if (isInputFocusedRef.current && cursorPositionRef.current > 0) {
      const valueWithoutPrefix = displayValue;
      const cursorPos = cursorPositionRef.current;
      const beforeCursor = valueWithoutPrefix.slice(0, cursorPos - 1);
      const afterCursor = valueWithoutPrefix.slice(cursorPos);
      newValue = beforeCursor + afterCursor || "0";
      
      // Update cursor position
      newCursorPos = Math.max(0, cursorPos - 1);
      cursorPositionRef.current = newCursorPos;
    } else {
      // Default behavior: delete from end
      newValue = displayValue.length <= 1 ? "0" : displayValue.slice(0, -1) || "0";
      newCursorPos = newValue.length;
      cursorPositionRef.current = newCursorPos;
    }
    
    // Mark as programmatic update and store cursor position
    if (isInputFocusedRef.current) {
      isProgrammaticUpdateRef.current = true;
      pendingCursorPosRef.current = newCursorPos;
    }
    
    // Update local state immediately - don't call onChange here
    setDisplayValue(newValue);
  };

  const handleClear = () => {
    if (disabled) return;
    setDisplayValue("0");
    cursorPositionRef.current = 1; // Position after "0"
    if (inputRef.current) {
      inputRef.current.setNativeProps({ 
        text: `${displayPrefix}0`,
        selection: { start: displayPrefix.length + 1, end: displayPrefix.length + 1 }
      });
    }
  };

  const handleConfirm = () => {
    if (disabled) return;

    let finalValue = displayValue;

    if (finalValue.endsWith(".")) {
      finalValue = finalValue.slice(0, -1);
    }

    if (!finalValue || finalValue === "0.") {
      finalValue = "0";
    }

    if (hasDecimal && finalValue.includes(".")) {
      const parts = finalValue.split(".");
      if (parts[1] && parts[1].length > maxDecimals) {
        finalValue = parseFloat(finalValue).toFixed(maxDecimals);
      }
    }

    // Update local state with formatted value
    setDisplayValue(finalValue);
    // Only push value to parent on confirm
    onChange?.(finalValue);
    onConfirm?.(finalValue);
  };

  const formatDisplayValue = (val: string): string => {
    if (!val || val === "0") return "0";
    if (val === ".") return "0.";
    if (val.endsWith(".")) return val;

    if (hasDecimal && val.includes(".")) {
      const [integer, decimal = ""] = val.split(".");
      const limitedDecimal = decimal.slice(0, maxDecimals);
      return limitedDecimal ? `${integer}.${limitedDecimal}` : integer;
    }

    return val;
  };

  const renderButton = (
    label: string,
    onPress: () => void,
    style?: "number" | "action" | "confirm",
    flex: number = 1
  ) => {
    const isNumber = style === "number";
    const isAction = style === "action";
    const isConfirm = style === "confirm";

    const buttonStyle: any = {
      flex,
      height: 50,
      backgroundColor: isConfirm
        ? theme.colors.primary
        : isAction
        ? theme.colors.surfaceVariant
        : theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isConfirm ? theme.colors.primary : theme.colors.outline,
      justifyContent: "center",
      alignItems: "center",
      opacity: disabled ? 0.5 : 1,
    };

    const textStyle: any = {
      fontSize: 24,
      fontWeight: isConfirm ? "bold" : "600",
      color: isConfirm
        ? theme.colors.onPrimary
        : isAction
        ? theme.colors.onSurfaceVariant
        : theme.colors.onSurface,
    };

    return (
      <TouchableOpacity
        style={buttonStyle}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <RNText style={textStyle}>{label}</RNText>
      </TouchableOpacity>
    );
  };

  return (
    <View className="w-full p-4" style={{ backgroundColor: theme.colors.surface }}>
      {title && (
        <RNText
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: theme.colors.onSurface,
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          {title}
        </RNText>
      )}
      {showDisplay && (
        <View
          className="p-4 rounded-lg mb-4 min-h-[80px]"
          style={{ backgroundColor: theme.colors.surfaceVariant }}
        >
          <TextInput
            ref={inputRef}
            value={`${displayPrefix}${displayValue}`}
            onChangeText={(text) => {
              if (disabled) return;
              
              // Skip if this is a programmatic update (from button press)
              if (isProgrammaticUpdateRef.current) {
                return;
              }
              
              // Remove prefix and clean the input
              let cleaned = text.replace(displayPrefix, "").replace(/[^0-9.]/g, "");
              
              // Prevent multiple decimal points
              const parts = cleaned.split(".");
              if (parts.length > 2) {
                cleaned = parts[0] + "." + parts.slice(1).join("");
              }
              
              // Check max decimals
              if (hasDecimal && cleaned.includes(".")) {
                const decimalParts = cleaned.split(".");
                if (decimalParts[1] && decimalParts[1].length > maxDecimals) {
                  // Limit to maxDecimals
                  cleaned = decimalParts[0] + "." + decimalParts[1].slice(0, maxDecimals);
                }
              }
              
              // Check max length
              if (maxLength) {
                const withoutDot = cleaned.replace(".", "");
                if (withoutDot.length > maxLength) {
                  return; // Don't update if exceeds max length
                }
              }
              
              // Update if valid
              if (cleaned === "" || cleaned === ".") {
                setDisplayValue("0");
                cursorPositionRef.current = 1;
              } else {
                // Remove leading zeros
                const formatted = removeLeadingZeros(cleaned);
                setDisplayValue(formatted);
                // Update cursor position (approximate - will be adjusted by onSelectionChange)
                cursorPositionRef.current = formatted.length;
              }
            }}
            onSelectionChange={(event) => {
              const { start } = event.nativeEvent.selection;
              // Adjust cursor position to account for prefix
              cursorPositionRef.current = Math.max(0, start - displayPrefix.length);
            }}
            onFocus={() => {
              isInputFocusedRef.current = true;
              
              // Position cursor right before decimal point if it exists
              if (displayValue.includes(".")) {
                const decimalIndex = displayValue.indexOf(".");
                cursorPositionRef.current = decimalIndex;
                setTimeout(() => {
                  if (inputRef.current) {
                    const textInputCursorPos = decimalIndex + displayPrefix.length;
                    inputRef.current.setNativeProps({
                      selection: { start: textInputCursorPos, end: textInputCursorPos }
                    });
                  }
                }, 50);
              }
            }}
            onBlur={() => {
              isInputFocusedRef.current = false;
            }}
            style={{
              fontSize: 36,
              fontWeight: "bold",
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
              letterSpacing: 1,
            }}
            keyboardType="decimal-pad"
            editable={!disabled}
            showSoftInputOnFocus={false}
          />
        </View>
      )}

      <View className="gap-3">
        <View className="flex-row gap-3">
          {renderButton("1", () => handleNumberPress("1"), "number")}
          {renderButton("2", () => handleNumberPress("2"), "number")}
          {renderButton("3", () => handleNumberPress("3"), "number")}
        </View>

        <View className="flex-row gap-3">
          {renderButton("4", () => handleNumberPress("4"), "number")}
          {renderButton("5", () => handleNumberPress("5"), "number")}
          {renderButton("6", () => handleNumberPress("6"), "number")}
        </View>

        <View className="flex-row gap-3">
          {renderButton("7", () => handleNumberPress("7"), "number")}
          {renderButton("8", () => handleNumberPress("8"), "number")}
          {renderButton("9", () => handleNumberPress("9"), "number")}
        </View>

        <View className="flex-row gap-3">
          {renderButton("<<", handleBackspace, "action")}
          {renderButton("0", () => handleNumberPress("0"), "number")}
          {hasDecimal
            ? renderButton(".", handleDecimalPress, "action")
            : renderButton(
                language === "en" ? "Confirm" : "確認",
                handleConfirm,
                "confirm"
              )}
        </View>

        <View className="flex-row gap-3">
          {onCancel && renderButton(
            language === "en" ? "Cancel" : "取消",
            onCancel,
            "action",
            hasDecimal ? 1 : 0.75
          )}
          {renderButton(
            language === "en" ? "Clear" : "清除",
            handleClear,
            "action",
            hasDecimal ? (onCancel ? 1 : 1.5) : (onCancel ? 1 : 1)
          )}
          {hasDecimal && renderButton(
            language === "en" ? "Confirm" : "確認",
            handleConfirm,
            "confirm",
            onCancel ? 1 : 1.5
          )}
        </View>
      </View>
    </View>
  );
}
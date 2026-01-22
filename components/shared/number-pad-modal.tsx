import { useEffect, useRef, useState } from "react";
import { Dimensions, View } from "react-native";
import { Modal, Portal, useTheme } from "react-native-paper";
import NumberPad from "./number-pad";

interface NumberPadModalProps {
  visible: boolean;
  onDismiss: () => void;
  value: string;
  onChange: (value: string) => void;
  onConfirm: (value: string) => void;
  hasDecimal?: boolean;
  maxLength?: number;
  maxDecimals?: number;
  displayPrefix?: string;
  title?: string;
}

export default function NumberPadModal({
  visible,
  onDismiss,
  value,
  onChange,
  onConfirm,
  hasDecimal = true,
  maxLength,
  maxDecimals = 2,
  displayPrefix = "$",
  title,
}: NumberPadModalProps) {
  const screenHeight = Dimensions.get("window").height;
  const theme = useTheme();
  // Local state for the number pad - updates immediately when user types
  const [localValue, setLocalValue] = useState(value || "0");
  const prevVisibleRef = useRef(false);

  // Reset to initial value each time modal opens
  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      // Modal just opened - reset to initial value
      setLocalValue(value || "0");
    }
    prevVisibleRef.current = visible;
  }, [visible, value]);

  const handleChange = (newValue: string) => {
    // Don't update localValue here - NumberPad manages its own display state
    // We only need to track it for the final confirm
    // Don't call onChange here - only update parent on confirm
  };

  const handleConfirm = (finalValue: string) => {
    // Push value to parent only on confirm
    setLocalValue(finalValue);
    onChange(finalValue);
    onConfirm(finalValue);
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={{
          padding: 0,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          backgroundColor: theme.colors.surface,
          maxHeight: screenHeight * 0.7,
        }}
        style={{ margin: 0, justifyContent: "flex-end" }}
      >
        <View style={{ paddingBottom: 20 }}>
          <NumberPad
            key={visible ? `number-pad-${value}` : undefined}
            value={localValue}
            onChange={handleChange}
            onConfirm={handleConfirm}
            onCancel={onDismiss}
            hasDecimal={hasDecimal}
            showDisplay={true}
            maxLength={maxLength}
            maxDecimals={maxDecimals}
            displayPrefix={displayPrefix}
            title={title}
          />
        </View>
      </Modal>
    </Portal>
  );
}


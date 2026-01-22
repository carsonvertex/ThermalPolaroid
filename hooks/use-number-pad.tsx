import NumberPadModal from "@/components/shared/number-pad-modal";
import { useCallback, useState } from "react";

interface UseNumberPadOptions {
  hasDecimal?: boolean;
  maxLength?: number;
  maxDecimals?: number;
  displayPrefix?: string;
  onConfirm?: (value: string) => void;
  title?: string;
}

export function useNumberPad(options: UseNumberPadOptions = {}) {
  const [visible, setVisible] = useState(false);
  const [currentValue, setCurrentValue] = useState("0");
  const [onChangeCallback, setOnChangeCallback] = useState<
    ((value: string) => void) | null
  >(null);

  const {
    hasDecimal = true,
    maxLength,
    maxDecimals = 2,
    displayPrefix = "$",
    onConfirm: onConfirmCallback,
    title,
  } = options;

  const open = useCallback(
    (initialValue: string = "", onChange?: (value: string) => void) => {
      setCurrentValue(initialValue || "0");
      setOnChangeCallback(onChange || null);
      setVisible(true);
    },
    []
  );

  const close = useCallback(() => {
    setVisible(false);
    setCurrentValue("0");
    setOnChangeCallback(null);
  }, []);

  const handleChange = useCallback(
    (value: string) => {
      setCurrentValue(value);
      if (onChangeCallback) {
        onChangeCallback(value);
      }
    },
    [onChangeCallback]
  );

  const handleConfirm = useCallback(
    (value: string) => {
      if (onChangeCallback) {
        onChangeCallback(value);
      }
      if (onConfirmCallback) {
        onConfirmCallback(value);
      }
      close();
    },
    [onChangeCallback, onConfirmCallback, close]
  );

  return {
    open,
    close,
    NumberPadModal: () => (
      <NumberPadModal
        visible={visible}
        onDismiss={close}
        value={currentValue}
        onChange={handleChange}
        onConfirm={handleConfirm}
        hasDecimal={hasDecimal}
        maxLength={maxLength}
        maxDecimals={maxDecimals}
        displayPrefix={displayPrefix}
        title={title}
      />
    ),
    isOpen: visible,
  };
}

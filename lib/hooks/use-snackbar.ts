import { useState } from "react";

type SnackbarType = "success" | "error" | "info" | "warning";

export const useSnackbar = () => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<SnackbarType>("success");

  const showSnackbar = (
    msg: string,
    snackbarType: SnackbarType = "success",
    duration: number = 1000
  ) => {
    setMessage(msg);
    setType(snackbarType);
    setVisible(true);

    setTimeout(() => {
      setVisible(false);
    }, duration);
  };

  const hideSnackbar = () => {
    setVisible(false);
  };

  return {
    visible,
    message,
    type,
    showSnackbar,
    hideSnackbar,
  };
};


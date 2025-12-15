import { useState, useCallback } from "react";
import ToastContainer from "../components/toastContainer";
import { ToastContext } from "./toastContext";

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(({ title, description = "", duration = 3000 }) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, description }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};



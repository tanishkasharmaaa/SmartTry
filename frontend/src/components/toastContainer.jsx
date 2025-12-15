import { useState } from "react";
import { Box, useColorModeValue } from "@chakra-ui/react";

const ToastContainer = ({ toasts, removeToast }) => {
  const bgColor = useColorModeValue("#000", "#fff");
  const textColor = useColorModeValue("#fff", "#000");
  const descColor = useColorModeValue("#bbb", "#555");

  const [leavingToasts, setLeavingToasts] = useState([]);

  const handleRemove = (id) => {
    setLeavingToasts((prev) => [...prev, id]);

    setTimeout(() => {
      removeToast(id);
      setLeavingToasts((prev) => prev.filter((t) => t !== id));
    }, 350);
  };

  return (
    <div style={containerStyle}>
      {toasts.map((toast) => {
        const isLeaving = leavingToasts.includes(toast.id);

        return (
          <Box
            key={toast.id}
            bg={bgColor}
            color={textColor}
            sx={{
              ...toastStyle,
              animation: isLeaving
                ? "slideOut 0.35s ease-in forwards"
                : "slideIn 0.4s ease-out",
            }}
          >
            <strong>{toast.title}</strong>

            {toast.description && (
              <p style={{ ...descStyle, color: descColor }}>
                {toast.description}
              </p>
            )}

            <span onClick={() => handleRemove(toast.id)} style={closeBtn}>
              ✕
            </span>
          </Box>
        );
      })}

      <style>
        {`
          @keyframes slideIn {
            0% {
              opacity: 0;
              transform: translateX(40px) scale(0.95);
            }
            100% {
              opacity: 1;
              transform: translateX(0) scale(1);
            }
          }

          @keyframes slideOut {
            0% {
              opacity: 1;
              transform: translateX(0) scale(1);
            }
            100% {
              opacity: 0;
              transform: translateX(60px) scale(0.95);
            }
          }
        `}
      </style>
    </div>
  );
};

export default ToastContainer;

const containerStyle = {
  position: "fixed",
  top: "20px",
  right: "20px",
  zIndex: 9999,
};

const toastStyle = {
  padding: "14px 18px",
  borderRadius: "8px",
  marginBottom: "12px",
  minWidth: "280px",
  position: "relative",
  boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
};

const descStyle = {
  marginTop: "6px",
  fontSize: "14px",
};

const closeBtn = {
  position: "absolute",
  right: "10px",
  top: "8px",
  cursor: "pointer",
  fontSize: "14px",
  opacity: 0.7,
};

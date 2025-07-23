"use client";

import { useState, useEffect } from "react";

export interface ToastProps {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
  onClose: (id: string) => void;
}

interface ToastContextType {
  toasts: ToastProps[];
  addToast: (toast: Omit<ToastProps, "id" | "onClose">) => void;
  removeToast: (id: string) => void;
}

let toastContext: ToastContextType | null = null;

export function Toast({
  id,
  message,
  type,
  duration = 3000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "error":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      case "warning":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
      case "info":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const getStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-50 text-green-800 border-green-200";
      case "error":
        return "bg-red-50 text-red-800 border-red-200";
      case "warning":
        return "bg-yellow-50 text-yellow-800 border-yellow-200";
      case "info":
        return "bg-blue-50 text-blue-800 border-blue-200";
    }
  };

  return (
    <div
      className={`
        flex items-center gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm
        transform transition-all duration-300 ease-out
        ${getStyles()}
        animate-in slide-in-from-bottom-2
      `}
      style={{
        animation: "slideUp 0.3s ease-out",
      }}
    >
      <div className="flex-shrink-0">{getIcon()}</div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-5">{message}</p>
      </div>

      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
        aria-label="Close notification"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (toast: Omit<ToastProps, "id" | "onClose">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: removeToast,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Exposer les fonctions globalement
  useEffect(() => {
    toastContext = {
      toasts,
      addToast,
      removeToast,
    };
  }, [toasts]);

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} />
        </div>
      ))}
    </div>
  );
}

// Fonctions utilitaires pour afficher des toasts
export const showToast = {
  success: (message: string, duration?: number) => {
    toastContext?.addToast({ message, type: "success", duration });
  },
  error: (message: string, duration?: number) => {
    toastContext?.addToast({ message, type: "error", duration });
  },
  warning: (message: string, duration?: number) => {
    toastContext?.addToast({ message, type: "warning", duration });
  },
  info: (message: string, duration?: number) => {
    toastContext?.addToast({ message, type: "info", duration });
  },
};

// Hook pour utiliser les toasts dans les composants
export function useToast() {
  return {
    showSuccess: (message: string, duration?: number) =>
      showToast.success(message, duration),
    showError: (message: string, duration?: number) =>
      showToast.error(message, duration),
    showWarning: (message: string, duration?: number) =>
      showToast.warning(message, duration),
    showInfo: (message: string, duration?: number) =>
      showToast.info(message, duration),
  };
}

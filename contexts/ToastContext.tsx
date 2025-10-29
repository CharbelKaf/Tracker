import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import Toast, { type ToastProps, type ToastType } from '../components/Toast';

interface ToastContextType {
  addToast: (message: string, type: ToastType, options?: { actionLabel?: string; onAction?: () => void }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastMessage extends Omit<ToastProps, 'onDismiss'> {}

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const counterRef = useRef(0);

  const addToast = useCallback((message: string, type: ToastType, options?: { actionLabel?: string; onAction?: () => void }) => {
    counterRef.current += 1;
    const id = `toast-${Date.now()}-${counterRef.current}`;
    setToasts((prevToasts) => [...prevToasts, { id, message, type, actionLabel: options?.actionLabel, onAction: options?.onAction }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div 
        aria-live="polite"
        role="status"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 lg:bottom-auto lg:top-6 lg:left-auto lg:right-6 lg:translate-x-0 z-50 w-full max-w-sm p-4 lg:p-0 space-y-3"
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
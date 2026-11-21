'use client';

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import type { ToastMessage } from '@/app/components/Toast';
interface ToastContextType {
  messages: ToastMessage[];
  addMessage: (message: Omit<ToastMessage, 'id'>) => string;
  removeMessage: (id: string) => void;
  showError: (message: string, duration?: number) => string;
  showWarning: (message: string, duration?: number) => string;
  showSuccess: (message: string, duration?: number) => string;
  showInfo: (message: string, duration?: number) => string;
  clearAll: () => void;
}

// Тосты живут в контексте, чтобы сообщения из любых компонентов
// (карточек, вкладок, кнопок) попадали в один общий список
const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const removeMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  const addMessage = useCallback((message: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 11);
    const duration = message.duration ?? 5000;

    setMessages(prev => [...prev, { ...message, id, duration }]);
    setTimeout(() => removeMessage(id), duration);

    return id;
  }, [removeMessage]);

  const showError = useCallback(
    (message: string, duration?: number) => addMessage({ type: 'error', message, duration }),
    [addMessage],
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => addMessage({ type: 'warning', message, duration }),
    [addMessage],
  );

  const showSuccess = useCallback(
    (message: string, duration?: number) => addMessage({ type: 'success', message, duration }),
    [addMessage],
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => addMessage({ type: 'info', message, duration }),
    [addMessage],
  );

  const clearAll = useCallback(() => setMessages([]), []);

  const value = useMemo(
    () => ({ messages, addMessage, removeMessage, showError, showWarning, showSuccess, showInfo, clearAll }),
    [messages, addMessage, removeMessage, showError, showWarning, showSuccess, showInfo, clearAll],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

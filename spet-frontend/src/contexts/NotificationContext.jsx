// ============================================================
// SPET — Notification / Toast + Confirm Banner Context
// ============================================================

import { createContext, useContext, useState, useCallback, useRef } from 'react';

const NotificationContext = createContext(null);

let toastId = 0;

export function NotificationProvider({ children }) {
  const [toasts,        setToasts]        = useState([]);
  const [notifCount,    setNotifCount]     = useState(0);
  const [confirmBanner, setConfirmBanner]  = useState(null);
  const confirmResolveRef = useRef(null);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, type, title, message }]);
    if (duration > 0) {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }
    return id;
  }, []);

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      confirmResolveRef.current = resolve;
      setConfirmBanner({ message });
    });
  }, []);

  const resolveConfirm = useCallback((result) => {
    if (confirmResolveRef.current) {
      confirmResolveRef.current(result);
      confirmResolveRef.current = null;
    }
    setConfirmBanner(null);
  }, []);

  const toast = {
    success: (title, message) => addToast({ type: 'success', title, message }),
    error:   (title, message) => addToast({ type: 'error',   title, message }),
    warning: (title, message) => addToast({ type: 'warning', title, message }),
    info:    (title, message) => addToast({ type: 'info',    title, message }),
  };

  return (
    <NotificationContext.Provider value={{
      toasts, addToast, removeToast, toast,
      notifCount, setNotifCount,
      confirmBanner, confirm, resolveConfirm,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be inside NotificationProvider');
  return ctx;
};

export default NotificationContext;

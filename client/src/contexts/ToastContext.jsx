import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';
import styles from './ToastContext.module.css';

const ToastContext = createContext(undefined);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const Toast = ({ toast, onRemove }) => {
  const Icon = ICONS[toast.type] || Info;
  return (
    <motion.div
      layout
      className={`${styles.toast} ${styles[toast.type]}`}
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <div className={styles.toastIcon}>
        <Icon size={18} />
      </div>
      <div className={styles.toastBody}>
        {toast.title && <p className={styles.toastTitle}>{toast.title}</p>}
        <p className={styles.toastMessage}>{toast.message}</p>
      </div>
      <button
        className={styles.toastClose}
        onClick={() => onRemove(toast.id)}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = 'info', title, message, duration = 4000 }) => {
      const id = ++counter.current;
      setToasts((prev) => [...prev.slice(-4), { id, type, title, message }]);
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
      return id;
    },
    [removeToast]
  );

  const toast = {
    success: (message, title) => addToast({ type: 'success', message, title }),
    error: (message, title) => addToast({ type: 'error', message, title, duration: 6000 }),
    warning: (message, title) => addToast({ type: 'warning', message, title }),
    info: (message, title) => addToast({ type: 'info', message, title }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <div className={styles.toastContainer}>
          <AnimatePresence mode="popLayout">
            {toasts.map((t) => (
              <Toast key={t.id} toast={t} onRemove={removeToast} />
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

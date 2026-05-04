import { useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import { IconX, IconCheck, IconWarning, IconInfo } from '@/components/icons';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextValue {
  toast: (message: string, type?: ToastItem['type']) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastContainer({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastItem['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* bottom-20 on mobile so toasts clear the tab bar */}
      <div className="fixed bottom-20 sm:bottom-4 right-4 z-60 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence initial={false}>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 56, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 56, scale: 0.9 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
            >
              <Toast {...t} onDismiss={() => dismiss(t.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

interface ToastProps extends ToastItem {
  onDismiss: () => void;
}

export function Toast({ message, type, onDismiss }: ToastProps) {
  const Icon = type === 'success' ? IconCheck : type === 'error' ? IconWarning : IconInfo;
  return (
    <div className={cn(
      'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-(--radius-r3) border shadow-lg min-w-65 max-w-95',
      'bg-(--c-elevated) border-(--c-line-2) text-(--c-text)',
    )}>
      <Icon
        size={16}
        className={cn({
          'text-(--c-grade-a)': type === 'success',
          'text-(--c-grade-e)': type === 'error',
          'text-(--c-accent)': type === 'info',
        })}
      />
      <span className="text-[14px] flex-1">{message}</span>
      <button onClick={onDismiss} className="text-(--c-text-3) hover:text-(--c-text) transition-colors cursor-pointer">
        <IconX size={14} />
      </button>
    </div>
  );
}

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { IconX } from '@/components/icons';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  fullHeight?: boolean;
}

export function Sheet({ open, onClose, title, children, className, fullHeight }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const content = (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-200 flex justify-end">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />
          <motion.div
            className={cn(
              'relative w-full sm:w-125 h-full bg-(--c-surface) border-l border-(--c-line-2) shadow-2xl flex flex-col overflow-hidden',
              className
            )}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.35 }}
          >
            {title && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-(--c-line) shrink-0">
                <h2 className="text-[16px] font-semibold text-(--c-text) tracking-tight">{title}</h2>
                <button
                  onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-(--c-surface-2) text-(--c-text-3) hover:text-(--c-text) transition-all cursor-pointer"
                >
                  <IconX size={15} />
                </button>
              </div>
            )}
            <div className={cn('flex-1 min-h-0', fullHeight ? 'flex flex-col' : 'overflow-y-auto')}>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

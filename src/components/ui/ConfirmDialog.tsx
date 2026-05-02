import { useState, type ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  variant?: 'danger' | 'default';
  requirePhrase?: string;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  variant = 'default',
  requirePhrase,
}: ConfirmDialogProps) {
  const [phrase, setPhrase] = useState('');

  const canConfirm = !requirePhrase || phrase === requirePhrase;

  function handleConfirm() {
    if (!canConfirm) return;
    onConfirm();
    setPhrase('');
    onClose();
  }

  return (
    <Modal open={open} onClose={() => { setPhrase(''); onClose(); }} title={title} size="sm">
      <div className="p-5 flex flex-col gap-4">
        {description && <p className="text-[14px] text-(--c-text-2)">{description}</p>}
        {requirePhrase && (
          <div className="flex flex-col gap-2">
            <p className="text-[13px] text-(--c-text-3)">
              Type <strong className="text-(--c-text-2) font-mono">{requirePhrase}</strong> to confirm
            </p>
            <Input
              value={phrase}
              onChange={e => setPhrase(e.target.value)}
              placeholder={requirePhrase}
              autoFocus
            />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => { setPhrase(''); onClose(); }}>Cancel</Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

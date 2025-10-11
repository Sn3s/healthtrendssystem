import { X } from 'lucide-react';
import { Button } from './ui/button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'info' | 'warning' | 'danger';
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 text-muted-foreground">{children}</div>
        <div className="flex justify-end gap-3 p-6 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            {cancelText}
          </Button>
          {onConfirm && (
            <Button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              variant={variant === 'danger' ? 'destructive' : 'default'}
            >
              {confirmText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

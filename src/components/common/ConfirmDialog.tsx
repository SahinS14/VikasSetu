import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { GlobalModal } from './GlobalModal';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  icon?: React.ReactNode;
  warningNote?: React.ReactNode;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  icon,
  warningNote,
  isLoading = false,
}) => {
  const defaultIcon =
    variant === 'danger' ? (
      <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-2xs">
        <AlertTriangle className="w-6 h-6" />
      </div>
    ) : variant === 'warning' ? (
      <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-2xs">
        <AlertTriangle className="w-6 h-6" />
      </div>
    ) : (
      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-2xs">
        <Trash2 className="w-6 h-6" />
      </div>
    );

  const confirmBtnStyles =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white shadow-xs focus:ring-2 focus:ring-red-500'
      : variant === 'warning'
      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs focus:ring-2 focus:ring-amber-500'
      : 'bg-[#0B6E4F] hover:bg-[#085A40] text-white shadow-xs focus:ring-2 focus:ring-[#0B6E4F]';

  return (
    <GlobalModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-[440px]"
      showCloseButton={false}
      ariaLabel={title}
    >
      <div className="relative p-6 space-y-4">
        {/* Top Close 'X' Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          aria-label="Close dialog"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon Header */}
        <div>{icon || defaultIcon}</div>

        {/* Title & Message */}
        <div className="text-center space-y-1.5 px-2">
          <h3 className="font-bold text-base sm:text-lg text-govText-primary">
            {title}
          </h3>
          <div className="text-xs text-govText-secondary leading-relaxed break-words">
            {message}
          </div>
        </div>

        {/* Optional Extra Warning Note */}
        {warningNote && (
          <div className="text-left">{warningNote}</div>
        )}

        {/* Actions: Cancel & Confirm */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-govText-primary text-xs font-bold rounded-xl transition-colors cursor-pointer min-h-[42px] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer min-h-[42px] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 ${confirmBtnStyles}`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};

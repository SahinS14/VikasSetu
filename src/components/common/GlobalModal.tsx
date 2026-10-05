import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface GlobalModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  ariaLabel?: string;
}

export const GlobalModal: React.FC<GlobalModalProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-md',
  className = '',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showCloseButton = false,
  ariaLabel = 'Dialog',
}) => {
  // Prevent body scrolling while modal is open and handle Escape key
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const modalNode = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      className="fixed inset-0 z-[9998] flex items-center justify-center p-3 sm:p-4 overflow-x-hidden overflow-y-auto"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9998,
      }}
    >
      {/* Full-Screen Dark Overlay with Blur - Covers entire viewport including Sidebar and Header */}
      <div
        className="fixed inset-0 bg-[#0f172a]/65 backdrop-blur-[3px] transition-opacity animate-fadeIn cursor-pointer"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9998,
        }}
        onClick={closeOnBackdropClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Dialog Content Container */}
      <div
        className={`relative z-[9999] w-[calc(100%-32px)] ${maxWidth} my-auto mx-auto bg-white rounded-2xl shadow-2xl border border-govText-border overflow-hidden animate-scaleUp text-left ${className}`}
        style={{
          position: 'relative',
          zIndex: 9999,
        }}
        onClick={e => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-3.5 right-3.5 z-20 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {children}
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
};

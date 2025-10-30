import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  footer?: React.ReactNode;
}

const sizeMap = {
  sm: 'md:max-w-sm',
  md: 'md:max-w-md',
  lg: 'md:max-w-lg',
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', footer }) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content
          className={`fixed inset-x-0 bottom-0 z-50 mx-auto w-full surface-card surface-card-gradient shadow-2xl border-t-2 md:border-t-0 md:border-2 border-white/60 dark:border-white/10 rounded-t-3xl md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:rounded-3xl ${sizeMap[size]} md:animate-fade-in animate-slide-up focus:outline-none`}
          onEscapeKeyDown={(event) => {
            event.preventDefault();
            onClose();
          }}
          onPointerDownOutside={(event) => {
            event.preventDefault();
            onClose();
          }}
          onFocusOutside={(event) => event.preventDefault()}
        >
          <div className="flex justify-center py-4 md:hidden">
            <div className="h-1.5 w-12 rounded-full bg-gradient-to-r from-primary-300 via-primary-400 to-primary-300 dark:from-primary-700 dark:via-primary-600 dark:to-primary-700 shadow-sm"></div>
          </div>
          {(title || title === '') && (
            <Dialog.Title className="px-6 pt-2 md:pt-4 text-center text-xl font-bold text-white tracking-tight md:text-left heading-glass">
              {title}
            </Dialog.Title>
          )}
          <Dialog.Description asChild>
            <div className="px-6 py-5 text-white">
              {children}
            </div>
          </Dialog.Description>
          {footer && (
            <div className="px-6 pt-3 pb-5 border-t border-white/40 dark:border-white/5">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Modal;

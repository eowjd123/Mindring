'use client';

import React from 'react';
import { AlertModal } from './alert-modal';
import { ConfirmModal } from './confirm-modal';
import { useModal } from '../../hooks/useModal';

interface ModalProviderProps {
  children: React.ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const { alertModal, confirmModal, hideAlert, hideConfirm } = useModal();

  return (
    <>
      {children}
      
      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={hideAlert}
        type={alertModal.options.type}
        title={alertModal.options.title}
        message={alertModal.options.message}
        confirmText={alertModal.options.confirmText}
      />
      
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={hideConfirm}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.options.title}
        message={confirmModal.options.message}
        confirmText={confirmModal.options.confirmText}
        cancelText={confirmModal.options.cancelText}
        type={confirmModal.options.type}
      />
    </>
  );
}

// Context를 통한 전역 모달 사용을 위한 훅
import { createContext, useContext } from 'react';

const ModalContext = createContext<ReturnType<typeof useModal> | null>(null);

export function useModalContext() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalContext must be used within a ModalProvider');
  }
  return context;
}

export function ModalProviderWithContext({ children }: ModalProviderProps) {
  const modal = useModal();
  const { alertModal, confirmModal, hideAlert, hideConfirm } = modal;

  return (
    <ModalContext.Provider value={modal}>
      {children}
      
      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={hideAlert}
        type={alertModal.options.type}
        title={alertModal.options.title}
        message={alertModal.options.message}
        confirmText={alertModal.options.confirmText}
      />
      
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={hideConfirm}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.options.title}
        message={confirmModal.options.message}
        confirmText={confirmModal.options.confirmText}
        cancelText={confirmModal.options.cancelText}
        type={confirmModal.options.type}
      />
    </ModalContext.Provider>
  );
}

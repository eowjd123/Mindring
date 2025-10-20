'use client';

import { useState, useCallback } from 'react';

export interface AlertOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  confirmText?: string;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
}

export function useModal() {
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    options: AlertOptions;
  }>({
    isOpen: false,
    options: {
      type: 'info',
      title: '',
      message: '',
    },
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    onConfirm: () => void;
  }>({
    isOpen: false,
    options: {
      title: '',
      message: '',
    },
    onConfirm: () => {},
  });

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertModal({
      isOpen: true,
      options,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertModal(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const showConfirm = useCallback((options: ConfirmOptions, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      options,
      onConfirm,
    });
  }, []);

  const hideConfirm = useCallback(() => {
    setConfirmModal(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  // 편의 메서드들
  const alertMethods = {
    success: (title: string, message: string, confirmText?: string) =>
      showAlert({ type: 'success', title, message, confirmText }),
    error: (title: string, message: string, confirmText?: string) =>
      showAlert({ type: 'error', title, message, confirmText }),
    warning: (title: string, message: string, confirmText?: string) =>
      showAlert({ type: 'warning', title, message, confirmText }),
    info: (title: string, message: string, confirmText?: string) =>
      showAlert({ type: 'info', title, message, confirmText }),
  };

  const confirmMethods = {
    warning: (title: string, message: string, onConfirm: () => void, options?: Partial<ConfirmOptions>) =>
      showConfirm({ title, message, type: 'warning', ...options }, onConfirm),
    danger: (title: string, message: string, onConfirm: () => void, options?: Partial<ConfirmOptions>) =>
      showConfirm({ title, message, type: 'danger', ...options }, onConfirm),
    info: (title: string, message: string, onConfirm: () => void, options?: Partial<ConfirmOptions>) =>
      showConfirm({ title, message, type: 'info', ...options }, onConfirm),
  };

  return {
    alertModal,
    confirmModal,
    showAlert,
    hideAlert,
    showConfirm,
    hideConfirm,
    alert: alertMethods,
    confirm: confirmMethods,
  };
}

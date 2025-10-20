'use client';

import React from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import { Modal } from './modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
  isLoading?: boolean;
}

const confirmConfig = {
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
    iconBg: 'bg-yellow-100',
    titleColor: 'text-yellow-900',
    messageColor: 'text-yellow-700',
    confirmButtonColor: 'bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700',
  },
  danger: {
    icon: AlertTriangle,
    iconColor: 'text-red-500',
    iconBg: 'bg-red-100',
    titleColor: 'text-red-900',
    messageColor: 'text-red-700',
    confirmButtonColor: 'bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700',
  },
  info: {
    icon: HelpCircle,
    iconColor: 'text-teal-500',
    iconBg: 'bg-teal-100',
    titleColor: 'text-teal-900',
    messageColor: 'text-teal-700',
    confirmButtonColor: 'bg-gradient-to-r from-teal-400 to-teal-600 hover:from-teal-500 hover:to-teal-700',
  },
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  type = 'info',
  isLoading = false,
}: ConfirmModalProps) {
  const config = confirmConfig[type];
  const IconComponent = config.icon;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
      closeOnOverlayClick={false}
    >
      <div className="text-center">
        {/* Icon */}
        <div className={`w-16 h-16 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <IconComponent className={`h-8 w-8 ${config.iconColor}`} />
        </div>
        
        {/* Title */}
        <h3 className={`text-lg font-bold mb-2 ${config.titleColor}`}>
          {title}
        </h3>
        
        {/* Message */}
        <p className={`text-sm mb-6 ${config.messageColor}`}>
          {message}
        </p>
        
        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-full hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 text-white font-medium py-3 px-6 rounded-full transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${config.confirmButtonColor}`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                처리중...
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

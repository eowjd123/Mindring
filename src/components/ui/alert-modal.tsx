'use client';

import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { Modal } from './modal';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: AlertType;
  title: string;
  message: string;
  confirmText?: string;
}

const alertConfig = {
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-500',
    iconBg: 'bg-green-100',
    titleColor: 'text-green-900',
    messageColor: 'text-green-700',
    buttonColor: 'bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700',
  },
  error: {
    icon: AlertCircle,
    iconColor: 'text-red-500',
    iconBg: 'bg-red-100',
    titleColor: 'text-red-900',
    messageColor: 'text-red-700',
    buttonColor: 'bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
    iconBg: 'bg-yellow-100',
    titleColor: 'text-yellow-900',
    messageColor: 'text-yellow-700',
    buttonColor: 'bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700',
  },
  info: {
    icon: Info,
    iconColor: 'text-teal-500',
    iconBg: 'bg-teal-100',
    titleColor: 'text-teal-900',
    messageColor: 'text-teal-700',
    buttonColor: 'bg-gradient-to-r from-teal-400 to-teal-600 hover:from-teal-500 hover:to-teal-700',
  },
};

export function AlertModal({
  isOpen,
  onClose,
  type,
  title,
  message,
  confirmText = '확인',
}: AlertModalProps) {
  const config = alertConfig[type];
  const IconComponent = config.icon;

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
        
        {/* Button */}
        <button
          onClick={onClose}
          className={`w-full text-white font-medium py-3 px-6 rounded-full transition-all duration-200 shadow-lg ${config.buttonColor}`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

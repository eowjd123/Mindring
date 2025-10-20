'use client';

import React from 'react';
import { useModal } from '../../hooks/useModal';
import { AlertModal } from '../ui/alert-modal';
import { ConfirmModal } from '../ui/confirm-modal';

export function ModalExample() {
  const { alertModal, confirmModal, hideAlert, hideConfirm, alert, confirm } = useModal();

  const handleSuccessAlert = () => {
    alert.success('성공!', '작업이 성공적으로 완료되었습니다.');
  };

  const handleErrorAlert = () => {
    alert.error('오류 발생', '작업 중 오류가 발생했습니다.');
  };

  const handleWarningAlert = () => {
    alert.warning('주의', '이 작업은 되돌릴 수 없습니다.');
  };

  const handleInfoAlert = () => {
    alert.info('정보', '추가 정보를 확인해주세요.');
  };

  const handleDangerConfirm = () => {
    confirm.danger('삭제 확인', '정말로 삭제하시겠습니까?', () => {
      console.log('삭제됨');
    });
  };

  const handleWarningConfirm = () => {
    confirm.warning('경고', '이 작업을 계속하시겠습니까?', () => {
      console.log('계속됨');
    });
  };

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold mb-6">모달 예제</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">알럿 모달</h3>
          <button
            onClick={handleSuccessAlert}
            className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            성공 알럿
          </button>
          <button
            onClick={handleErrorAlert}
            className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            오류 알럿
          </button>
          <button
            onClick={handleWarningAlert}
            className="w-full bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
          >
            경고 알럿
          </button>
          <button
            onClick={handleInfoAlert}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            정보 알럿
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">확인 모달</h3>
          <button
            onClick={handleDangerConfirm}
            className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            위험 확인
          </button>
          <button
            onClick={handleWarningConfirm}
            className="w-full bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
          >
            경고 확인
          </button>
        </div>
      </div>

      {/* Modals */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={hideAlert}
        type={alertModal.options.type}
        title={alertModal.options.title}
        message={alertModal.options.message}
        confirmText={alertModal.options.confirmText}
      />
      
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
    </div>
  );
}

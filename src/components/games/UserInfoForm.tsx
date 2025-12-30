/**
 * UserInfoForm Component
 * 사용자 정보(나이, 성별) 입력 폼
 */

import { Calendar, User } from "lucide-react";
import React from "react";
import { type UserInfo } from "./index";

interface UserInfoFormProps {
  userInfo: UserInfo;
  onUserInfoChange: (userInfo: UserInfo) => void;
  onNext: () => void;
  isFormValid?: boolean;
  title?: string;
  description?: string;
}

export function UserInfoForm({
  userInfo,
  onUserInfoChange,
  onNext,
  isFormValid = true,
  title = "기본 정보 입력",
  description = "정확한 평가를 위해 기본 정보를 입력해주세요",
}: UserInfoFormProps) {
  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUserInfoChange({ ...userInfo, age: e.target.value });
  };

  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUserInfoChange({
      ...userInfo,
      gender: e.target.value as "" | "male" | "female",
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUserInfoChange({ ...userInfo, date: e.target.value });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {title}
        </h2>
        <p className="text-gray-600">{description}</p>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-blue-200 p-8 shadow-lg space-y-6">
        {/* Age Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>나이</span>
            </div>
          </label>
          <input
            type="number"
            min="0"
            max="150"
            value={userInfo.age}
            onChange={handleAgeChange}
            placeholder="예: 65"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Gender Select */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>성별</span>
            </div>
          </label>
          <select
            value={userInfo.gender}
            onChange={handleGenderChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">선택해주세요</option>
            <option value="male">남성</option>
            <option value="female">여성</option>
          </select>
        </div>

        {/* Date Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>평가 날짜</span>
            </div>
          </label>
          <input
            type="date"
            value={userInfo.date}
            onChange={handleDateChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Next Button */}
      <button
        onClick={onNext}
        disabled={!isFormValid || !userInfo.age || !userInfo.gender}
        className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-semibold"
      >
        평가 시작하기
      </button>
    </div>
  );
}

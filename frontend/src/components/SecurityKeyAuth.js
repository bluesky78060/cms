import React, { useState, useEffect } from 'react';
import { ShieldCheckIcon, DocumentArrowUpIcon, KeyIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import secureStorage from '../utils/secureStorage';

function SecurityKeyAuth({ onAuthenticated }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [storedKeyInfo, setStoredKeyInfo] = useState(null);

  useEffect(() => {
    // 기존에 저장된 키 정보 확인 (IndexedDB에서)
    const checkStoredKey = async () => {
      try {
        const keyData = await secureStorage.getSecurityKey();
        if (keyData) {
          setStoredKeyInfo(keyData);
        }
      } catch (error) {
        console.error('Failed to load stored security key:', error);
        await secureStorage.clearSecurityKey();
      }
    };
    
    checkStoredKey();
  }, []);

  // 보안 키 파일 검증
  const validateSecurityKeyFile = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          const keyData = JSON.parse(content);
          
          // 필수 필드 검증
          const requiredFields = ['keyId', 'issuedTo', 'issuedDate', 'signature'];
          const hasAllFields = requiredFields.every(field => keyData.hasOwnProperty(field));
          
          if (!hasAllFields) {
            resolve({ valid: false, error: '보안 키 파일 형식이 올바르지 않습니다.' });
            return;
          }

          // 유효한 키 ID 검증 함수
          const isValidKeyId = (keyId) => {
            // 기존 마스터 키들 (하위 호환성)
            if (keyId === 'CMS-MASTER-2024-001') return true;
            if (keyId === 'CMS-ADMIN-2024-UNIVERSAL') return true;
            if (keyId === 'CMS-ADMIN-2024-001') return true;
            
            // 2025년 키들
            if (keyId === 'CMS-ADMIN-2025-UNIVERSAL') return true;
            
            // 키 패턴: 2024년과 2025년 모두 지원
            const keyPattern2024 = /^CMS-[A-Z가-힣0-9-]+-2024-\d{3}$/;
            const keyPattern2025 = /^CMS-[A-Z가-힣0-9-]+-2025-\d{3}$/;
            return keyPattern2024.test(keyId) || keyPattern2025.test(keyId);
          };

          if (!isValidKeyId(keyData.keyId)) {
            resolve({ valid: false, error: '등록되지 않은 보안 키입니다.' });
            return;
          }

          // 만료일 검증 (있는 경우)
          if (keyData.expiryDate) {
            const expiry = new Date(keyData.expiryDate);
            if (expiry < new Date()) {
              resolve({ valid: false, error: '만료된 보안 키입니다.' });
              return;
            }
          }

          resolve({ valid: true, keyData: keyData });
        } catch (error) {
          resolve({ valid: false, error: '보안 키 파일을 읽을 수 없습니다.' });
        }
      };
      reader.readAsText(file);
    });
  };

  const handleFileSelect = async (file) => {
    if (!file) return;
    
    if (!file.name.endsWith('.cmskey')) {
      setError('올바른 보안 키 파일(.cmskey)을 선택해주세요.');
      return;
    }

    setSelectedFile(file);
    setError('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleKeySubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('보안 키 파일을 선택해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const validation = await validateSecurityKeyFile(selectedFile);
      
      if (validation.valid) {
        // 보안 키가 유효한 경우 - IndexedDB에 저장
        await secureStorage.saveSecurityKey(validation.keyData);
        localStorage.setItem('SECURITY_KEY_VERIFIED', 'true');
        onAuthenticated();
      } else {
        setError(validation.error);
      }
    } catch (error) {
      setError('보안 키 파일을 처리하는 중 오류가 발생했습니다.');
    }
    
    setIsLoading(false);
  };

  // 저장된 키로 자동 로그인
  const handleUseStoredKey = async () => {
    if (!storedKeyInfo) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // 저장된 키 재검증
      const isValidKeyId = (keyId) => {
        // 기존 마스터 키들 (하위 호환성)
        if (keyId === 'CMS-MASTER-2024-001') return true;
        if (keyId === 'CMS-ADMIN-2024-UNIVERSAL') return true;
        if (keyId === 'CMS-ADMIN-2024-001') return true;
        
        // 2025년 키들
        if (keyId === 'CMS-ADMIN-2025-UNIVERSAL') return true;
        
        // 키 패턴: 2024년과 2025년 모두 지원
        const keyPattern2024 = /^CMS-[A-Z가-힣0-9-]+-2024-\d{3}$/;
        const keyPattern2025 = /^CMS-[A-Z가-힣0-9-]+-2025-\d{3}$/;
        return keyPattern2024.test(keyId) || keyPattern2025.test(keyId);
      };
      
      if (!isValidKeyId(storedKeyInfo.keyId)) {
        setError('저장된 보안 키가 더 이상 유효하지 않습니다.');
        localStorage.removeItem('VERIFIED_KEY_DATA');
        localStorage.removeItem('SECURITY_KEY_VERIFIED');
        setStoredKeyInfo(null);
        setIsLoading(false);
        return;
      }
      
      // 만료일 확인
      if (storedKeyInfo.expiryDate) {
        const expiry = new Date(storedKeyInfo.expiryDate);
        if (expiry < new Date()) {
          setError('저장된 보안 키가 만료되었습니다. 새로운 키를 업로드해주세요.');
          localStorage.removeItem('VERIFIED_KEY_DATA');
          localStorage.removeItem('SECURITY_KEY_VERIFIED');
          setStoredKeyInfo(null);
          setIsLoading(false);
          return;
        }
      }
      
      // 검증 통과 시 자동 로그인
      onAuthenticated();
    } catch (error) {
      setError('저장된 보안 키를 처리하는 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-blue-100">
            <ShieldCheckIcon className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            보안 키 인증
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            시스템 접근을 위해 보안 키 파일을 업로드해주세요
          </p>
        </div>
        
        {/* 저장된 키 정보 표시 */}
        {storedKeyInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-900 mb-2">
                  저장된 보안 키 발견
                </h3>
                <div className="text-xs text-blue-700 space-y-1">
                  <p><strong>발급 대상:</strong> {storedKeyInfo.issuedTo}</p>
                  <p><strong>키 ID:</strong> {storedKeyInfo.keyId}</p>
                  <p><strong>발급일:</strong> {storedKeyInfo.issuedDate}</p>
                  {storedKeyInfo.expiryDate && (
                    <p><strong>만료일:</strong> {storedKeyInfo.expiryDate}</p>
                  )}
                </div>
                <button
                  onClick={handleUseStoredKey}
                  disabled={isLoading}
                  className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? '인증 중...' : '저장된 키로 계속하기'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 구분선 */}
        {storedKeyInfo && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-50 px-2 text-gray-500">또는 새로운 키 업로드</span>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleKeySubmit}>
          {/* 파일 드래그 앤 드롭 영역 */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 ${
              dragOver 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            } transition-colors`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="text-center">
              <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="key-file" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    보안 키 파일을 선택하거나 여기에 드래그하세요
                  </span>
                  <input
                    id="key-file"
                    type="file"
                    className="sr-only"
                    accept=".cmskey"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                  />
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  .cmskey 파일만 지원됩니다
                </p>
              </div>
              
              {selectedFile && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center justify-center space-x-2">
                    <KeyIcon className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">
                      {selectedFile.name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || !selectedFile}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>키 검증 중...</span>
                </div>
              ) : (
                '보안 키 인증'
              )}
            </button>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            보안 키 파일은 시스템 관리자로부터 받으실 수 있습니다.
          </div>
        </form>
      </div>
    </div>
  );
}

export default SecurityKeyAuth;
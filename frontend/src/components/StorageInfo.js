import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { FolderIcon, CloudIcon, ComputerDesktopIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

function StorageInfo() {
  const { getStorageInfo, migrateFromLocalStorage, createBackup } = useApp();
  const [isMigrating, setIsMigrating] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  
  const storageInfo = getStorageInfo();

  const handleMigration = async () => {
    setIsMigrating(true);
    try {
      const success = await migrateFromLocalStorage();
      if (success) {
        alert('✅ 데이터 마이그레이션이 완료되었습니다!');
      } else {
        alert('⚠️ 마이그레이션할 데이터가 없거나 실패했습니다.');
      }
    } catch (error) {
      alert('❌ 마이그레이션 중 오류가 발생했습니다: ' + error.message);
    }
    setIsMigrating(false);
  };

  const handleBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const backupPath = await createBackup();
      if (backupPath) {
        alert(`✅ 백업이 생성되었습니다:\n${backupPath}`);
      } else {
        alert('❌ 백업 생성에 실패했습니다.');
      }
    } catch (error) {
      alert('❌ 백업 생성 중 오류가 발생했습니다: ' + error.message);
    }
    setIsCreatingBackup(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-3 mb-4">
        <FolderIcon className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-medium text-gray-900">저장소 정보</h3>
      </div>

      <div className="space-y-4">
        {/* 환경 정보 */}
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            {storageInfo.isElectron ? (
              <ComputerDesktopIcon className="h-4 w-4 text-green-600" />
            ) : (
              <CloudIcon className="h-4 w-4 text-blue-600" />
            )}
            <span className="text-sm text-gray-600">환경</span>
          </div>
          <span className="text-sm font-medium">
            {storageInfo.isElectron ? '데스크톱 앱' : '웹 브라우저'}
          </span>
        </div>

        {/* 파일 저장소 상태 */}
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">로컬 파일 저장소</span>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              storageInfo.fileStorageAvailable ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm font-medium">
              {storageInfo.fileStorageAvailable ? '사용 가능' : '사용 불가'}
            </span>
          </div>
        </div>

        {/* 데이터 경로 */}
        {storageInfo.dataPath && (
          <div className="py-2">
            <div className="text-sm text-gray-600 mb-1">데이터 경로</div>
            <div className="text-xs bg-gray-50 p-2 rounded border font-mono break-all">
              {storageInfo.dataPath}
            </div>
          </div>
        )}

        {/* 마이그레이션 버튼 */}
        {storageInfo.fileStorageAvailable && (
          <div className="pt-4 space-y-2">
            <button
              onClick={handleMigration}
              disabled={isMigrating}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {isMigrating ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowPathIcon className="h-4 w-4" />
              )}
              <span>
                {isMigrating ? '마이그레이션 중...' : 'localStorage 데이터 마이그레이션'}
              </span>
            </button>

            <button
              onClick={handleBackup}
              disabled={isCreatingBackup}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {isCreatingBackup ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <FolderIcon className="h-4 w-4" />
              )}
              <span>
                {isCreatingBackup ? '백업 생성 중...' : '데이터 백업 생성'}
              </span>
            </button>
          </div>
        )}

        {/* 웹 환경 안내 */}
        {!storageInfo.isElectron && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-blue-700">
              <div className="font-medium mb-1">💡 데스크톱 앱 사용 권장</div>
              <div>더 안정적인 데이터 저장을 위해 Electron 데스크톱 앱을 사용해보세요!</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StorageInfo;
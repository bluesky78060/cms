import React, { useState, useEffect } from 'react';
import { STORAGE_KEYS, exportAllData, importAllData, clearAllData } from '../utils/localStorage';

const DataStorage = () => {
  const [storageInfo, setStorageInfo] = useState({});
  const [totalSize, setTotalSize] = useState(0);

  // localStorage 정보 수집
  const analyzeStorage = () => {
    const info = {};
    let total = 0;

    Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
      const data = localStorage.getItem(storageKey);
      const size = data ? new Blob([data]).size : 0;
      const itemCount = data ? JSON.parse(data).length || 1 : 0;
      
      info[key] = {
        storageKey,
        size,
        sizeKB: (size / 1024).toFixed(2),
        itemCount,
        hasData: !!data
      };
      
      total += size;
    });

    setStorageInfo(info);
    setTotalSize(total);
  };

  // 브라우저 저장소 제한 확인
  const checkStorageQuota = async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          quota: estimate.quota,
          usage: estimate.usage,
          quotaMB: (estimate.quota / (1024 * 1024)).toFixed(2),
          usageMB: (estimate.usage / (1024 * 1024)).toFixed(2),
          available: estimate.quota - estimate.usage,
          availableMB: ((estimate.quota - estimate.usage) / (1024 * 1024)).toFixed(2)
        };
      } catch (error) {
        console.warn('Storage quota 확인 실패:', error);
        return null;
      }
    }
    return null;
  };

  const [quota, setQuota] = useState(null);

  useEffect(() => {
    analyzeStorage();
    
    checkStorageQuota().then(quotaInfo => {
      setQuota(quotaInfo);
    });
  }, []);

  // 데이터 백업
  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `construction-data-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 데이터 복원
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const success = importAllData(e.target.result);
        if (success) {
          alert('데이터가 성공적으로 복원되었습니다!');
          analyzeStorage();
          window.location.reload();
        } else {
          alert('데이터 복원에 실패했습니다.');
        }
      };
      reader.readAsText(file);
    }
  };

  // 모든 데이터 삭제
  const handleClearAll = () => {
    if (window.confirm('⚠️ 모든 데이터를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다. 삭제하기 전에 백업을 받으시는 것을 권장합니다.')) {
      const success = clearAllData();
      if (success) {
        alert('모든 데이터가 삭제되었습니다.');
        analyzeStorage();
        window.location.reload();
      } else {
        alert('데이터 삭제에 실패했습니다.');
      }
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">💾 데이터 저장소 관리</h2>
      
      {/* 저장소 현황 */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">📊 저장소 현황</h3>
        
        {/* 총 사용량 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <span className="font-medium text-blue-800">총 사용량</span>
            <span className="text-blue-600 font-bold">{formatBytes(totalSize)}</span>
          </div>
        </div>

        {/* 브라우저 저장소 제한 */}
        {quota && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-green-800 mb-2">브라우저 저장소 제한</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">할당량: </span>
                <span className="font-medium">{quota.quotaMB} MB</span>
              </div>
              <div>
                <span className="text-gray-600">전체 사용량: </span>
                <span className="font-medium">{quota.usageMB} MB</span>
              </div>
              <div>
                <span className="text-gray-600">남은 공간: </span>
                <span className="font-medium">{quota.availableMB} MB</span>
              </div>
              <div>
                <span className="text-gray-600">사용률: </span>
                <span className="font-medium">{((quota.usage / quota.quota) * 100).toFixed(2)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* 데이터 상세 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(storageInfo).map(([key, info]) => (
            <div key={key} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-800">{getDisplayName(key)}</h4>
                <span className={`px-2 py-1 rounded text-xs ${info.hasData ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {info.hasData ? '데이터 있음' : '데이터 없음'}
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>크기: <span className="font-medium">{info.sizeKB} KB</span></div>
                <div>항목 수: <span className="font-medium">{info.itemCount}</span></div>
                <div className="text-xs text-gray-500">키: {info.storageKey}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 데이터 관리 버튼들 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">🔧 데이터 관리</h3>
        
        <div className="flex flex-wrap gap-4">
          {/* 새로고침 */}
          <button
            onClick={analyzeStorage}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            🔄 정보 새로고침
          </button>

          {/* 백업 */}
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            💾 데이터 백업
          </button>

          {/* 복원 */}
          <label className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors cursor-pointer">
            📥 데이터 복원
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>

          {/* 전체 삭제 */}
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            🗑️ 전체 삭제
          </button>
        </div>
      </div>

      {/* 저장 위치 안내 */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">📍 데이터 저장 위치</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>저장 방식:</strong> 브라우저 localStorage (클라이언트 측 저장)</p>
          <p><strong>저장 위치:</strong> 브라우저별 로컬 데이터베이스</p>
          <p><strong>접근 범위:</strong> 동일한 도메인(localhost:3000)에서만 접근 가능</p>
          <p><strong>지속성:</strong> 브라우저가 삭제하기 전까지 영구 저장</p>
          <p><strong>보안:</strong> 로컬 저장으로 네트워크를 통해 전송되지 않음</p>
        </div>
      </div>
    </div>
  );
};

// 표시 이름 변환
const getDisplayName = (key) => {
  const names = {
    COMPANY_INFO: '업체 정보',
    CLIENTS: '건축주 정보',
    WORK_ITEMS: '작업 항목',
    INVOICES: '청구서'
  };
  return names[key] || key;
};

export default DataStorage;
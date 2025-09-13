import React, { useState } from 'react';
import { 
  migrateLocalStorageToSupabase, 
  backupLocalStorageData, 
  hasLocalStorageData 
} from '../utils/dataMigration';
import { testApiConnection } from '../services/api';

function DataMigrationPanel() {
  const [migrationState, setMigrationState] = useState('idle'); // idle, testing, migrating, completed, error
  const [migrationResult, setMigrationResult] = useState(null);
  const [apiStatus, setApiStatus] = useState(null);

  // API 연결 테스트
  const handleTestConnection = async () => {
    setMigrationState('testing');
    try {
      const result = await testApiConnection();
      setApiStatus(result);
    } catch (error) {
      setApiStatus({ success: false, message: error.message });
    } finally {
      setMigrationState('idle');
    }
  };

  // 데이터 마이그레이션 실행
  const handleMigration = async () => {
    if (!window.confirm('localStorage 데이터를 Supabase로 마이그레이션하시겠습니까?\\n기존 데이터는 백업됩니다.')) {
      return;
    }

    setMigrationState('migrating');
    
    try {
      // 1. 백업 생성
      backupLocalStorageData();
      
      // 2. 마이그레이션 실행
      const result = await migrateLocalStorageToSupabase();
      setMigrationResult(result);
      
      if (result.success) {
        setMigrationState('completed');
      } else {
        setMigrationState('error');
      }
      
    } catch (error) {
      setMigrationResult({
        success: false,
        error: error.message,
      });
      setMigrationState('error');
    }
  };

  const hasLocalData = hasLocalStorageData();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            🚀 Supabase 데이터 마이그레이션
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            localStorage의 기존 데이터를 Supabase 클라우드 데이터베이스로 이전합니다.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* API 연결 테스트 */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-3">1️⃣ API 연결 테스트</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={handleTestConnection}
                disabled={migrationState === 'testing'}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {migrationState === 'testing' ? '테스트 중...' : 'API 연결 테스트'}
              </button>
              
              {apiStatus && (
                <div className={`px-3 py-1 rounded-md text-sm ${
                  apiStatus.success 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {apiStatus.success ? '✅ 연결 성공' : `❌ ${apiStatus.message}`}
                </div>
              )}
            </div>
          </div>

          {/* 로컬 데이터 확인 */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-3">2️⃣ 로컬 데이터 확인</h3>
            <div className={`px-3 py-2 rounded-md text-sm ${
              hasLocalData 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {hasLocalData 
                ? '✅ 마이그레이션할 데이터가 있습니다' 
                : '⚠️ 마이그레이션할 데이터가 없습니다'
              }
            </div>
          </div>

          {/* 마이그레이션 실행 */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-3">3️⃣ 데이터 마이그레이션</h3>
            
            <div className="mb-4">
              <button
                onClick={handleMigration}
                disabled={!hasLocalData || !apiStatus?.success || migrationState === 'migrating'}
                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {migrationState === 'migrating' ? '마이그레이션 진행 중...' : '데이터 마이그레이션 시작'}
              </button>
            </div>

            {!hasLocalData && (
              <div className="text-sm text-gray-500 mb-2">
                마이그레이션할 localStorage 데이터가 없습니다.
              </div>
            )}
            
            {!apiStatus?.success && (
              <div className="text-sm text-gray-500 mb-2">
                먼저 API 연결을 확인해주세요.
              </div>
            )}
          </div>

          {/* 마이그레이션 결과 */}
          {migrationResult && (
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-3">
                {migrationResult.success ? '✅ 마이그레이션 완료' : '❌ 마이그레이션 실패'}
              </h3>
              
              {migrationResult.success && (
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-3 rounded">
                      <div className="font-medium text-green-800">성공한 작업</div>
                      <div className="text-green-600">{migrationResult.summary.totalSuccessful}개</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded">
                      <div className="font-medium text-red-800">실패한 작업</div>
                      <div className="text-red-600">{migrationResult.summary.totalErrors}개</div>
                    </div>
                  </div>
                  
                  {migrationResult.migrationLog.length > 0 && (
                    <div className="mt-4">
                      <div className="font-medium mb-2">마이그레이션 로그:</div>
                      <div className="bg-gray-50 p-3 rounded max-h-40 overflow-y-auto text-xs">
                        {migrationResult.migrationLog.map((log, index) => (
                          <div key={index} className="mb-1">{log}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {!migrationResult.success && (
                <div className="text-red-600 text-sm">
                  {migrationResult.error}
                </div>
              )}
              
              {migrationResult.errors.length > 0 && (
                <div className="mt-4">
                  <div className="font-medium mb-2 text-red-800">오류 목록:</div>
                  <div className="bg-red-50 p-3 rounded max-h-40 overflow-y-auto text-xs">
                    {migrationResult.errors.map((error, index) => (
                      <div key={index} className="mb-1 text-red-700">{error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DataMigrationPanel;
import React, { useState, useEffect } from 'react';
import { migrateLocalStorageToSupabase, backupLocalStorageData, hasLocalStorageData } from '../utils/dataMigration';
import { restoreFromBackup } from '../utils/dataRestore';

const MigrationPanel = () => {
  const [migrationStatus, setMigrationStatus] = useState('ready'); // ready, running, completed, error
  const [migrationResult, setMigrationResult] = useState(null);
  const [hasData, setHasData] = useState(false);
  const [restoreResult, setRestoreResult] = useState(null);

  useEffect(() => {
    // localStorage 데이터 존재 여부 확인
    setHasData(hasLocalStorageData());
  }, []);

  const handleBackupData = async () => {
    try {
      const result = await backupLocalStorageData();
      if (result.success) {
        alert(`백업 완료!\n\n${result.message}`);
      } else {
        alert(`백업 실패: ${result.message}`);
      }
    } catch (error) {
      alert('백업 중 오류가 발생했습니다: ' + error.message);
    }
  };

  const handleRestoreData = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const backupData = JSON.parse(text);
        
        if (!window.confirm('현재 데이터를 백업 파일로 덮어쓰시겠습니까?\n기존 데이터는 삭제됩니다.')) {
          return;
        }

        const result = restoreFromBackup(backupData);
        setRestoreResult(result);

        if (result.success) {
          alert('데이터 복원이 완료되었습니다! 페이지를 새로고침하겠습니다.');
          window.location.reload();
        } else {
          alert('데이터 복원 중 오류가 발생했습니다.');
        }
      } catch (error) {
        alert('백업 파일을 읽는 중 오류가 발생했습니다: ' + error.message);
      }
    };
    fileInput.click();
  };

  const handleMigration = async () => {
    if (!window.confirm('localStorage 데이터를 Supabase로 마이그레이션하시겠습니까?')) {
      return;
    }

    setMigrationStatus('running');
    setMigrationResult(null);

    try {
      console.log('🚀 마이그레이션 시작...');
      const result = await migrateLocalStorageToSupabase();
      
      setMigrationResult(result);
      setMigrationStatus(result.success ? 'completed' : 'error');
      
      if (result.success) {
        alert('마이그레이션이 성공적으로 완료되었습니다!');
      } else {
        alert('마이그레이션 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('마이그레이션 오류:', error);
      setMigrationResult({
        success: false,
        error: error.message
      });
      setMigrationStatus('error');
      alert('마이그레이션 중 오류가 발생했습니다: ' + error.message);
    }
  };

  const getStatusText = () => {
    switch (migrationStatus) {
      case 'ready': return '준비됨';
      case 'running': return '실행 중...';
      case 'completed': return '완료';
      case 'error': return '오류';
      default: return '알 수 없음';
    }
  };

  const getStatusColor = () => {
    switch (migrationStatus) {
      case 'ready': return '#007bff';
      case 'running': return '#ffc107';
      case 'completed': return '#28a745';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div style={{
      padding: '20px',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      backgroundColor: '#f8f9fa',
      margin: '20px 0'
    }}>
      <h3 style={{ color: '#495057', marginBottom: '20px' }}>
        🔄 Supabase 마이그레이션
      </h3>

      {/* 상태 표시 */}
      <div style={{
        padding: '10px',
        backgroundColor: 'white',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        marginBottom: '15px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{
            display: 'inline-block',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: getStatusColor(),
            marginRight: '8px'
          }}></span>
          <strong>상태: {getStatusText()}</strong>
        </div>
        
        <div>
          <strong>localStorage 데이터:</strong> {hasData ? '✅ 있음' : '❌ 없음'}
        </div>
      </div>

      {/* 버튼들 */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleBackupData}
          disabled={!hasData || migrationStatus === 'running'}
          style={{
            padding: '10px 15px',
            marginRight: '10px',
            marginBottom: '10px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: hasData && migrationStatus !== 'running' ? 'pointer' : 'not-allowed',
            opacity: hasData && migrationStatus !== 'running' ? 1 : 0.6
          }}
        >
          📁 데이터 백업
        </button>

        <button
          onClick={handleRestoreData}
          disabled={migrationStatus === 'running'}
          style={{
            padding: '10px 15px',
            marginRight: '10px',
            marginBottom: '10px',
            backgroundColor: '#fd7e14',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: migrationStatus !== 'running' ? 'pointer' : 'not-allowed',
            opacity: migrationStatus !== 'running' ? 1 : 0.6
          }}
        >
          📂 데이터 복원
        </button>

        <button
          onClick={handleMigration}
          disabled={!hasData || migrationStatus === 'running'}
          style={{
            padding: '10px 15px',
            marginBottom: '10px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: hasData && migrationStatus !== 'running' ? 'pointer' : 'not-allowed',
            opacity: hasData && migrationStatus !== 'running' ? 1 : 0.6
          }}
        >
          {migrationStatus === 'running' ? '⏳ 마이그레이션 중...' : '🚀 마이그레이션 시작'}
        </button>
      </div>

      {/* 데이터 복원 결과 표시 */}
      {restoreResult && (
        <div style={{
          padding: '15px',
          backgroundColor: restoreResult.success ? '#d4edda' : '#f8d7da',
          border: `1px solid ${restoreResult.success ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px',
          color: restoreResult.success ? '#155724' : '#721c24',
          marginBottom: '20px'
        }}>
          <h4>{restoreResult.success ? '✅ 데이터 복원 성공' : '❌ 데이터 복원 실패'}</h4>
          
          {restoreResult.summary && (
            <div style={{ margin: '10px 0' }}>
              <strong>복원된 데이터:</strong>
              <ul>
                {Object.entries(restoreResult.summary).map(([key, value]) => (
                  <li key={key}>{key}: {value}</li>
                ))}
              </ul>
            </div>
          )}

          {restoreResult.errors && restoreResult.errors.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <strong>오류 목록:</strong>
              <ul>
                {restoreResult.errors.map((error, index) => (
                  <li key={index} style={{ color: '#721c24' }}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 마이그레이션 결과 표시 */}
      {migrationResult && (
        <div style={{
          padding: '15px',
          backgroundColor: migrationResult.success ? '#d4edda' : '#f8d7da',
          border: `1px solid ${migrationResult.success ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px',
          color: migrationResult.success ? '#155724' : '#721c24'
        }}>
          <h4>{migrationResult.success ? '✅ 마이그레이션 성공' : '❌ 마이그레이션 실패'}</h4>
          
          {migrationResult.summary && (
            <div style={{ margin: '10px 0' }}>
              <strong>요약:</strong>
              <ul>
                <li>성공: {migrationResult.summary.totalSuccessful}건</li>
                <li>오류: {migrationResult.summary.totalErrors}건</li>
                <li>마이그레이션된 클라이언트: {migrationResult.summary.clientsMigrated}건</li>
              </ul>
              {migrationResult.summary.note && (
                <div style={{ 
                  padding: '10px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: '4px',
                  color: '#856404',
                  marginTop: '10px'
                }}>
                  <strong>참고:</strong> {migrationResult.summary.note}
                </div>
              )}
            </div>
          )}

          {migrationResult.migrationLog && migrationResult.migrationLog.length > 0 && (
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                📋 마이그레이션 로그 보기
              </summary>
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                backgroundColor: 'white',
                padding: '10px',
                marginTop: '10px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                {migrationResult.migrationLog.map((log, index) => (
                  <div key={index} style={{ marginBottom: '5px' }}>
                    {log}
                  </div>
                ))}
              </div>
            </details>
          )}

          {migrationResult.errors && migrationResult.errors.length > 0 && (
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                ❌ 오류 로그 보기
              </summary>
              <div style={{
                maxHeight: '150px',
                overflowY: 'auto',
                backgroundColor: 'white',
                padding: '10px',
                marginTop: '10px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                {migrationResult.errors.map((error, index) => (
                  <div key={index} style={{ marginBottom: '5px', color: '#721c24' }}>
                    {error}
                  </div>
                ))}
              </div>
            </details>
          )}

          {migrationResult.error && (
            <div style={{ marginTop: '10px' }}>
              <strong>오류 메시지:</strong> {migrationResult.error}
            </div>
          )}
        </div>
      )}

      {/* 도움말 */}
      <div style={{
        fontSize: '14px',
        color: '#6c757d',
        marginTop: '15px'
      }}>
        <p><strong>💡 사용법:</strong></p>
        <ol>
          <li><strong>데이터 백업:</strong> 현재 데이터를 JSON 파일로 백업합니다</li>
          <li><strong>데이터 복원:</strong> 백업 파일(.json)을 선택하여 데이터를 복원합니다</li>
          <li><strong>마이그레이션 시작:</strong> localStorage 데이터를 Supabase로 이동합니다</li>
        </ol>
        <p><strong>⚠️ 주의사항:</strong></p>
        <ul>
          <li>데이터 복원 시 기존 데이터가 완전히 덮어쓰입니다</li>
          <li>마이그레이션 전에 반드시 데이터 백업을 권장합니다</li>
          <li>복원 후 페이지가 자동으로 새로고침됩니다</li>
        </ul>
      </div>
    </div>
  );
};

export default MigrationPanel;
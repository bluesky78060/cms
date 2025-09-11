/**
 * 백업 파일로부터 데이터 복원 유틸리티
 */

// localStorage 키 상수
const STORAGE_KEYS = {
  COMPANY_INFO: 'constructionApp_companyInfo',
  CLIENTS: 'constructionApp_clients',
  WORK_ITEMS: 'constructionApp_workItems',
  INVOICES: 'constructionApp_invoices',
  ESTIMATES: 'constructionApp_estimates',
};

/**
 * 백업 파일로부터 데이터 복원
 * @param {Object} backupData - 백업 파일의 JSON 데이터
 * @returns {Object} 복원 결과
 */
export function restoreFromBackup(backupData) {
  const results = {
    success: false,
    restored: [],
    errors: [],
    summary: {}
  };

  try {
    // 백업 데이터 유효성 검사
    if (!backupData || !backupData.data) {
      throw new Error('올바르지 않은 백업 파일 형식입니다.');
    }

    const { data } = backupData;
    
    // 각 데이터 타입별로 복원
    Object.keys(STORAGE_KEYS).forEach(key => {
      try {
        if (data[key] !== null && data[key] !== undefined) {
          localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data[key]));
          results.restored.push(key);
          
          // 배열인 경우 개수 기록
          if (Array.isArray(data[key])) {
            results.summary[key] = `${data[key].length}개 항목`;
          } else {
            results.summary[key] = '복원 완료';
          }
        }
      } catch (error) {
        results.errors.push(`${key} 복원 실패: ${error.message}`);
      }
    });

    results.success = results.errors.length === 0;
    return results;

  } catch (error) {
    results.errors.push(`복원 실패: ${error.message}`);
    return results;
  }
}

/**
 * 현재 localStorage 데이터 확인
 * @returns {Object} 현재 저장된 데이터 요약
 */
export function getCurrentDataSummary() {
  const summary = {};
  
  Object.keys(STORAGE_KEYS).forEach(key => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS[key]);
      if (stored) {
        const data = JSON.parse(stored);
        if (Array.isArray(data)) {
          summary[key] = `${data.length}개 항목`;
        } else {
          summary[key] = '데이터 존재';
        }
      } else {
        summary[key] = '데이터 없음';
      }
    } catch (error) {
      summary[key] = '오류';
    }
  });
  
  return summary;
}

/**
 * 브라우저 콘솔에서 사용할 수 있는 복원 함수
 * 사용법: 
 * 1. 백업 파일을 텍스트 에디터로 열기
 * 2. 내용 전체 복사
 * 3. 브라우저 콘솔에서: restoreFromBackupFile(`여기에 백업 파일 내용 붙여넣기`)
 */
window.restoreFromBackupFile = function(backupJsonString) {
  try {
    const backupData = JSON.parse(backupJsonString);
    const result = restoreFromBackup(backupData);
    
    console.log('=== 데이터 복원 결과 ===');
    console.log('성공:', result.success);
    console.log('복원된 항목:', result.restored);
    console.log('요약:', result.summary);
    
    if (result.errors.length > 0) {
      console.log('오류:', result.errors);
    }
    
    if (result.success) {
      console.log('✅ 데이터 복원이 완료되었습니다. 페이지를 새로고침하세요.');
      alert('데이터 복원이 완료되었습니다. 페이지를 새로고침하세요.');
    } else {
      console.log('❌ 데이터 복원 중 오류가 발생했습니다.');
    }
    
    return result;
  } catch (error) {
    console.error('백업 파일 파싱 오류:', error);
    alert('올바르지 않은 백업 파일 형식입니다.');
    return { success: false, error: error.message };
  }
};

/**
 * 현재 데이터 상태 확인 (콘솔용)
 */
window.checkCurrentData = function() {
  const summary = getCurrentDataSummary();
  console.log('=== 현재 데이터 상태 ===');
  console.log(summary);
  return summary;
};

// 사용법 안내 출력
console.log(`
📁 데이터 복원 유틸리티 사용법:

1. 현재 데이터 확인:
   checkCurrentData()

2. 백업 파일로 복원:
   restoreFromBackupFile('백업파일JSON내용')

3. 예시:
   restoreFromBackupFile('{"timestamp":"2025-09-11...","data":{...}}')
`);
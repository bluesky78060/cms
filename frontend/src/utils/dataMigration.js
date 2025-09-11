/**
 * localStorage 데이터를 Supabase 백엔드로 마이그레이션하는 유틸리티
 */

const API_BASE_URL = 'http://localhost:8000';

// localStorage 키 상수
const STORAGE_KEYS = {
  COMPANY_INFO: 'constructionApp_companyInfo',
  CLIENTS: 'constructionApp_clients',
  WORK_ITEMS: 'constructionApp_workItems',
  INVOICES: 'constructionApp_invoices',
  ESTIMATES: 'constructionApp_estimates',
};

// localStorage에서 데이터 추출
function extractLocalStorageData() {
  const data = {};
  
  Object.keys(STORAGE_KEYS).forEach(key => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS[key]);
      data[key] = stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn(`Failed to parse ${key} from localStorage:`, error);
      data[key] = null;
    }
  });
  
  return data;
}

// 클라이언트 데이터 변환 (localStorage → API 형식)
function transformClientData(localClient) {
  return {
    company_name: localClient.name,
    representative: localClient.representative || '',
    business_number: localClient.businessNumber || '',
    address: localClient.address || '',
    email: localClient.email || '',
    phone: localClient.phone || '',
    contact_person: localClient.contactPerson || '',
    notes: localClient.notes || '',
    // workplaces는 별도 projects로 처리
  };
}



// 마이그레이션 실행 (간단한 버전)
export async function migrateLocalStorageToSupabase() {
  const migrationLog = [];
  const errors = [];
  
  try {
    // 1. API 연결 테스트
    console.log('🔍 API 연결 테스트 중...');
    const testResponse = await fetch(`${API_BASE_URL}/api/test`);
    if (!testResponse.ok) {
      throw new Error('백엔드 서버에 연결할 수 없습니다.');
    }
    migrationLog.push('✅ 백엔드 API 연결 성공');
    
    // 2. localStorage 데이터 추출
    console.log('🔍 localStorage 데이터 추출 중...');
    const localData = extractLocalStorageData();
    
    if (!localData.CLIENTS || localData.CLIENTS.length === 0) {
      throw new Error('마이그레이션할 클라이언트 데이터가 없습니다.');
    }
    
    migrationLog.push(`📊 추출된 데이터: 클라이언트 ${localData.CLIENTS.length}개`);
    
    // 3. 클라이언트 마이그레이션 (간단한 버전)
    console.log('👥 클라이언트 데이터 마이그레이션 중...');
    let successCount = 0;
    
    for (const localClient of localData.CLIENTS) {
      try {
        const clientData = transformClientData(localClient);
        
        const response = await fetch(`${API_BASE_URL}/api/clients`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(clientData)
        });
        
        if (response.ok) {
          const newClient = await response.json();
          migrationLog.push(`✅ 클라이언트 생성: ${localClient.name} (임시 ID: ${newClient.id})`);
          successCount++;
        } else {
          const error = await response.text();
          errors.push(`클라이언트 생성 실패 (${localClient.name}): ${error}`);
        }
        
      } catch (clientError) {
        errors.push(`클라이언트 생성 실패 (${localClient.name}): ${clientError.message}`);
      }
    }
    
    // 4. 마이그레이션 완료 보고
    return {
      success: errors.length === 0,
      summary: {
        totalSuccessful: successCount,
        totalErrors: errors.length,
        clientsMigrated: successCount,
        note: '이것은 데모 마이그레이션입니다. 실제 Supabase 데이터베이스에는 아직 저장되지 않았습니다.',
      },
      migrationLog,
      errors,
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      migrationLog,
      errors,
    };
  }
}

// 백업 폴더 생성 및 다운로드 처리
function downloadToBackupFolder(blob, filename) {
  // File System Access API가 지원되는 경우 (Chrome 86+)
  if ('showSaveFilePicker' in window) {
    return downloadWithFileSystemAPI(blob, filename);
  } else {
    // 기존 방식 (일반적인 다운로드)
    return downloadWithTraditionalMethod(blob, filename);
  }
}

// File System Access API 사용 (Chrome 86+)
async function downloadWithFileSystemAPI(blob, filename) {
  try {
    // 사용자에게 백업 폴더 선택 또는 생성 요청
    const opts = {
      suggestedName: filename,
      types: [{
        description: 'JSON 백업 파일',
        accept: { 'application/json': ['.json'] }
      }],
      startIn: 'downloads'
    };
    
    const fileHandle = await window.showSaveFilePicker(opts);
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    
    return { success: true, message: '백업 파일이 선택한 위치에 저장되었습니다.' };
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.warn('파일 시스템 API 사용 실패, 기본 다운로드로 전환:', error);
    }
    return downloadWithTraditionalMethod(blob, filename);
  }
}

// 기존 다운로드 방식 (모든 브라우저 지원)
function downloadWithTraditionalMethod(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  return { 
    success: true, 
    message: '백업 파일이 다운로드 폴더에 저장되었습니다.\n백업 관리를 위해 별도 폴더에 정리하는 것을 권장합니다.' 
  };
}

// 마이그레이션 후 localStorage 백업
export async function backupLocalStorageData() {
  const localData = extractLocalStorageData();
  const backup = {
    timestamp: new Date().toISOString(),
    data: localData,
    version: '1.0',
    description: '건설관리시스템 데이터 백업'
  };
  
  const backupJson = JSON.stringify(backup, null, 2);
  const blob = new Blob([backupJson], { type: 'application/json' });
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `건설관리시스템-백업-${timestamp}.json`;
  
  try {
    const result = await downloadToBackupFolder(blob, filename);
    return result;
  } catch (error) {
    console.error('백업 중 오류 발생:', error);
    return { success: false, message: `백업 실패: ${error.message}` };
  }
}

// localStorage 데이터 존재 여부 확인
export function hasLocalStorageData() {
  const data = extractLocalStorageData();
  return data.CLIENTS && data.CLIENTS.length > 0;
}
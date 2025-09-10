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

// 프로젝트 데이터 변환 (localStorage의 workplace → API 형식)
function transformProjectData(workplace, clientId) {
  return {
    client_id: clientId,
    project_name: workplace.name,
    location: workplace.address || '',
    contract_amount: workplace.contractAmount || 0,
    vat_mode: 'inclusive', // 기본값
    advance_rate: 10,
    defect_rate: 3,
    notes: workplace.project || '',
  };
}

// 청구서 데이터 변환
function transformInvoiceData(localInvoice, projectMapping) {
  return {
    project_id: projectMapping[localInvoice.clientId] || null,
    invoice_number: localInvoice.id,
    issue_date: localInvoice.date,
    due_date: localInvoice.dueDate,
    tax_mode: 'taxable',
    vat_rate: 10,
    total_amount: localInvoice.amount || 0,
    status: mapInvoiceStatus(localInvoice.status),
    notes: localInvoice.notes || '',
  };
}

// 청구서 상태 매핑
function mapInvoiceStatus(localStatus) {
  const statusMap = {
    '발송대기': 'pending',
    '발송됨': 'sent',
    '결제완료': 'paid',
    '미결제': 'unpaid',
  };
  return statusMap[localStatus] || 'pending';
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

// 마이그레이션 후 localStorage 백업
export function backupLocalStorageData() {
  const localData = extractLocalStorageData();
  const backup = {
    timestamp: new Date().toISOString(),
    data: localData,
  };
  
  const backupJson = JSON.stringify(backup, null, 2);
  const blob = new Blob([backupJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `localStorage-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// localStorage 데이터 존재 여부 확인
export function hasLocalStorageData() {
  const data = extractLocalStorageData();
  return data.CLIENTS && data.CLIENTS.length > 0;
}
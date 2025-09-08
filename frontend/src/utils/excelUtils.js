import * as XLSX from 'xlsx';

// 엑셀 파일 내보내기 함수들
export const exportToExcel = {
  // 건축주 데이터 내보내기
  clients: (clients) => {
    const data = clients.map(client => ({
      'ID': client.id,
      '이름': client.name,
      '전화번호': client.phone,
      '이메일': client.email,
      '주소': client.address,
      '프로젝트': client.projects.join(', '),
      '총 청구금액': client.totalBilled,
      '미수금': client.outstanding,
      '비고': client.notes
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '건축주 목록');
    
    // 컬럼 너비 설정
    worksheet['!cols'] = [
      { width: 8 },   // ID
      { width: 15 },  // 이름
      { width: 15 },  // 전화번호
      { width: 25 },  // 이메일
      { width: 30 },  // 주소
      { width: 20 },  // 프로젝트
      { width: 15 },  // 총 청구금액
      { width: 15 },  // 미수금
      { width: 30 }   // 비고
    ];
    
    XLSX.writeFile(workbook, '건축주_목록.xlsx');
  },

  // 작업 항목 데이터 내보내기
  workItems: (workItems) => {
    const data = workItems.map(item => ({
      'ID': item.id,
      '건축주': item.clientName,
      '작업장': item.workplaceName,
      '프로젝트': item.projectName,
      '작업명': item.name,
      '카테고리': item.category,
      '기본단가': item.defaultPrice,
      '단위': item.unit,
      '세부작업': item.description,
      '상태': item.status,
      '날짜': item.date,
      '비고': item.notes
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '작업 항목');
    
    worksheet['!cols'] = [
      { width: 8 },   // ID
      { width: 12 },  // 건축주
      { width: 20 },  // 작업장
      { width: 15 },  // 프로젝트
      { width: 15 },  // 작업명
      { width: 12 },  // 카테고리
      { width: 15 },  // 기본단가
      { width: 8 },   // 단위
      { width: 30 },  // 세부작업
      { width: 10 },  // 상태
      { width: 12 },  // 날짜
      { width: 25 }   // 비고
    ];
    
    XLSX.writeFile(workbook, '작업_항목.xlsx');
  },

  // 청구서 데이터 내보내기
  invoices: (invoices) => {
    const data = invoices.map(invoice => ({
      '청구서번호': invoice.id,
      '건축주': invoice.client,
      '프로젝트': invoice.project,
      '작업장주소': invoice.workplaceAddress,
      '청구금액': invoice.amount,
      '상태': invoice.status,
      '발행일': invoice.date,
      '지불기한': invoice.dueDate,
      '작업항목수': invoice.workItems.length
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '청구서 목록');
    
    worksheet['!cols'] = [
      { width: 15 },  // 청구서번호
      { width: 12 },  // 건축주
      { width: 15 },  // 프로젝트
      { width: 35 },  // 작업장주소
      { width: 15 },  // 청구금액
      { width: 12 },  // 상태
      { width: 12 },  // 발행일
      { width: 12 },  // 지불기한
      { width: 12 }   // 작업항목수
    ];
    
    XLSX.writeFile(workbook, '청구서_목록.xlsx');
  },

  // 상세 청구서 내보내기
  invoiceDetail: (invoice) => {
    const headerData = [
      ['청구서 번호', invoice.id],
      ['건축주', invoice.client],
      ['프로젝트', invoice.project],
      ['작업장 주소', invoice.workplaceAddress],
      ['발행일', invoice.date],
      ['지불 기한', invoice.dueDate],
      ['상태', invoice.status],
      ['총 금액', invoice.amount],
      []
    ];

    const workItemData = invoice.workItems.map((item, index) => ({
      '순번': index + 1,
      '작업명': item.name,
      '수량': item.quantity,
      '단가': item.unitPrice,
      '합계': item.total,
      '카테고리': item.category,
      '설명': item.description,
      '비고': item.notes
    }));

    const workbook = XLSX.utils.book_new();
    
    // 헤더 시트
    const headerSheet = XLSX.utils.aoa_to_sheet(headerData);
    XLSX.utils.book_append_sheet(workbook, headerSheet, '청구서 정보');
    
    // 작업 항목 시트
    const workItemSheet = XLSX.utils.json_to_sheet(workItemData);
    XLSX.utils.book_append_sheet(workbook, workItemSheet, '작업 내역');
    
    workItemSheet['!cols'] = [
      { width: 8 },   // 순번
      { width: 20 },  // 작업명
      { width: 10 },  // 수량
      { width: 15 },  // 단가
      { width: 15 },  // 합계
      { width: 12 },  // 카테고리
      { width: 30 },  // 설명
      { width: 25 }   // 비고
    ];
    
    XLSX.writeFile(workbook, `청구서_${invoice.id}.xlsx`);
  }
};

// 엑셀 파일 가져오기 함수들
export const importFromExcel = {
  // 건축주 데이터 가져오기
  clients: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          const clients = jsonData.map((row, index) => ({
            id: row['ID'] || index + 1,
            name: row['이름'] || '',
            phone: row['전화번호'] || '',
            email: row['이메일'] || '',
            address: row['주소'] || '',
            projects: row['프로젝트'] ? row['프로젝트'].split(', ') : [],
            totalBilled: row['총 청구금액'] || 0,
            outstanding: row['미수금'] || 0,
            notes: row['비고'] || '',
            workplaces: [] // 기본값
          }));
          
          resolve(clients);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  },

  // 작업 항목 데이터 가져오기
  workItems: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          const workItems = jsonData.map((row, index) => ({
            id: row['ID'] || index + 1,
            clientId: row['건축주ID'] || 1,
            clientName: row['건축주'] || '',
            workplaceId: row['작업장ID'] || 1,
            workplaceName: row['작업장'] || '',
            projectName: row['프로젝트'] || '',
            name: row['작업명'] || '',
            category: row['카테고리'] || '',
            defaultPrice: row['기본단가'] || 0,
            unit: row['단위'] || '',
            description: row['세부작업'] || '',
            status: row['상태'] || '예정',
            date: row['날짜'] || new Date().toISOString().split('T')[0],
            notes: row['비고'] || ''
          }));
          
          resolve(workItems);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }
};

// 엑셀 템플릿 생성 함수들
export const createTemplate = {
  // 건축주 템플릿
  clients: () => {
    const templateData = [
      {
        'ID': 1,
        '이름': '예시건축주',
        '전화번호': '010-1234-5678',
        '이메일': 'example@email.com',
        '주소': '서울시 강남구 테헤란로 123',
        '프로젝트': '주택 신축, 리모델링',
        '총 청구금액': 15000000,
        '미수금': 5000000,
        '비고': '우수 고객'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '건축주 템플릿');
    
    worksheet['!cols'] = [
      { width: 8 },   // ID
      { width: 15 },  // 이름
      { width: 15 },  // 전화번호
      { width: 25 },  // 이메일
      { width: 30 },  // 주소
      { width: 20 },  // 프로젝트
      { width: 15 },  // 총 청구금액
      { width: 15 },  // 미수금
      { width: 30 }   // 비고
    ];
    
    XLSX.writeFile(workbook, '건축주_템플릿.xlsx');
  },

  // 작업 항목 템플릿
  workItems: () => {
    const templateData = [
      {
        'ID': 1,
        '건축주ID': 1,
        '건축주': '예시건축주',
        '작업장ID': 1,
        '작업장': '신축 현장',
        '프로젝트': '주택 신축',
        '작업명': '기초공사',
        '카테고리': '토목공사',
        '기본단가': 3000000,
        '단위': '식',
        '세부작업': '건물 기초 및 지반 작업',
        '상태': '완료',
        '날짜': '2024-09-01',
        '비고': '콘크리트 강도 확인 필요'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '작업항목 템플릿');
    
    worksheet['!cols'] = [
      { width: 8 },   // ID
      { width: 10 },  // 건축주ID
      { width: 12 },  // 건축주
      { width: 10 },  // 작업장ID
      { width: 20 },  // 작업장
      { width: 15 },  // 프로젝트
      { width: 15 },  // 작업명
      { width: 12 },  // 카테고리
      { width: 15 },  // 기본단가
      { width: 8 },   // 단위
      { width: 30 },  // 세부작업
      { width: 10 },  // 상태
      { width: 12 },  // 날짜
      { width: 25 }   // 비고
    ];
    
    XLSX.writeFile(workbook, '작업항목_템플릿.xlsx');
  }
};
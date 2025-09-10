import React, { createContext, useContext, useState, useEffect } from 'react';

// Context 생성
const AppContext = createContext();

// Custom Hook for using context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// localStorage 키 상수
const STORAGE_KEYS = {
  COMPANY_INFO: 'constructionApp_companyInfo',
  CLIENTS: 'constructionApp_clients',
  WORK_ITEMS: 'constructionApp_workItems',
  INVOICES: 'constructionApp_invoices',
  ESTIMATES: 'constructionApp_estimates',
  UNITS: 'constructionApp_units',
  CATEGORIES: 'constructionApp_categories',
  STAMP_IMAGE: 'constructionApp_stampImage'
};

// localStorage 유틸리티 함수
const loadFromStorage = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.warn(`Failed to load ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn(`Failed to save ${key} to localStorage:`, error);
  }
};

// Provider 컴포넌트
export const AppProvider = ({ children }) => {
  // 기본 데이터 정의
  const defaultCompanyInfo = {
    name: '한국건설',
    businessNumber: '123-45-67890',
    address: '서울시 강남구 테헤란로 123',
    phone: '02-1234-5678',
    email: 'info@hangeonconstruction.com',
    representative: '홍길동',
    bankAccount: '신한은행 110-123-456789',
    accountHolder: '한국건설(주)'
  };

  // 건축업체 정보
  const [companyInfo, setCompanyInfo] = useState(() => 
    loadFromStorage(STORAGE_KEYS.COMPANY_INFO, defaultCompanyInfo)
  );
  const defaultClients = [
    {
      id: 1,
      name: '김철수',
      phone: '010-1234-5678',
      email: 'kim@email.com',
      address: '서울시 강남구 테헤란로 123',
      workplaces: [
        {
          id: 1,
          name: '신축 주택',
          address: '서울시 강남구 역삼동 123-45',
          description: '단독주택 신축 현장'
        },
        {
          id: 2,
          name: '차고 건설',
          address: '서울시 강남구 역삼동 123-45',
          description: '기존 주택 부지 내 차고 건설'
        }
      ],
      projects: ['단독주택 신축'],
      totalBilled: 12000000,
      outstanding: 3500000,
      notes: '성실한 고객, 추천 가능'
    },
    {
      id: 2,
      name: '박영희',
      phone: '010-2345-6789',
      email: 'park@email.com',
      address: '서울시 서초구 서초동 456',
      workplaces: [
        {
          id: 1,
          name: '아파트 리모델링',
          address: '서울시 서초구 반포동 아파트 101동 503호',
          description: '아파트 내부 전체 리모델링'
        }
      ],
      projects: ['아파트 리모델링'],
      totalBilled: 5200000,
      outstanding: 1200000,
      notes: '디테일에 민감함'
    },
    {
      id: 3,
      name: '이민호',
      phone: '010-3456-7890',
      email: 'lee@email.com',
      address: '서울시 마포구 홍대입구로 789',
      workplaces: [
        {
          id: 1,
          name: '상가 1층',
          address: '서울시 마포구 홍대입구 상가 1층',
          description: '카페 개업을 위한 내부 공사'
        },
        {
          id: 2,
          name: '상가 2층',
          address: '서울시 마포구 홍대입구 상가 2층',
          description: '사무실 인테리어 공사'
        }
      ],
      projects: ['상가 내부공사'],
      totalBilled: 7800000,
      outstanding: 2600000,
      notes: '빠른 진행 선호'
    },
    {
      id: 4,
      name: '정수진',
      phone: '010-4567-8901',
      email: 'jung@email.com',
      address: '경기도 성남시 분당구 정자동 321',
      workplaces: [
        {
          id: 1,
          name: '화장실 리모델링',
          address: '경기도 성남시 분당구 정자동 아파트 15동 702호',
          description: '안방 화장실 전체 리모델링'
        }
      ],
      projects: ['화장실 리모델링'],
      totalBilled: 1500000,
      outstanding: 0,
      notes: '꼼꼼하고 신중함'
    }
  ];

  // 건축주 데이터
  const [clients, setClients] = useState(() => 
    loadFromStorage(STORAGE_KEYS.CLIENTS, defaultClients)
  );

  const defaultWorkItems = [
    {
      id: 1,
      clientId: 1,
      clientName: '김철수',
      workplaceId: 1,
      workplaceName: '신축 주택',
      name: '기초공사',
      category: '토목공사',
      defaultPrice: 3000000,
      quantity: 1,
      unit: '식',
      description: '건물 기초 및 지반 작업',
      projectName: '단독주택 신축',
      status: '완료',
      date: '2024-09-01',
      notes: '콘크리트 강도 확인 필요'
    },
    {
      id: 2,
      clientId: 1,
      clientName: '김철수',
      workplaceId: 1,
      workplaceName: '신축 주택',
      name: '골조공사',
      category: '구조공사',
      defaultPrice: 4000000,
      quantity: 1,
      unit: '식',
      description: '철골 및 철근콘크리트 골조 작업',
      projectName: '단독주택 신축',
      status: '완료',
      date: '2024-08-28',
      notes: '철근 간격 적정성 검토 필요'
    },
    {
      id: 3,
      clientId: 2,
      clientName: '박영희',
      workplaceId: 1,
      workplaceName: '아파트 리모델링',
      name: '벽체 철거',
      category: '철거공사',
      defaultPrice: 50000,
      quantity: 25,
      unit: '㎡',
      description: '기존 벽체 철거 및 폐기물 처리',
      projectName: '아파트 리모델링',
      status: '완료',
      date: '2024-08-25',
      notes: '소음 방지를 위해 오전 작업 권장'
    },
    {
      id: 4,
      clientId: 2,
      clientName: '박영희',
      workplaceId: 1,
      workplaceName: '아파트 리모델링',
      name: '바닥 시공',
      category: '마감공사',
      defaultPrice: 1200000,
      quantity: 1,
      unit: '식',
      description: '바닥재 설치 및 마감 작업',
      projectName: '아파트 리모델링',
      status: '완료',
      date: '2024-09-02',
      notes: '학출 방지를 위한 단열 처리 필요'
    },
    {
      id: 5,
      clientId: 3,
      clientName: '이민호',
      workplaceId: 1,
      workplaceName: '상가 1층',
      name: '내부 칸막이',
      category: '내부공사',
      defaultPrice: 120000,
      quantity: 30,
      unit: '㎡',
      description: '내부 칸막이벽 설치',
      projectName: '상가 내부공사',
      status: '진행중',
      date: '2024-08-20',
      notes: '소방 규정 준수 확인 필요'
    },
    {
      id: 6,
      clientId: 3,
      clientName: '이민호',
      workplaceId: 2,
      workplaceName: '상가 2층',
      name: '전기공사',
      category: '설비공사',
      defaultPrice: 1500000,
      quantity: 1,
      unit: '식',
      description: '전기 배선 및 조명 설치',
      projectName: '상가 내부공사',
      status: '예정',
      date: '2024-09-10',
      notes: '전압 용량 사전 확인 필요'
    },
    {
      id: 7,
      clientId: 4,
      clientName: '정수진',
      workplaceId: 1,
      workplaceName: '화장실 리모델링',
      name: '화장실 철거',
      category: '철거공사',
      defaultPrice: 500000,
      quantity: 1,
      unit: '식',
      description: '기존 화장실 철거',
      projectName: '화장실 리모델링',
      status: '완료',
      date: '2024-08-15',
      notes: '방수 처리 상태 확인 필요'
    },
    {
      id: 8,
      clientId: 4,
      clientName: '정수진',
      workplaceId: 1,
      workplaceName: '화장실 리모델링',
      name: '화장실 설치',
      category: '설비공사',
      defaultPrice: 1000000,
      quantity: 1,
      unit: '식',
      description: '새로운 화장실 설치 및 배관',
      projectName: '화장실 리모델링',
      status: '완료',
      date: '2024-08-22',
      notes: '급수 압력 테스트 완료'
    }
  ];

  // 작업 항목 데이터
  const [workItems, setWorkItems] = useState(() => 
    loadFromStorage(STORAGE_KEYS.WORK_ITEMS, defaultWorkItems)
  );

  const defaultInvoices = [
    {
      id: 'INV-2024-001',
      client: '김철수',
      project: '단독주택 신축',
      workplaceAddress: '서울시 강남구 역삼동 123-45',
      amount: 8500000,
      status: '발송됨',
      date: '2024-09-01',
      dueDate: '2024-09-15',
      workItems: [
        { name: '기초공사', quantity: 1, unitPrice: 3000000, total: 3000000, description: '건물 기초 및 지반 작업', category: '토목공사', notes: '콘크리트 강도 확인 필요' },
        { name: '골조공사', quantity: 1, unitPrice: 4000000, total: 4000000, description: '철골 및 철근콘크리트 골조 작업', category: '구조공사', notes: '철근 간격 적정성 검토 필요' },
        { name: '부대비용', quantity: 1, unitPrice: 1500000, total: 1500000, description: '자재운반 및 기타 부대비용', category: '기타', notes: '운반 차량 접근성 확인' }
      ]
    },
    {
      id: 'INV-2024-002',
      client: '박영희',
      project: '아파트 리모델링',
      workplaceAddress: '서울시 서초구 반포동 아파트 101동 503호',
      amount: 3200000,
      status: '결제완료',
      date: '2024-08-28',
      dueDate: '2024-09-12',
      workItems: [
        { name: '벽체 철거', quantity: 25, unitPrice: 50000, total: 1250000, description: '기존 벽체 철거 및 폐기물 처리', category: '철거공사', notes: '소음 방지를 위해 오전 작업 권장' },
        { name: '바닥 시공', quantity: 1, unitPrice: 1200000, total: 1200000, description: '바닥재 설치 및 마감 작업', category: '마감공사', notes: '학출 방지를 위한 단열 처리 필요' },
        { name: '도배 작업', quantity: 1, unitPrice: 750000, total: 750000, description: '전체 벽면 도배', category: '마감공사', notes: '습도 조절 후 시공' }
      ]
    },
    {
      id: 'INV-2024-003',
      client: '이민호',
      project: '상가 내부공사',
      workplaceAddress: '서울시 마포구 홍대입구 상가 1층',
      amount: 5800000,
      status: '미결제',
      date: '2024-08-25',
      dueDate: '2024-09-08',
      workItems: [
        { name: '내부 칸막이', quantity: 30, unitPrice: 120000, total: 3600000, description: '내부 칸막이벽 설치', category: '내부공사', notes: '소방 규정 준수 확인 필요' },
        { name: '전기공사', quantity: 1, unitPrice: 1500000, total: 1500000, description: '전기 배선 및 조명 설치', category: '설비공사', notes: '전압 용량 사전 확인 필요' },
        { name: '마감재 설치', quantity: 1, unitPrice: 700000, total: 700000, description: '천장 및 벽면 마감재 설치', category: '마감공사', notes: '방화 자재 사용 필수' }
      ]
    },
    {
      id: 'INV-2024-004',
      client: '정수진',
      project: '화장실 리모델링',
      workplaceAddress: '경기도 성남시 분당구 정자동 아파트 15동 702호',
      amount: 1500000,
      status: '발송대기',
      date: '2024-08-22',
      dueDate: '2024-09-05',
      workItems: [
        { name: '화장실 철거', quantity: 1, unitPrice: 500000, total: 500000, description: '기존 화장실 철거', category: '철거공사', notes: '방수 처리 상태 확인 필요' },
        { name: '화장실 설치', quantity: 1, unitPrice: 1000000, total: 1000000, description: '새로운 화장실 설치 및 배관', category: '설비공사', notes: '급수 압력 테스트 완료' }
      ]
    }
  ];

  // 청구서 데이터
  const [invoices, setInvoices] = useState(() => 
    loadFromStorage(STORAGE_KEYS.INVOICES, defaultInvoices)
  );

  const defaultEstimates = [
    {
      id: 'EST-2024-001',
      clientId: 1,
      clientName: '김철수',
      workplaceId: 1,
      workplaceName: '신축 주택',
      workplaceAddress: '서울시 강남구 역삼동 123-45',
      projectName: '단독주택 신축',
      title: '단독주택 신축 공사 견적서',
      date: '2024-08-15',
      validUntil: '2024-09-15',
      status: '검토중',
      totalAmount: 85000000,
      items: [
        {
          id: 1,
          category: '토목공사',
          name: '기초공사',
          description: '건물 기초 및 지반 작업',
          quantity: 1,
          unit: '식',
          unitPrice: 30000000,
          total: 30000000,
          notes: '콘크리트 강도 확인 필요'
        },
        {
          id: 2,
          category: '구조공사',
          name: '골조공사',
          description: '철골 및 철근콘크리트 골조 작업',
          quantity: 1,
          unit: '식',
          unitPrice: 40000000,
          total: 40000000,
          notes: '철근 간격 적정성 검토 필요'
        },
        {
          id: 3,
          category: '마감공사',
          name: '내외부 마감',
          description: '내부 및 외부 마감재 시공',
          quantity: 1,
          unit: '식',
          unitPrice: 15000000,
          total: 15000000,
          notes: '고급 마감재 적용'
        }
      ],
      notes: '부가세 별도, 설계 변경 시 추가 견적 필요'
    },
    {
      id: 'EST-2024-002',
      clientId: 2,
      clientName: '박영희',
      workplaceId: 1,
      workplaceName: '아파트 리모델링',
      workplaceAddress: '서울시 서초구 반포동 아파트 101동 503호',
      projectName: '아파트 리모델링',
      title: '아파트 전체 리모델링 견적서',
      date: '2024-08-10',
      validUntil: '2024-09-10',
      status: '승인됨',
      totalAmount: 32000000,
      items: [
        {
          id: 1,
          category: '철거공사',
          name: '벽체 철거',
          description: '기존 벽체 철거 및 폐기물 처리',
          quantity: 25,
          unit: '㎡',
          unitPrice: 500000,
          total: 12500000,
          notes: '소음 방지를 위해 오전 작업 권장'
        },
        {
          id: 2,
          category: '마감공사',
          name: '바닥 및 벽면 시공',
          description: '바닥재 설치 및 벽면 마감 작업',
          quantity: 1,
          unit: '식',
          unitPrice: 19500000,
          total: 19500000,
          notes: '습도 조절 후 시공'
        }
      ],
      notes: '공사 기간 약 30일 예상'
    }
  ];

  // 견적서 데이터
  const [estimates, setEstimates] = useState(() => 
    loadFromStorage(STORAGE_KEYS.ESTIMATES, defaultEstimates)
  );

  // 기본 단위 및 카테고리 정의
  const defaultUnits = ['식', '㎡', '개', '톤', 'm', 'kg', '회', '일'];
  const defaultCategories = ['토목공사', '구조공사', '철거공사', '마감공사', '설비공사', '내부공사', '기타'];

  // 단위 및 카테고리 데이터
  const [units, setUnits] = useState(() => 
    loadFromStorage(STORAGE_KEYS.UNITS, defaultUnits)
  );
  const [categories, setCategories] = useState(() => 
    loadFromStorage(STORAGE_KEYS.CATEGORIES, defaultCategories)
  );

  // 도장 이미지 데이터
  const [stampImage, setStampImage] = useState(() => 
    loadFromStorage(STORAGE_KEYS.STAMP_IMAGE, null)
  );

  // 완료된 작업 항목들을 가져오는 함수
  const getCompletedWorkItems = () => {
    return workItems.filter(item => item.status === '완료');
  };

  // 건축주별 완료된 작업 항목들을 가져오는 함수
  const getCompletedWorkItemsByClient = (clientId) => {
    return workItems.filter(item => item.clientId === clientId && item.status === '완료');
  };

  // 청구서 생성을 위한 작업 항목 추가 함수
  const addWorkItemToInvoice = (workItem, quantity = null, unitPrice = null) => {
    const finalQuantity = quantity !== null ? quantity : (workItem.quantity || 1);
    const finalUnitPrice = unitPrice || workItem.defaultPrice;
    return {
      name: workItem.name,
      quantity: finalQuantity,
      unitPrice: finalUnitPrice,
      total: finalQuantity * finalUnitPrice,
      description: workItem.description,
      category: workItem.category,
      notes: workItem.notes || ''
    };
  };

  // 데이터 변경 시 localStorage에 저장
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.COMPANY_INFO, companyInfo);
  }, [companyInfo]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CLIENTS, clients);
  }, [clients]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.WORK_ITEMS, workItems);
  }, [workItems]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.INVOICES, invoices);
  }, [invoices]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ESTIMATES, estimates);
  }, [estimates]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.UNITS, units);
  }, [units]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CATEGORIES, categories);
  }, [categories]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.STAMP_IMAGE, stampImage);
  }, [stampImage]);

  // 건축주별 통계 계산 함수들
  const getClientProjectCount = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (!client || !client.workplaces) return 0;
    return client.workplaces.filter(wp => wp.project).length;
  };

  const getClientTotalBilled = (clientId) => {
    const clientInvoices = invoices.filter(invoice => {
      const client = clients.find(c => c.id === clientId);
      return client && (invoice.client === client.name || invoice.clientId === clientId);
    });
    return clientInvoices.reduce((total, invoice) => total + (invoice.amount || 0), 0);
  };

  const getClientOutstanding = (clientId) => {
    const clientInvoices = invoices.filter(invoice => {
      const client = clients.find(c => c.id === clientId);
      return client && (invoice.client === client.name || invoice.clientId === clientId);
    });
    return clientInvoices
      .filter(invoice => invoice.status === '미결제' || invoice.status === '발송됨' || invoice.status === '발송대기')
      .reduce((total, invoice) => total + (invoice.amount || 0), 0);
  };

  // 견적서를 작업 항목으로 변환하는 함수
  const convertEstimateToWorkItems = (estimateId) => {
    const estimate = estimates.find(est => est.id === estimateId);
    if (!estimate) return [];

    const newWorkItems = estimate.items.map((item, index) => ({
      id: Math.max(...workItems.map(i => i.id)) + index + 1,
      clientId: estimate.clientId,
      clientName: estimate.clientName,
      workplaceId: estimate.workplaceId,
      workplaceName: estimate.workplaceName,
      projectName: estimate.projectName,
      name: item.name,
      category: item.category,
      defaultPrice: item.unitPrice,
      quantity: item.quantity,
      unit: item.unit,
      description: item.description,
      status: '예정',
      date: new Date().toISOString().split('T')[0],
      notes: item.notes || ''
    }));

    setWorkItems(prev => [...prev, ...newWorkItems]);
    
    // 견적서 상태를 '작업 전환됨'으로 변경
    setEstimates(prev => prev.map(est => 
      est.id === estimateId 
        ? { ...est, status: '작업 전환됨' }
        : est
    ));

    return newWorkItems;
  };

  const value = {
    companyInfo,
    setCompanyInfo,
    clients,
    setClients,
    workItems,
    setWorkItems,
    invoices,
    setInvoices,
    estimates,
    setEstimates,
    units,
    setUnits,
    categories,
    setCategories,
    stampImage,
    setStampImage,
    getCompletedWorkItems,
    getCompletedWorkItemsByClient,
    addWorkItemToInvoice,
    convertEstimateToWorkItems,
    getClientProjectCount,
    getClientTotalBilled,
    getClientOutstanding
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
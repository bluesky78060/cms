// 기본 데이터 정의

export const DEFAULT_COMPANY_INFO = {
  name: '한국건설',
  businessNumber: '123-45-67890',
  address: '서울시 강남구 테헤란로 123',
  phone: '02-1234-5678',
  email: 'info@hangeonconstruction.com',
  representative: '홍길동',
  bankAccount: '신한은행 110-123-456789',
  accountHolder: '한국건설(주)'
};

export const DEFAULT_CLIENTS = [
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
  }
];

export const DEFAULT_WORK_ITEMS = [
  {
    id: 1,
    clientId: 1,
    clientName: '김철수',
    projectName: '신축 주택',
    date: '2024-09-01',
    description: '기초공사',
    detailedWork: '기초 굴착 및 철근 배근',
    quantity: 20,
    unit: 'M²',
    unitPrice: 150000,
    totalPrice: 3000000,
    notes: '기초 깊이 1.2m로 시공'
  },
  {
    id: 2,
    clientId: 1,
    clientName: '김철수',
    projectName: '신축 주택',
    date: '2024-09-02',
    description: '골조공사',
    detailedWork: '1층 슬라브 타설',
    quantity: 50,
    unit: 'M²',
    unitPrice: 200000,
    totalPrice: 10000000,
    notes: '콘크리트 강도 24MPa 사용'
  }
];

export const DEFAULT_INVOICES = [
  {
    id: 1,
    clientId: 1,
    clientName: '김철수',
    projectName: '신축 주택',
    date: '2024-09-03',
    dueDate: '2024-10-03',
    items: [
      {
        description: '기초공사',
        detailedWork: '기초 굴착 및 철근 배근',
        quantity: 20,
        unit: 'M²',
        unitPrice: 150000,
        totalPrice: 3000000,
        notes: '기초 깊이 1.2m로 시공'
      },
      {
        description: '골조공사',
        detailedWork: '1층 슬라브 타설',
        quantity: 50,
        unit: 'M²',
        unitPrice: 200000,
        totalPrice: 10000000,
        notes: '콘크리트 강도 24MPa 사용'
      }
    ],
    subtotal: 13000000,
    tax: 1300000,
    total: 14300000,
    notes: '공사 진행 상황 양호'
  }
];
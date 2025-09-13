import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';

// 환경 감지: Electron 환경인지 확인
const isElectron = () => {
  return typeof window !== 'undefined' && window.process && window.process.type;
};

// 로컬 파일 저장소 (Electron에서만 사용)
let LocalFileStorage = null;
let fileStorage = null;

// Electron 환경에서만 로컬 파일 저장소 초기화
const initFileStorage = async () => {
  if (isElectron()) {
    try {
      const { ipcRenderer } = window.require('electron');
      
      // 메인 프로세스에서 데이터 경로 가져오기
      const dataPath = await ipcRenderer.invoke('get-data-path');
      
      // 파일 저장소 초기화
      LocalFileStorage = window.require('./utils/localFileStorage');
      fileStorage = new LocalFileStorage(dataPath);
      await fileStorage.init();
      
      console.log('✅ 로컬 파일 저장소 초기화 완료:', dataPath);
      return true;
    } catch (error) {
      console.warn('⚠️ 로컬 파일 저장소 초기화 실패, localStorage 폴백:', error);
      return false;
    }
  }
  return false;
};

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

// 사용자별 localStorage 키 생성 함수
const getUserStorageKeys = (currentUser) => {
  if (!currentUser) {
    return {
      COMPANY_INFO: 'constructionApp_companyInfo',
      CLIENTS: 'constructionApp_clients',
      WORK_ITEMS: 'constructionApp_workItems',
      INVOICES: 'constructionApp_invoices',
      ESTIMATES: 'constructionApp_estimates',
      UNITS: 'constructionApp_units',
      CATEGORIES: 'constructionApp_categories',
      STAMP_IMAGE: 'constructionApp_stampImage'
    };
  }
  
  const prefix = `USER_${currentUser}_`;
  return {
    COMPANY_INFO: `${prefix}COMPANY_INFO`,
    CLIENTS: `${prefix}CLIENTS`,
    WORK_ITEMS: `${prefix}WORK_ITEMS`,
    INVOICES: `${prefix}INVOICES`,
    ESTIMATES: `${prefix}ESTIMATES`,
    UNITS: `${prefix}UNITS`,
    CATEGORIES: `${prefix}CATEGORIES`,
    STAMP_IMAGE: `${prefix}STAMP_IMAGE`
  };
};

// 통합 저장소 유틸리티 함수 (로컬 파일 + localStorage 지원)
const loadFromStorage = async (currentUser, dataType, defaultValue) => {
  try {
    // 파일 저장소 우선 시도 (Electron 환경)
    if (fileStorage && currentUser) {
      const data = await fileStorage.getUserData(currentUser, dataType, null);
      if (data !== null) {
        console.log(`[DEBUG] Loading from file storage: ${currentUser}/${dataType}`, data);
        return processLoadedData(dataType, data, defaultValue);
      }
    }
    
    // localStorage 폴백
    const storageKeys = getUserStorageKeys(currentUser);
    const key = storageKeys[dataType];
    const stored = localStorage.getItem(key);
    
    if (!stored) return defaultValue;
    
    const parsed = JSON.parse(stored);
    return processLoadedData(dataType, parsed, defaultValue);
  } catch (error) {
    console.warn(`Failed to load ${currentUser}/${dataType}:`, error);
    return defaultValue;
  }
};

const saveToStorage = async (currentUser, dataType, data) => {
  try {
    // 파일 저장소 우선 시도 (Electron 환경)
    if (fileStorage && currentUser) {
      await fileStorage.setUserData(currentUser, dataType, data);
      console.log(`[DEBUG] Saved to file storage: ${currentUser}/${dataType}`, data);
    }
    
    // localStorage에도 저장 (웹 호환성 및 백업)
    const storageKeys = getUserStorageKeys(currentUser);
    const key = storageKeys[dataType];
    console.log(`[DEBUG] Saving to localStorage: ${key}`, data);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn(`Failed to save ${currentUser}/${dataType}:`, error);
  }
};

// 로드된 데이터 후처리 함수
const processLoadedData = (dataType, parsed, defaultValue) => {
  // 배열인 경우 빈 배열이면 기본값 사용
  if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(defaultValue) && defaultValue.length > 0) {
    console.log(`[DEBUG] Using default value for empty array: ${dataType}`, defaultValue);
    return defaultValue;
  }
  
  // 카테고리의 경우 기본 카테고리가 모두 포함되어 있는지 확인하고 업데이트
  if (dataType === 'CATEGORIES' && Array.isArray(parsed) && Array.isArray(defaultValue)) {
    const expectedCategories = ['토목공사', '구조공사', '철거공사', '마감공사', '설비공사', '기타'];
    const hasAllExpected = expectedCategories.every(cat => parsed.includes(cat));
    
    if (!hasAllExpected) {
      console.log(`[DEBUG] Updating categories with missing items: ${dataType}`, expectedCategories);
      // 기존 항목은 유지하고 누락된 기본 항목 추가
      const updatedCategories = [...new Set([...parsed, ...expectedCategories])];
      // 기본 순서로 정렬
      const orderedCategories = expectedCategories.filter(cat => updatedCategories.includes(cat));
      // 기본 카테고리에 없는 커스텀 항목들을 끝에 추가
      const customCategories = updatedCategories.filter(cat => !expectedCategories.includes(cat));
      return [...orderedCategories, ...customCategories];
    }
  }
  
  return parsed;
};

// Provider 컴포넌트
export const AppProvider = ({ children }) => {
  const { currentUser, isLoggedIn } = useUser();
  
  
  // 기본 데이터 정의 함수
  const getDefaultCompanyInfo = (user) => {
    if (!user) return {};
    return {
      name: `${user}의 건설회사`,
      businessNumber: '123-45-67890',
      address: '서울시 강남구 테헤란로 123',
      phone: '02-1234-5678',
      email: `${user.toLowerCase()}@construction.com`,
      representative: user,
      bankAccount: '신한은행 110-123-456789',
      accountHolder: `${user} 건설회사`
    };
  };

  // State 정의 - 항상 모든 hooks를 호출
  const [companyInfo, setCompanyInfo] = useState({});
  const [clients, setClients] = useState([]);
  const [workItems, setWorkItems] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [units, setUnits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stampImage, setStampImage] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [storageInitialized, setStorageInitialized] = useState(false);

  // 저장소 초기화
  useEffect(() => {
    const init = async () => {
      const fileStorageReady = await initFileStorage();
      setStorageInitialized(true);
      console.log(`[DEBUG] Storage initialized: file=${fileStorageReady}, localStorage=true`);
    };
    init();
  }, []);

  // 사용자 변경 시 데이터 로드
  useEffect(() => {
    if (!storageInitialized) return;
    
    console.log(`[DEBUG] User change effect: isLoggedIn=${isLoggedIn}, currentUser=${currentUser}`);
    
    if (isLoggedIn && currentUser) {
      loadUserData(currentUser);
    } else {
      // 로그아웃 시에는 데이터를 초기화하지 않음 - 파일은 유지
      // UI는 로그인 화면으로 전환되므로 데이터가 보이지 않음
      setIsDataLoaded(false);
    }
  }, [isLoggedIn, currentUser, storageInitialized, loadUserData]);

  // 사용자 데이터 로드 함수
  const loadUserData = async (username) => {
    try {
      console.log(`[DEBUG] Loading data for user: ${username}`);
      
      const defaultCompanyInfo = getDefaultCompanyInfo(username);
      const defaultClients = [];
      const defaultWorkItems = [];
      const defaultInvoices = [];
      const defaultEstimates = [];
      const defaultUnits = ['식', 'm', '㎡', 'kg', '톤', '개', '회', '일'];
      const defaultCategories = ['토목공사', '구조공사', '철거공사', '마감공사', '설비공사', '기타'];
      
      const [
        companyData,
        clientsData,
        workItemsData,
        invoicesData,
        estimatesData,
        unitsData,
        categoriesData,
        stampData
      ] = await Promise.all([
        loadFromStorage(username, 'COMPANY_INFO', defaultCompanyInfo),
        loadFromStorage(username, 'CLIENTS', defaultClients),
        loadFromStorage(username, 'WORK_ITEMS', defaultWorkItems),
        loadFromStorage(username, 'INVOICES', defaultInvoices),
        loadFromStorage(username, 'ESTIMATES', defaultEstimates),
        loadFromStorage(username, 'UNITS', defaultUnits),
        loadFromStorage(username, 'CATEGORIES', defaultCategories),
        loadFromStorage(username, 'STAMP_IMAGE', null)
      ]);
      
      setCompanyInfo(companyData);
      setClients(clientsData);
      setWorkItems(workItemsData);
      setInvoices(invoicesData);
      setEstimates(estimatesData);
      setUnits(unitsData);
      setCategories(categoriesData);
      setStampImage(stampData);
      setIsDataLoaded(true);
      
      console.log(`[DEBUG] Data loaded successfully for user: ${username}`);
    } catch (error) {
      console.error(`[ERROR] Failed to load data for user: ${username}`, error);
      setIsDataLoaded(false);
    }
  };

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

  // 데이터 변경 시 저장 (데이터 로드 완료 후에만)
  useEffect(() => {
    console.log(`[DEBUG] CompanyInfo save effect: isLoggedIn=${isLoggedIn}, currentUser=${currentUser}, isDataLoaded=${isDataLoaded}, data=`, companyInfo);
    if (isLoggedIn && currentUser && isDataLoaded && storageInitialized) {
      saveToStorage(currentUser, 'COMPANY_INFO', companyInfo);
    }
  }, [companyInfo, isLoggedIn, isDataLoaded, currentUser, storageInitialized]);

  useEffect(() => {
    if (isLoggedIn && currentUser && isDataLoaded && storageInitialized) {
      saveToStorage(currentUser, 'CLIENTS', clients);
    }
  }, [clients, isLoggedIn, isDataLoaded, currentUser, storageInitialized]);

  useEffect(() => {
    if (isLoggedIn && currentUser && isDataLoaded && storageInitialized) {
      saveToStorage(currentUser, 'WORK_ITEMS', workItems);
    }
  }, [workItems, isLoggedIn, isDataLoaded, currentUser, storageInitialized]);

  useEffect(() => {
    if (isLoggedIn && currentUser && isDataLoaded && storageInitialized) {
      saveToStorage(currentUser, 'INVOICES', invoices);
    }
  }, [invoices, isLoggedIn, isDataLoaded, currentUser, storageInitialized]);

  useEffect(() => {
    if (isLoggedIn && currentUser && isDataLoaded && storageInitialized) {
      saveToStorage(currentUser, 'ESTIMATES', estimates);
    }
  }, [estimates, isLoggedIn, isDataLoaded, currentUser, storageInitialized]);

  useEffect(() => {
    if (isLoggedIn && currentUser && isDataLoaded && storageInitialized) {
      saveToStorage(currentUser, 'UNITS', units);
    }
  }, [units, isLoggedIn, isDataLoaded, currentUser, storageInitialized]);

  useEffect(() => {
    if (isLoggedIn && currentUser && isDataLoaded && storageInitialized) {
      saveToStorage(currentUser, 'CATEGORIES', categories);
    }
  }, [categories, isLoggedIn, isDataLoaded, currentUser, storageInitialized]);

  useEffect(() => {
    if (isLoggedIn && currentUser && isDataLoaded && storageInitialized) {
      saveToStorage(currentUser, 'STAMP_IMAGE', stampImage);
    }
  }, [stampImage, isLoggedIn, isDataLoaded, currentUser, storageInitialized]);

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
      id: Math.max(...(workItems.length > 0 ? workItems.map(i => i.id) : [0])) + index + 1,
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

  // localStorage에서 파일로 마이그레이션
  const migrateFromLocalStorage = async () => {
    if (!fileStorage) {
      console.warn('파일 저장소가 초기화되지 않았습니다.');
      return false;
    }
    
    try {
      const result = await fileStorage.migrateFromLocalStorage();
      if (result && currentUser) {
        // 마이그레이션 후 현재 사용자 데이터 새로고침
        await loadUserData(currentUser);
      }
      return result;
    } catch (error) {
      console.error('마이그레이션 실패:', error);
      return false;
    }
  };

  // 백업 생성
  const createBackup = async (username = null) => {
    if (!fileStorage) {
      console.warn('파일 저장소가 초기화되지 않았습니다.');
      return null;
    }
    
    try {
      return await fileStorage.createBackup(username || currentUser);
    } catch (error) {
      console.error('백업 생성 실패:', error);
      return null;
    }
  };

  // 저장소 정보
  const getStorageInfo = () => {
    return {
      isElectron: isElectron(),
      fileStorageAvailable: !!fileStorage,
      storageInitialized,
      dataPath: fileStorage ? fileStorage.getInfo().dataPath : null
    };
  };

  const value = {
    currentUser,
    isLoggedIn,
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
    getClientOutstanding,
    // 파일 저장소 관련 기능
    migrateFromLocalStorage,
    createBackup,
    getStorageInfo,
    storageInitialized
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
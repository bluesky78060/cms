// localStorage 유틸리티 함수들

const STORAGE_KEYS = {
  COMPANY_INFO: 'construction_company_info',
  CLIENTS: 'construction_clients',
  WORK_ITEMS: 'construction_work_items',
  INVOICES: 'construction_invoices'
};

// localStorage에서 데이터 가져오기
export const getStorageData = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(STORAGE_KEYS[key]);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`localStorage에서 ${key} 데이터를 가져오는데 실패했습니다:`, error);
    return defaultValue;
  }
};

// localStorage에 데이터 저장하기
export const setStorageData = (key, data) => {
  try {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`localStorage에 ${key} 데이터를 저장하는데 실패했습니다:`, error);
    return false;
  }
};

// localStorage에서 데이터 제거하기
export const removeStorageData = (key) => {
  try {
    localStorage.removeItem(STORAGE_KEYS[key]);
    return true;
  } catch (error) {
    console.error(`localStorage에서 ${key} 데이터를 제거하는데 실패했습니다:`, error);
    return false;
  }
};

// 모든 데이터 초기화
export const clearAllData = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error('localStorage 초기화에 실패했습니다:', error);
    return false;
  }
};

// 데이터 백업 (JSON 문자열로 반환)
export const exportAllData = () => {
  const data = {};
  Object.keys(STORAGE_KEYS).forEach(key => {
    data[key] = getStorageData(key);
  });
  return JSON.stringify(data, null, 2);
};

// 데이터 복원 (JSON 문자열에서)
export const importAllData = (jsonString) => {
  try {
    const data = JSON.parse(jsonString);
    Object.keys(data).forEach(key => {
      if (STORAGE_KEYS[key] && data[key] !== null) {
        setStorageData(key, data[key]);
      }
    });
    return true;
  } catch (error) {
    console.error('데이터 복원에 실패했습니다:', error);
    return false;
  }
};

export { STORAGE_KEYS };
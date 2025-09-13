import React, { createContext, useContext, useState, useEffect } from 'react';
import secureStorage from '../utils/secureStorage';

const UserContext = createContext();

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 로그인 상태 확인
  useEffect(() => {
    const savedUser = localStorage.getItem('CURRENT_USER');
    if (savedUser) {
      setCurrentUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  // 로그인 처리
  const login = (username) => {
    setCurrentUser(username);
    localStorage.setItem('CURRENT_USER', username);
    
    // 로그인 시 해당 사용자의 마지막 접속 시간 업데이트
    const users = JSON.parse(localStorage.getItem('SYSTEM_USERS') || '{}');
    if (users[username]) {
      users[username].lastLogin = new Date().toISOString();
      localStorage.setItem('SYSTEM_USERS', JSON.stringify(users));
    }
  };

  // 로그아웃 처리 (보안키 캐시도 함께 삭제)
  const logout = async () => {
    setCurrentUser(null);
    localStorage.removeItem('CURRENT_USER');
    
    // 보안 저장소 완전 정리
    try {
      await secureStorage.completeCleanup();
      console.log('Complete security cleanup successful');
    } catch (error) {
      console.error('Security cleanup failed:', error);
      // 폴백: 기존 방식으로 정리
      localStorage.removeItem('SECURITY_KEY_VERIFIED');
      localStorage.removeItem('VERIFIED_KEY_DATA');
    }
    
    // 완전 로그아웃 플래그 설정 (보안키 인증 화면으로 바로 이동)
    localStorage.setItem('FORCE_SECURITY_AUTH', 'true');
    
    // 페이지 새로고침하여 보안키 인증 화면으로 이동
    window.location.reload();
  };

  // 가벼운 로그아웃 (보안키 유지, 사용자만 변경)
  const lightLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('CURRENT_USER');
    // 보안키는 유지하고 페이지 새로고침하지 않음
  };

  // 보안키 캐시만 삭제 (사용자 계정 정보는 유지)
  const clearSecurityCache = () => {
    localStorage.removeItem('SECURITY_KEY_VERIFIED');
    localStorage.removeItem('VERIFIED_KEY_DATA');
    // SYSTEM_USERS는 유지하여 사용자 계정과 비밀번호 보존
  };

  // 사용자별 데이터 키 생성
  const getUserKey = (dataType) => {
    if (!currentUser) return null;
    return `USER_${currentUser}_${dataType}`;
  };

  // 사용자별 데이터 저장
  const setUserData = (dataType, data) => {
    const key = getUserKey(dataType);
    if (key) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  };

  // 사용자별 데이터 조회
  const getUserData = (dataType, defaultValue = null) => {
    const key = getUserKey(dataType);
    if (!key) return defaultValue;
    
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  };

  // 사용자 정보 조회
  const getUserInfo = () => {
    if (!currentUser) return null;
    
    const users = JSON.parse(localStorage.getItem('SYSTEM_USERS') || '{}');
    return users[currentUser] || null;
  };

  // 사용자 목록 조회
  const getAllUsers = () => {
    const users = JSON.parse(localStorage.getItem('SYSTEM_USERS') || '{}');
    return Object.keys(users).map(username => ({
      username,
      ...users[username]
    }));
  };

  // 현재 사용자 데이터 통계
  const getUserStats = () => {
    if (!currentUser) return null;

    const clients = getUserData('CLIENTS', []);
    const workItems = getUserData('WORK_ITEMS', []);
    const invoices = getUserData('INVOICES', []);
    const estimates = getUserData('ESTIMATES', []);

    return {
      clientsCount: clients.length,
      workItemsCount: workItems.length,
      invoicesCount: invoices.length,
      estimatesCount: estimates.length,
      completedWorkItems: workItems.filter(item => item.status === '완료').length,
      totalInvoiceAmount: invoices.reduce((sum, invoice) => sum + (invoice.amount || 0), 0)
    };
  };

  const value = {
    currentUser,
    isLoading,
    login,
    logout,
    lightLogout,
    clearSecurityCache,
    getUserKey,
    setUserData,
    getUserData,
    getUserInfo,
    getAllUsers,
    getUserStats,
    isLoggedIn: !!currentUser
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export default UserContext;
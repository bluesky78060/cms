import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { UserProvider, useUser } from './contexts/UserContext';
import { AppProvider } from './contexts/AppContext';
import SecurityKeyAuth from './components/SecurityKeyAuth';
import Login from './components/Login';
import secureStorage from './utils/secureStorage';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Invoices from './components/Invoices';
import Clients from './components/Clients';
import WorkItems from './components/WorkItems';
import Estimates from './components/Estimates';
import CompanyInfo from './components/CompanyInfo';
import KeyGenerator from './components/KeyGenerator';
import AdminKeygenRedirect from './components/AdminKeygenRedirect';

// 메인 앱 컴포넌트 (로그인 후 화면)
function MainApp() {
  return (
    <Router basename="/construction-management-system">
      <div className="min-h-screen bg-gray-50">
        <AdminKeygenRedirect />
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/estimates" element={<Estimates />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/work-items" element={<WorkItems />} />
            <Route path="/company-info" element={<CompanyInfo />} />
            <Route path="/keygen" element={<KeyGenerator />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// 보안 인증 및 로그인 처리 컴포넌트
function AppWithAuth() {
  const { currentUser, login, isLoading, clearSecurityCache } = useUser();
  const [isSecurityVerified, setIsSecurityVerified] = useState(false);
  const [isSecurityLoading, setIsSecurityLoading] = useState(false); // admin이 아니면 로딩하지 않음
  const [forceSecurityAuth, setForceSecurityAuth] = useState(false);
  const [showKeyGenerator, setShowKeyGenerator] = useState(false);

  // 완전 로그아웃 후 강제 보안 인증 확인
  useEffect(() => {
    const shouldForceAuth = localStorage.getItem('FORCE_SECURITY_AUTH');
    console.log('[DEBUG] Force security auth flag:', shouldForceAuth);
    if (shouldForceAuth === 'true') {
      console.log('[DEBUG] Setting forceSecurityAuth to true');
      setForceSecurityAuth(true);
      setIsSecurityVerified(false);
      localStorage.removeItem('FORCE_SECURITY_AUTH'); // 플래그 제거
    }
  }, []);

  // 보안키 검증 함수 (IndexedDB 기반)
  const validateStoredSecurityKey = useCallback(async () => {
    const securityVerified = localStorage.getItem('SECURITY_KEY_VERIFIED');
    
    if (securityVerified === 'true') {
      try {
        // IndexedDB에서 보안키 확인
        const isValid = await secureStorage.isSecurityKeyValid();
        if (!isValid) {
          handleClearSecurityCache();
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Security key validation failed:', error);
        handleClearSecurityCache();
        return false;
      }
    }
    return false;
  }, [clearSecurityCache, handleClearSecurityCache]);

  // 보안 캐시 삭제 함수 (사용자 계정 정보는 보존)
  const handleClearSecurityCache = () => {
    clearSecurityCache(); // UserContext의 함수 호출 (SYSTEM_USERS 보존)
    setIsSecurityVerified(false);
  };

  useEffect(() => {
    // forceSecurityAuth가 활성화된 상태에서는 보안 인증 상태를 변경하지 않음
    if (forceSecurityAuth) {
      console.log('[DEBUG] Skipping security check due to forceSecurityAuth');
      return;
    }
    
    // admin 사용자인 경우에만 보안 키 인증 상태 확인
    if (currentUser === 'admin') {
      setIsSecurityLoading(true);
      const checkStoredSecurityKey = async () => {
        const isValid = await validateStoredSecurityKey();
        setIsSecurityVerified(isValid);
        setIsSecurityLoading(false);
      };
      
      checkStoredSecurityKey();
    } else if (currentUser) {
      // admin이 아닌 사용자는 보안 인증을 건너뛰고 항상 인증됨으로 설정
      console.log('[DEBUG] Setting non-admin user as verified');
      setIsSecurityVerified(true);
      setIsSecurityLoading(false);
    } else {
      // 로그인하지 않은 상태에서는 보안 인증 상태를 false로 유지
      console.log('[DEBUG] No user logged in, keeping security state as false');
      setIsSecurityVerified(false);
      setIsSecurityLoading(false);
    }

    // admin 사용자인 경우에만 브라우저 이벤트 리스너 등록
    if (currentUser === 'admin') {
      const handleWindowFocus = async () => {
        console.log('[Security] Window focus - validating key...');
        const isValid = await validateStoredSecurityKey();
        if (!isValid && isSecurityVerified) {
          console.log('[Security] Key validation failed - redirecting to auth');
          window.location.reload();
        }
      };

      const handleVisibilityChange = async () => {
        if (!document.hidden) {
          console.log('[Security] Tab visible - validating key...');
          const isValid = await validateStoredSecurityKey();
          if (!isValid && isSecurityVerified) {
            console.log('[Security] Key validation failed - redirecting to auth');
            window.location.reload();
          }
        }
      };

      const handleStorageChange = (e) => {
        if (e.key === 'SECURITY_KEY_VERIFIED' && !e.newValue) {
          console.log('[Security] Security key cleared in another tab - logging out');
          handleClearSecurityCache();
          window.location.reload();
        }
      };

      const handleBeforeUnload = () => {
        // 브라우저 종료 시 필요한 경우 보안키 삭제 (옵션)
        // handleClearSecurityCache();
      };

      // 이벤트 리스너 등록
      window.addEventListener('focus', handleWindowFocus);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('beforeunload', handleBeforeUnload);

      // 클린업 함수
      return () => {
        window.removeEventListener('focus', handleWindowFocus);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [isSecurityVerified, currentUser, validateStoredSecurityKey, forceSecurityAuth, handleClearSecurityCache]);

  const handleSecurityAuthenticated = () => {
    setIsSecurityVerified(true);
  };

  const handleLogin = (username) => {
    login(username);
  };

  // 로딩 중일 때
  if (isSecurityLoading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  }

  // 디버깅 정보
  console.log('[DEBUG] App state:', {
    currentUser,
    forceSecurityAuth,
    isSecurityVerified,
    isSecurityLoading,
    isLoading
  });

  // 키 생성기 화면 표시
  if (showKeyGenerator) {
    console.log('[DEBUG] Rendering KeyGenerator');
    return <KeyGenerator />;
  }

  // 보안 인증이 강제 요청된 경우 - 보안키 업로드 화면 표시
  if (forceSecurityAuth && !isSecurityVerified) {
    console.log('[DEBUG] Rendering SecurityKeyAuth due to forceSecurityAuth');
    return <SecurityKeyAuth onAuthenticated={() => {
      setIsSecurityVerified(true);
      setForceSecurityAuth(false);
      handleLogin('admin');
    }} />;
  }

  // 로그인하지 않은 경우 로그인 화면 표시
  if (!currentUser) {
    console.log('[DEBUG] Rendering Login screen - no current user');
    return <Login onLogin={handleLogin} onRequestSecurityAuth={() => {
      setShowKeyGenerator(true);
    }} />;
  }

  // admin 사용자이고 보안 키 인증이 안된 경우
  if (currentUser === 'admin' && !isSecurityVerified) {
    return <SecurityKeyAuth onAuthenticated={handleSecurityAuthenticated} />;
  }

  // 로그인한 경우 메인 앱 표시
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

function App() {
  return (
    <UserProvider>
      <AppWithAuth />
    </UserProvider>
  );
}

export default App;
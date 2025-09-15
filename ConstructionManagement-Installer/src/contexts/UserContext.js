import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const defaultUsers = [
      { id: 1, username: 'admin', password: 'admin123', name: '관리자', role: 'admin' },
      { id: 2, username: 'manager', password: 'manager123', name: '매니저', role: 'manager' },
      { id: 3, username: 'user', password: 'user123', name: '사용자', role: 'user' }
    ];
    const users = localStorage.getItem('CMS_USERS');
    if (!users) {
      localStorage.setItem('CMS_USERS', JSON.stringify(defaultUsers));
    }

    const savedUser = sessionStorage.getItem('CURRENT_USER');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    } else {
      // 과거 잔존 세션 제거
      localStorage.removeItem('CURRENT_USER');
    }
  }, []);

  const login = (username, password) => {
    const users = JSON.parse(localStorage.getItem('CMS_USERS') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      setCurrentUser(user);
      setIsLoggedIn(true);
      sessionStorage.setItem('CURRENT_USER', JSON.stringify(user));
      return { success: true, user };
    } else {
      return { success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    try { sessionStorage.removeItem('CURRENT_USER'); } catch (e) {}
    try { localStorage.removeItem('CURRENT_USER'); } catch (e) {}
    // 다른 탭에도 로그아웃 브로드캐스트
    try {
      localStorage.setItem('CMS_LOGOUT', String(Date.now()));
      localStorage.removeItem('CMS_LOGOUT');
    } catch (e) {}
  };

  const getUserStorageKey = (username, key) => {
    return `USER_${username}_${key}`;
  };

  const getAllUsers = () => {
    return JSON.parse(localStorage.getItem('CMS_USERS') || '[]');
  };

  const addUser = (userData) => {
    const users = getAllUsers();
    const newUser = {
      ...userData,
      id: Math.max(0, ...users.map(u => u.id)) + 1
    };
    
    if (users.find(u => u.username === userData.username)) {
      return { success: false, error: '이미 존재하는 아이디입니다.' };
    }

    users.push(newUser);
    localStorage.setItem('CMS_USERS', JSON.stringify(users));
    return { success: true, user: newUser };
  };

  const updateUser = (userId, userData) => {
    const users = getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }

    const existingUser = users.find(u => u.username === userData.username && u.id !== userId);
    if (existingUser) {
      return { success: false, error: '이미 존재하는 아이디입니다.' };
    }

    users[userIndex] = { ...users[userIndex], ...userData };
    localStorage.setItem('CMS_USERS', JSON.stringify(users));
    
    if (currentUser && currentUser.id === userId) {
      const updatedUser = users[userIndex];
      setCurrentUser(updatedUser);
      localStorage.setItem('CURRENT_USER', JSON.stringify(updatedUser));
    }

    return { success: true, user: users[userIndex] };
  };

  const deleteUser = (userId) => {
    const users = getAllUsers();
    const filteredUsers = users.filter(u => u.id !== userId);
    
    if (users.length === filteredUsers.length) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }

    localStorage.setItem('CMS_USERS', JSON.stringify(filteredUsers));
    
    if (currentUser && currentUser.id === userId) {
      logout();
    }

    return { success: true };
  };

  const isAdmin = () => {
    return currentUser && currentUser.role === 'admin';
  };

  const value = {
    currentUser,
    isLoggedIn,
    login,
    logout,
    getUserStorageKey,
    getAllUsers,
    addUser,
    updateUser,
    deleteUser,
    isAdmin
  };

  // 15분 무활동 자동 로그아웃
  useEffect(() => {
    if (!isLoggedIn) return;
    let timerId;
    const TIMEOUT = 15 * 60 * 1000;
    const reset = () => {
      clearTimeout(timerId);
      timerId = setTimeout(() => {
        logout();
      }, TIMEOUT);
    };
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(ev => window.addEventListener(ev, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timerId);
      events.forEach(ev => window.removeEventListener(ev, reset));
    };
  }, [isLoggedIn]);

  // 창/탭 닫기 및 숨김 시 세션 제거
  useEffect(() => {
    const clearSession = () => {
      try { sessionStorage.removeItem('CURRENT_USER'); } catch (e) {}
      try { localStorage.removeItem('CURRENT_USER'); } catch (e) {}
      // 모든 탭에 로그아웃 브로드캐스트(닫힌 탭이더라도 남은 탭을 로그아웃)
      try {
        localStorage.setItem('CMS_LOGOUT', String(Date.now()));
        localStorage.removeItem('CMS_LOGOUT');
      } catch (e) {}
    };
    window.addEventListener('beforeunload', clearSession);
    window.addEventListener('pagehide', clearSession);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') clearSession();
    });
    return () => {
      window.removeEventListener('beforeunload', clearSession);
      window.removeEventListener('pagehide', clearSession);
      document.removeEventListener('visibilitychange', () => {});
    };
  }, []);

  // 다른 탭에서의 로그아웃 신호를 수신하여 즉시 로그아웃
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'CMS_LOGOUT') {
        setCurrentUser(null);
        setIsLoggedIn(false);
        try { sessionStorage.removeItem('CURRENT_USER'); } catch (err) {}
        try { localStorage.removeItem('CURRENT_USER'); } catch (err) {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// 자동 로그아웃: 브라우저 창/탭을 닫거나 새로고침 시 세션 제거
// (로컬스토리지의 CURRENT_USER 키를 제거하여 다음 방문 시 로그인 화면으로 유도)
// 전역 리스너는 컴포넌트 내부로 이동

export default UserProvider;

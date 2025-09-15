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

    const savedUser = localStorage.getItem('CURRENT_USER');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
  }, []);

  const login = (username, password) => {
    const users = JSON.parse(localStorage.getItem('CMS_USERS') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      setCurrentUser(user);
      setIsLoggedIn(true);
      localStorage.setItem('CURRENT_USER', JSON.stringify(user));
      return { success: true, user };
    } else {
      return { success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('CURRENT_USER');
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

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;

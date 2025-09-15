import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { 
  HomeIcon, 
  DocumentTextIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  CalculatorIcon,
  BuildingOffice2Icon,
  UserIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

function Navbar() {
  const location = useLocation();
  const { currentUser, isAdmin, logout } = useUser();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {isAdmin() ? (
              <div className="text-xl font-bold flex items-center space-x-2 cursor-default select-none">
                <BuildingOffice2Icon className="h-8 w-8" />
                <span>건축 견적/청구 시스템</span>
              </div>
            ) : (
              <Link to="/" className="text-xl font-bold flex items-center space-x-2">
                <BuildingOffice2Icon className="h-8 w-8" />
                <span>건축 견적/청구 시스템</span>
              </Link>
            )}
          </div>
          
          <div className="hidden md:block">
            {isAdmin() ? (
              <div className="ml-10" />
            ) : (
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md text-base font-medium flex items-center space-x-1 ${
                    isActive('/') 
                      ? 'bg-blue-700 text-white' 
                      : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                  }`}
                >
                  <HomeIcon className="h-5 w-5" />
                  <span>대시보드</span>
                </Link>
                <Link
                  to="/estimates"
                  className={`px-3 py-2 rounded-md text-base font-medium flex items-center space-x-1 ${
                    isActive('/estimates') 
                      ? 'bg-blue-700 text-white' 
                      : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                  }`}
                >
                  <CalculatorIcon className="h-5 w-5" />
                  <span>견적서 관리</span>
                </Link>
                <Link
                  to="/invoices"
                  className={`px-3 py-2 rounded-md text-base font-medium flex items-center space-x-1 ${
                    isActive('/invoices') 
                      ? 'bg-blue-700 text-white' 
                      : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                  }`}
                >
                  <DocumentTextIcon className="h-5 w-5" />
                  <span>청구서 관리</span>
                </Link>
                <Link
                  to="/clients"
                  className={`px-3 py-2 rounded-md text-base font-medium flex items-center space-x-1 ${
                    isActive('/clients') 
                      ? 'bg-blue-700 text-white' 
                      : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                  }`}
                >
                  <UsersIcon className="h-5 w-5" />
                  <span>건축주 관리</span>
                </Link>
                <Link
                  to="/work-items"
                  className={`px-3 py-2 rounded-md text-base font-medium flex items-center space-x-1 ${
                    isActive('/work-items') 
                      ? 'bg-blue-700 text-white' 
                      : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                  }`}
                >
                  <WrenchScrewdriverIcon className="h-5 w-5" />
                  <span>작업 항목 관리</span>
                </Link>
              </div>
            )}
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-blue-100 hover:bg-blue-500 hover:text-white"
            >
              {isAdmin() ? (
                <>
                  <ShieldCheckIcon className="h-5 w-5" aria-label="관리자" />
                  <span>관리자</span>
                </>
              ) : (
                <>
                  <UserIcon className="h-5 w-5" aria-label="사용자" />
                  <span>{currentUser?.name || currentUser?.username}</span>
                </>
              )}
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                <div className="py-2">
                  <div className="px-4 pb-2 text-sm text-gray-700 border-b border-gray-100">
                    <p className="font-medium">{currentUser?.name}</p>
                    <p className="text-gray-500">{currentUser?.username}</p>
                    <p className="text-xs text-gray-400 mt-1">역할: {currentUser?.role === 'admin' ? '관리자' : currentUser?.role === 'manager' ? '매니저' : '사용자'}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                  >
                    로그아웃
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

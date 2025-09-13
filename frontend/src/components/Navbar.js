import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { 
  HomeIcon, 
  DocumentTextIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  CogIcon,
  CalculatorIcon,
  BuildingOffice2Icon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

function Navbar() {
  const location = useLocation();
  const { currentUser, logout, lightLogout } = useUser();
  const [showLogoutDropdown, setShowLogoutDropdown] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold flex items-center space-x-2">
              <BuildingOffice2Icon className="h-8 w-8" />
              <span>건축 견적/청구 시스템</span>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-16 flex items-baseline space-x-3">
              <Link
                to="/"
                className={`px-2 py-2 rounded-md text-base font-medium flex items-center space-x-1 ${
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
                className={`px-2 py-2 rounded-md text-base font-medium flex items-center space-x-1 ${
                  isActive('/estimates') 
                    ? 'bg-blue-700 text-white' 
                    : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                }`}
              >
                <CalculatorIcon className="h-5 w-5" />
                <span>견적서</span>
              </Link>
              <Link
                to="/invoices"
                className={`px-2 py-2 rounded-md text-base font-medium flex items-center space-x-1 ${
                  isActive('/invoices') 
                    ? 'bg-blue-700 text-white' 
                    : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                }`}
              >
                <DocumentTextIcon className="h-5 w-5" />
                <span>청구서</span>
              </Link>
              <Link
                to="/clients"
                className={`px-2 py-2 rounded-md text-base font-medium flex items-center space-x-1 ${
                  isActive('/clients') 
                    ? 'bg-blue-700 text-white' 
                    : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                }`}
              >
                <UsersIcon className="h-5 w-5" />
                <span>건축주</span>
              </Link>
              <Link
                to="/work-items"
                className={`px-2 py-2 rounded-md text-base font-medium flex items-center space-x-1 ${
                  isActive('/work-items') 
                    ? 'bg-blue-700 text-white' 
                    : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                }`}
              >
                <WrenchScrewdriverIcon className="h-5 w-5" />
                <span>작업 항목</span>
              </Link>
              <Link
                to="/company-info"
                className={`px-2 py-2 rounded-md text-base font-medium flex items-center space-x-1 ${
                  isActive('/company-info') 
                    ? 'bg-blue-700 text-white' 
                    : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                }`}
              >
                <CogIcon className="h-5 w-5" />
                <span>환경설정</span>
              </Link>
            </div>
          </div>

          {/* 사용자 정보 및 로그아웃 */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-blue-100">
              <UserIcon className="h-4 w-4" />
              <span className="text-sm">{currentUser}</span>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowLogoutDropdown(!showLogoutDropdown)}
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-blue-100 hover:bg-blue-500 hover:text-white transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                <span>로그아웃</span>
                <ChevronDownIcon className="h-3 w-3" />
              </button>
              
              {showLogoutDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowLogoutDropdown(false);
                        if (window.confirm('보안키를 유지하고 로그아웃하시겠습니까?\n다음 로그인 시 보안키 재인증이 필요하지 않습니다.')) {
                          lightLogout();
                        }
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <span>🔒</span>
                      <div>
                        <div className="font-medium">가벼운 로그아웃</div>
                        <div className="text-xs text-gray-500">보안키 유지</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setShowLogoutDropdown(false);
                        if (window.confirm('완전히 로그아웃하시겠습니까?\n보안키를 재설정해야 시스템을 다시 사용할 수 있습니다.')) {
                          logout();
                        }
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <span>🚪</span>
                      <div>
                        <div className="font-medium">완전 로그아웃</div>
                        <div className="text-xs text-gray-500">보안키 삭제</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
              
              {/* Overlay to close dropdown when clicking outside */}
              {showLogoutDropdown && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowLogoutDropdown(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
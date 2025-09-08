import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold">
              건축 청구서 시스템
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/') 
                    ? 'bg-blue-700 text-white' 
                    : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                }`}
              >
                대시보드
              </Link>
              <Link
                to="/invoices"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/invoices') 
                    ? 'bg-blue-700 text-white' 
                    : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                }`}
              >
                청구서 관리
              </Link>
              <Link
                to="/clients"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/clients') 
                    ? 'bg-blue-700 text-white' 
                    : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                }`}
              >
                건축주 관리
              </Link>
              <Link
                to="/work-items"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/work-items') 
                    ? 'bg-blue-700 text-white' 
                    : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                }`}
              >
                작업 항목 관리
              </Link>
              <Link
                to="/company-info"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/company-info') 
                    ? 'bg-blue-700 text-white' 
                    : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                }`}
              >
                업체 정보
              </Link>
              <Link
                to="/data-storage"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/data-storage') 
                    ? 'bg-blue-700 text-white' 
                    : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                }`}
              >
                💾 데이터 관리
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
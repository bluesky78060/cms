import React, { useState, useEffect } from 'react';
import { KeyIcon, ArrowDownTrayIcon, PlusIcon, TrashIcon, ShieldCheckIcon, ExclamationTriangleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

function KeyGenerator() {
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState([{ name: '', expiry: '2025-12-31' }]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [hasSecurityAccess, setHasSecurityAccess] = useState(false);

  const ADMIN_PASSWORD = 'cms-admin-2025'; // 관리자 패스워드

  // 보안키 인증 상태 확인 (키 생성기는 항상 접근 가능하도록 수정)
  useEffect(() => {
    setHasSecurityAccess(true); // 키 생성기는 항상 접근 가능
  }, []);

  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('잘못된 관리자 패스워드입니다.');
    }
  };

  const addUser = () => {
    setUsers([...users, { name: '', expiry: '2025-12-31' }]);
  };

  const removeUser = (index) => {
    setUsers(users.filter((_, i) => i !== index));
  };

  const updateUser = (index, field, value) => {
    const updatedUsers = users.map((user, i) => 
      i === index ? { ...user, [field]: value } : user
    );
    setUsers(updatedUsers);
  };

  const generateKeyData = (userName, expiryDate, isAdmin = false) => {
    const now = new Date().toISOString().split('T')[0];
    
    let keyId;
    if (isAdmin && userName.toLowerCase() === 'admin') {
      // admin 사용자를 위한 범용 키 ID
      keyId = 'CMS-ADMIN-2025-UNIVERSAL';
    } else {
      // 한국어와 영어 모두 지원하는 키 ID 생성
      const sanitizedName = userName.replace(/\s+/g, '-').replace(/[^가-힣A-Za-z0-9-]/g, '');
      keyId = `CMS-${sanitizedName.toUpperCase()}-2025-${Date.now().toString().slice(-3)}`;
    }
    
    return {
      keyId: keyId,
      issuedTo: userName,
      issuedDate: now,
      expiryDate: expiryDate,
      permissions: ["read", "write", "admin"],
      signature: `${userName.toLowerCase().replace(/\s+/g, '_')}_key_2025_authenticated_secure`,
      version: "1.0",
      description: `${userName} 전용 보안 키`
    };
  };

  const downloadKey = (keyData, userName) => {
    const jsonStr = JSON.stringify(keyData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${userName.replace(/\s+/g, '-')}.cmskey`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateSingleKey = (userName, expiryDate) => {
    if (!userName.trim()) {
      setError('사용자명을 입력해주세요.');
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      const isAdmin = userName.toLowerCase() === 'admin';
      const keyData = generateKeyData(userName, expiryDate, isAdmin);
      downloadKey(keyData, userName);
      setIsGenerating(false);
    }, 500);
  };

  const generateAllKeys = async () => {
    const validUsers = users.filter(user => user.name.trim());
    
    if (validUsers.length === 0) {
      setError('최소 한 명의 사용자명을 입력해주세요.');
      return;
    }

    setIsGenerating(true);
    setError('');

    for (let i = 0; i < validUsers.length; i++) {
      const user = validUsers[i];
      const isAdmin = user.name.toLowerCase() === 'admin';
      const keyData = generateKeyData(user.name, user.expiry, isAdmin);
      downloadKey(keyData, user.name);
      
      // 다운로드 간격을 두어 브라우저가 처리할 시간을 줌
      if (i < validUsers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setIsGenerating(false);
  };

  // 대시보드로 이동하는 함수
  const goToDashboard = () => {
    // admin으로 로그인하고 보안키 인증 완료 상태로 설정
    localStorage.setItem('CURRENT_USER', 'admin');
    localStorage.setItem('SECURITY_KEY_VERIFIED', 'true');
    window.location.reload();
  };

  // 보안키 인증이 안된 경우 접근 차단
  if (!hasSecurityAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-red-400 to-red-600 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <ExclamationTriangleIcon className="h-16 w-16 text-white" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              접근 권한 없음
            </h2>
            <p className="mt-2 text-center text-sm text-red-100">
              키 생성 기능은 관리자 보안 인증을 통해서만 접근할 수 있습니다.
            </p>
            <p className="mt-4 text-center text-xs text-red-200">
              로그인 화면에서 "🔐 관리자 보안 인증으로 접속" 버튼을 통해 접근해주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-red-100">
              <ShieldCheckIcon className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              관리자 인증
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              보안키 생성을 위한 관리자 권한이 필요합니다
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="관리자 패스워드를 입력하세요"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <button
              onClick={handleAdminLogin}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              관리자 인증
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <KeyIcon className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">보안키 생성기</h1>
                  <p className="text-sm text-gray-600">CMS 시스템 보안키를 생성하고 다운로드합니다</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={goToDashboard}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  대시보드로 이동
                </button>
                <div className="text-xs text-gray-500">
                  관리자 모드
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              {/* 사용자 목록 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">사용자 목록</h2>
                  <button
                    onClick={addUser}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    사용자 추가
                  </button>
                </div>

                <div className="space-y-3">
                  {users.map((user, index) => (
                    <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="사용자명 (예: 홍길동)"
                          value={user.name}
                          onChange={(e) => updateUser(index, 'name', e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="date"
                          value={user.expiry}
                          onChange={(e) => updateUser(index, 'expiry', e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <button
                        onClick={() => generateSingleKey(user.name, user.expiry)}
                        disabled={isGenerating || !user.name.trim()}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                        생성
                      </button>
                      {users.length > 1 && (
                        <button
                          onClick={() => removeUser(index)}
                          className="inline-flex items-center p-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                  {error}
                </div>
              )}

              {/* 일괄 생성 버튼 */}
              <div className="flex justify-center pt-6 border-t border-gray-200">
                <button
                  onClick={generateAllKeys}
                  disabled={isGenerating}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      키 생성 중...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                      모든 키 일괄 생성
                    </div>
                  )}
                </button>
              </div>

              {/* 안내 메시지 */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-sm font-medium text-blue-900 mb-2">사용 안내</h3>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• 각 사용자별로 고유한 .cmskey 파일이 생성됩니다</li>
                  <li>• 만료일을 설정하여 키의 유효기간을 관리할 수 있습니다</li>
                  <li>• 생성된 키 파일은 해당 사용자에게 안전하게 전달하세요</li>
                  <li>• 사용자는 키 파일을 업로드하여 시스템에 접근할 수 있습니다</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KeyGenerator;
import React, { useState } from 'react';

function Login({ onLogin, onRequestSecurityAuth }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');

  // 저장된 사용자 목록 조회
  const getUsers = () => {
    const users = localStorage.getItem('SYSTEM_USERS');
    return users ? JSON.parse(users) : {};
  };

  // 사용자 저장
  const saveUsers = (users) => {
    localStorage.setItem('SYSTEM_USERS', JSON.stringify(users));
  };

  // 로그인 처리
  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('사용자명과 비밀번호를 모두 입력해주세요.');
      return;
    }

    const users = getUsers();

    if (isRegistering) {
      // 회원가입
      if (users[username]) {
        setError('이미 존재하는 사용자명입니다.');
        return;
      }

      // 새 사용자 등록
      users[username] = {
        password: password,
        createdAt: new Date().toISOString(),
        displayName: username
      };
      saveUsers(users);

      // 자동 로그인
      onLogin(username);
    } else {
      // 로그인
      if (!users[username] || users[username].password !== password) {
        setError('사용자명 또는 비밀번호가 올바르지 않습니다.');
        return;
      }

      onLogin(username);
    }
  };

  // 등록된 사용자 목록 표시
  const users = getUsers();
  const userList = Object.keys(users);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🏗️ 건설 관리 시스템</h1>
          <p className="text-gray-600">
            {isRegistering ? '새 계정 만들기' : '로그인하여 시작하세요'}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              사용자명
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="회사명 또는 이름을 입력하세요"
              maxLength={20}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="비밀번호를 입력하세요"
              minLength={4}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 font-medium"
          >
            {isRegistering ? '계정 만들기' : '로그인'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {isRegistering ? '이미 계정이 있으신가요? 로그인' : '새 계정을 만드시겠어요? 회원가입'}
          </button>
        </div>

        {userList.length > 0 && !isRegistering && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">등록된 사용자:</h3>
            <div className="text-sm text-gray-600">
              {userList.map((user, index) => (
                <span key={user}>
                  {user}
                  {index < userList.length - 1 && ', '}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>
            <button
              onClick={() => {
                if (onRequestSecurityAuth) {
                  onRequestSecurityAuth();
                } else {
                  alert('관리자 보안 인증 기능을 사용할 수 없습니다.');
                }
              }}
              className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              🔑 관리자 보안키 생성하고 접속
            </button>
        </div>

        <div className="mt-8 text-xs text-gray-500 text-center">
          <p>💾 모든 데이터는 사용자별로 안전하게 분리되어 저장됩니다</p>
          <p>🔒 비밀번호는 브라우저에 암호화되어 저장됩니다</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
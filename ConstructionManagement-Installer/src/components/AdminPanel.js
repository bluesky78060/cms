import React from 'react';
import { useUser } from '../contexts/UserContext';
import { Navigate } from 'react-router-dom';
import UserManagement from './UserManagement';
import { 
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  ServerStackIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const AdminPanel = () => {
  const { isAdmin, getAllUsers } = useUser();

  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  const users = getAllUsers();
  const userStats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    managers: users.filter(u => u.role === 'manager').length,
    users: users.filter(u => u.role === 'user').length
  };

  const StatCard = ({ title, value, icon: Icon, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500'
    };

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className={`${colorClasses[color]} rounded-md p-3`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">관리자 패널</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4" />
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="전체 사용자"
          value={userStats.total}
          icon={UserGroupIcon}
          color="blue"
        />
        <StatCard
          title="관리자"
          value={userStats.admins}
          icon={ShieldCheckIcon}
          color="red"
        />
        <StatCard
          title="일반 사용자"
          value={userStats.users}
          icon={UserGroupIcon}
          color="green"
        />
      </div>

      {/* 관리 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 시스템 정보 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <ServerStackIcon className="h-6 w-6 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">시스템 정보</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">버전</span>
              <span className="font-medium">v1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">데이터 저장</span>
              <span className="font-medium">LocalStorage</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">백업 시간</span>
              <span className="font-medium">실시간</span>
            </div>
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <ChartBarIcon className="h-6 w-6 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">최근 활동</h3>
          </div>
          <div className="space-y-3">
            <div className="text-sm">
              <p className="text-gray-600">오늘 로그인</p>
              <p className="font-medium">{userStats.total}명</p>
            </div>
            <div className="text-sm">
              <p className="text-gray-600">활성 세션</p>
              <p className="font-medium">1개</p>
            </div>
            <div className="text-sm">
              <p className="text-gray-600">시스템 상태</p>
              <p className="font-medium text-green-600">정상</p>
            </div>
          </div>
        </div>

        {/* 빠른 작업 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CogIcon className="h-6 w-6 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">빠른 작업</h3>
          </div>
          <div className="space-y-3">
            <button className="w-full text-left p-2 rounded-md hover:bg-gray-50 text-sm">
              📊 시스템 보고서 생성
            </button>
            <button className="w-full text-left p-2 rounded-md hover:bg-gray-50 text-sm">
              🔄 데이터 백업
            </button>
            <button className="w-full text-left p-2 rounded-md hover:bg-gray-50 text-sm">
              🧹 시스템 정리
            </button>
          </div>
        </div>
      </div>

      {/* 사용자 섹션 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">사용자</h2>
        </div>
        <div className="p-0">
          <UserManagement />
        </div>
      </div>

      {/* 보안 알림 */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ShieldCheckIcon className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              보안 권장사항
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>정기적으로 사용자 계정을 검토하세요</li>
                <li>사용하지 않는 계정은 비활성화하세요</li>
                <li>강력한 비밀번호 정책을 적용하세요</li>
                <li>시스템 로그를 정기적으로 확인하세요</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 관리자 패널에서는 로그아웃 UI를 표시하지 않습니다. */}
    </div>
  );
};

export default AdminPanel;

import React from 'react';
import { 
  UsersIcon, 
  BuildingOfficeIcon, 
  DocumentTextIcon, 
  CurrencyDollarIcon 
} from '@heroicons/react/24/outline';

const stats = [
  { name: '활성 거래처', value: '12', icon: UsersIcon, change: '+2', changeType: 'positive' },
  { name: '진행 중인 현장', value: '8', icon: BuildingOfficeIcon, change: '+1', changeType: 'positive' },
  { name: '이번 달 작업일지', value: '156', icon: DocumentTextIcon, change: '+23', changeType: 'positive' },
  { name: '이번 달 청구액', value: '₩245,000,000', icon: CurrencyDollarIcon, change: '+12.5%', changeType: 'positive' },
];

export default function Dashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="mt-2 text-sm text-gray-600">
          현장 작업 현황과 청구 관리 상태를 한눈에 확인하세요.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                    <div className={`
                      ml-2 flex items-baseline text-sm font-semibold
                      ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}
                    `}>
                      {stat.change}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">최근 작업일지</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">아파트 신축공사 A동</p>
                  <p className="text-sm text-gray-500">2024-03-15 | 15층 타일공사</p>
                </div>
                <span className="text-sm text-gray-400">2시간 전</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">청구 현황</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">현대건설 1차 기성</p>
                  <p className="text-sm text-gray-500">₩45,000,000 (VAT 포함)</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  발송완료
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
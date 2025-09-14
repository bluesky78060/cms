import React, { useMemo } from 'react';
import { 
  UsersIcon, 
  BuildingOfficeIcon, 
  DocumentTextIcon, 
  CurrencyDollarIcon 
} from '@heroicons/react/24/outline';

import { useApp } from '../contexts/AppContext';

const formatCurrency = (n: number) => `₩${(n || 0).toLocaleString()}`;

export default function Dashboard() {
  const { invoices } = useApp() as any;
  const recentInvoices = useMemo(() => {
    const list = (invoices || []).slice().sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''));
    return list.slice(0, 5);
  }, [invoices]);

  const summary = useMemo(() => {
    const total = (invoices || []).reduce((s: number, i: any) => s + (i.amount || 0), 0);
    const paid = (invoices || []).filter((i: any) => i.status === '결제완료').reduce((s: number, i: any) => s + (i.amount || 0), 0);
    const pending = total - paid;
    return { total, paid, pending };
  }, [invoices]);

  const stats = [
    { name: '전체 청구액', value: formatCurrency(summary.total), icon: CurrencyDollarIcon, change: '', changeType: 'positive' },
    { name: '결제완료', value: formatCurrency(summary.paid), icon: DocumentTextIcon, change: '', changeType: 'positive' },
    { name: '미수금(요약)', value: formatCurrency(summary.pending), icon: DocumentTextIcon, change: '', changeType: 'positive' },
  ];
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">최근 청구서</h3>
          <div className="space-y-3">
            {recentInvoices.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{inv.id} · {inv.client}</p>
                  <p className="text-sm text-gray-500">{inv.project} · {formatCurrency(inv.amount)}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${inv.status === '결제완료' ? 'bg-green-100 text-green-800' : inv.status === '발송됨' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {inv.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

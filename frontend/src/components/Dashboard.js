import React from 'react';
import { useApp } from '../contexts/AppContext';
import MigrationPanel from './MigrationPanel';

function Dashboard() {
  const { invoices, clients, workItems } = useApp();

  // 현재 날짜
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // 이번 달 청구서 수
  const thisMonthInvoices = invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.date);
    return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
  }).length;

  // 미수금 (미결제 + 발송됨 상태의 청구서 총합)
  const unpaidAmount = invoices
    .filter(invoice => invoice.status === '미결제' || invoice.status === '발송됨')
    .reduce((sum, invoice) => sum + (invoice.amount || 0), 0);

  // 완료된 작업 수
  const completedWorkItems = workItems.filter(item => item.status === '완료').length;

  // 등록된 건축주 수
  const totalClients = clients.length;

  const stats = [
    {
      title: '이번 달 청구서',
      value: thisMonthInvoices.toString(),
      color: 'bg-blue-500',
      icon: '📄'
    },
    {
      title: '미수금',
      value: `${unpaidAmount.toLocaleString()}원`,
      color: 'bg-orange-500',
      icon: '💰'
    },
    {
      title: '완료된 작업',
      value: completedWorkItems.toString(),
      color: 'bg-green-500',
      icon: '✅'
    },
    {
      title: '등록된 건축주',
      value: totalClients.toString(),
      color: 'bg-purple-500',
      icon: '👥'
    }
  ];

  // 최근 청구서 (날짜 순 정렬, 최대 5개)
  const recentInvoices = invoices
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
    .map(invoice => ({
      id: invoice.id,
      client: invoice.client,
      project: invoice.project,
      amount: invoice.amount,
      status: invoice.status,
      date: invoice.date
    }));

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">대시보드</h1>
        <p className="text-gray-600">청구서 발행 현황을 한눈에 확인하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} rounded-full p-3 text-white text-2xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 최근 청구서 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">최근 청구서</h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-medium text-gray-600">건축주</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-600">프로젝트</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-600">금액</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-600">상태</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-600">날짜</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.length > 0 ? (
                  recentInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 text-base text-gray-900">{invoice.client}</td>
                      <td className="py-3 text-base text-gray-900">{invoice.project}</td>
                      <td className="py-3 text-base font-medium text-gray-900">
                        {invoice.amount ? invoice.amount.toLocaleString() : '0'}원
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 text-sm font-semibold rounded-full ${
                          invoice.status === '결제완료' ? 'bg-green-100 text-green-800' :
                          invoice.status === '발송됨' ? 'bg-blue-100 text-blue-800' :
                          invoice.status === '미결제' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-3 text-base text-gray-600">{invoice.date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-gray-500">
                      아직 생성된 청구서가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 마이그레이션 패널 */}
        <MigrationPanel />
      </div>
    </div>
  );
}

export default Dashboard;
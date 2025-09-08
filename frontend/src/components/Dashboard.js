import React from 'react';

function Dashboard() {
  const stats = [
    {
      title: '이번 달 청구서',
      value: '8',
      color: 'bg-blue-500',
      icon: '📄'
    },
    {
      title: '미수금',
      value: '15,000,000원',
      color: 'bg-orange-500',
      icon: '💰'
    },
    {
      title: '완료된 작업',
      value: '23',
      color: 'bg-green-500',
      icon: '✅'
    },
    {
      title: '등록된 건축주',
      value: '12',
      color: 'bg-purple-500',
      icon: '👥'
    }
  ];

  const recentInvoices = [
    { id: 1, client: '김철수', project: '단독주택 신축', amount: 8500000, status: '발송됨', date: '2024-09-01' },
    { id: 2, client: '박영희', project: '아파트 리모델링', amount: 3200000, status: '결제완료', date: '2024-08-28' },
    { id: 3, client: '이민호', project: '상가 내부공사', amount: 5800000, status: '미결제', date: '2024-08-25' },
    { id: 4, client: '정수진', project: '화장실 리모델링', amount: 1500000, status: '발송대기', date: '2024-08-22' }
  ];

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
                {recentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 text-sm text-gray-900">{invoice.client}</td>
                    <td className="py-3 text-sm text-gray-900">{invoice.project}</td>
                    <td className="py-3 text-sm font-medium text-gray-900">
                      {invoice.amount.toLocaleString()}원
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        invoice.status === '결제완료' ? 'bg-green-100 text-green-800' :
                        invoice.status === '발송됨' ? 'bg-blue-100 text-blue-800' :
                        invoice.status === '미결제' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-600">{invoice.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
import React, { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

function Dashboard() {
  const {
    invoices, clients,
    companyInfo, workItems, estimates, units, categories, stampImage,
    setCompanyInfo, setClients, setWorkItems, setInvoices, setEstimates, setUnits, setCategories, setStampImage
  } = useApp();
  const restoreInputRef = useRef(null);
  const formatCurrency = (n) => `₩${(n || 0).toLocaleString()}`;

  const recentInvoices = useMemo(() => {
    const list = (invoices || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return list.slice(0, 5);
  }, [invoices]);

  const total = useMemo(() => (invoices || []).reduce((s, i) => s + (i.amount || 0), 0), [invoices]);
  const paid = useMemo(() => (invoices || []).filter(i => i.status === '결제완료').reduce((s, i) => s + (i.amount || 0), 0), [invoices]);
  const pending = total - paid;

  const stats = [
    { title: '전체 청구액', value: formatCurrency(total), color: 'bg-blue-500', icon: '📄' },
    { title: '미수금(요약)', value: formatCurrency(pending), color: 'bg-orange-500', icon: '💰' },
    { title: '결제완료', value: formatCurrency(paid), color: 'bg-green-500', icon: '✅' },
    { title: '등록된 건축주', value: String((clients || []).length), color: 'bg-purple-500', icon: '👥', href: '/clients' }
  ];

  return (
    <div className="p-6">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">대시보드</h1>
          <p className="text-gray-600">청구서 발행 현황을 한눈에 확인하세요</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const payload = {
                meta: { exportedAt: new Date().toISOString(), app: 'Construction Management System' },
                companyInfo, clients, workItems, invoices, estimates, units, categories, stampImage,
              };
              const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              const stampStr = new Date().toISOString().replace(/[:.]/g, '-');
              a.href = url;
              a.download = `cms-backup-${stampStr}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-4 py-2 rounded-md"
            title="모든 데이터를 JSON으로 저장"
          >
            💾 백업
          </button>
          <input
            ref={restoreInputRef}
            type="file"
            accept="application/json"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const text = await file.text();
                const data = JSON.parse(text);
                if (data.companyInfo) setCompanyInfo(data.companyInfo);
                if (Array.isArray(data.clients)) setClients(data.clients);
                if (Array.isArray(data.workItems)) setWorkItems(data.workItems);
                if (Array.isArray(data.invoices)) setInvoices(data.invoices);
                if (Array.isArray(data.estimates)) setEstimates(data.estimates);
                if (Array.isArray(data.units)) setUnits(data.units);
                if (Array.isArray(data.categories)) setCategories(data.categories);
                if (data.stampImage !== undefined) setStampImage(data.stampImage);
                alert('데이터 복원이 완료되었습니다.');
              } catch (err) {
                console.error('복원 오류:', err);
                alert('복원 중 오류가 발생했습니다. 올바른 백업 파일인지 확인하세요.');
              } finally {
                if (restoreInputRef.current) restoreInputRef.current.value = '';
              }
            }}
            className="hidden"
          />
          <button
            onClick={() => restoreInputRef.current?.click()}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-4 py-2 rounded-md"
            title="백업 JSON에서 복원"
          >
            ♻️ 복원
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const valueSize = (
            stat.title === '전체 청구액' ||
            stat.title === '결제완료' ||
            stat.title === '미수금(요약)' ||
            stat.title === '등록된 건축주'
          ) ? 'text-xl' : 'text-3xl';
          const Card = (
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className={`${valueSize} font-bold text-gray-900`}>{stat.value}</p>
                </div>
                <div className={`${stat.color} rounded-full p-3 text-white text-2xl`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          );
          return (
            <div key={index} className="rounded-lg">
              {stat.href ? (
                <Link to={stat.href} aria-label={`${stat.title} 자세히 보기`} className="block focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg">
                  {Card}
                </Link>
              ) : (
                Card
              )}
            </div>
          );
        })}
      </div>

      {/* 안내 문구 */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md px-4 py-3">
        작업 종료 시 상단의 ‘백업’ 버튼을 눌러 데이터를 보관하세요. 복원이 필요한 경우 ‘복원’ 버튼을 통해 백업 파일을 선택하면 됩니다.
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
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        invoice.status === '결제완료' ? 'bg-green-100 text-green-800' :
                        invoice.status === '발송됨' ? 'bg-blue-100 text-blue-800' :
                        invoice.status === '미결제' ? 'bg-orange-100 text-orange-800' :
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

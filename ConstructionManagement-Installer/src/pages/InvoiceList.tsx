import React from 'react';
import { 
  PlusIcon, 
  DocumentArrowDownIcon, 
  EyeIcon,
  PencilIcon 
} from '@heroicons/react/24/outline';
import { useApp } from '../contexts/AppContext';

export default function InvoiceList() {
  const { invoices, setInvoices } = useApp() as any;

  const formatCurrency = (amount: number) => {
    return `₩${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '발송대기': return 'bg-yellow-100 text-yellow-800';
      case '발송됨': return 'bg-blue-100 text-blue-800';
      case '미결제': return 'bg-orange-100 text-orange-800';
      case '결제완료': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleChangeStatus = (id: string, next: string) => {
    setInvoices((prev: any[]) => prev.map((inv: any) => inv.id === id ? { ...inv, status: next } : inv));
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">청구서 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            작업 내역을 기반으로 청구서를 생성하고 관리합니다.
          </p>
        </div>
        <button className="btn-primary flex items-center">
          <PlusIcon className="h-4 w-4 mr-2" />
          청구서 생성
        </button>
      </div>

      <div className="card">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  청구서 번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">프로젝트</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">거래처</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">청구일자</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">금액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(invoices || []).map((invoice: any) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {invoice.id}
                    </div>
                    <div className="text-sm text-gray-500">
                      {invoice.date}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.project}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.client}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                      <select
                        className="input-field py-1 px-2 text-xs"
                        value={invoice.status}
                        onChange={(e) => handleChangeStatus(invoice.id, e.target.value)}
                      >
                        <option value="발송대기">발송대기</option>
                        <option value="발송됨">발송됨</option>
                        <option value="미결제">미결제</option>
                        <option value="결제완료">결제완료</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button className="text-gray-600 hover:text-gray-900" title="미리보기">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="text-primary-600 hover:text-primary-900" title="수정">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900" title="PDF 다운로드">
                        <DocumentArrowDownIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 통계 */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="card">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">₩123,300,000</div>
            <div className="text-sm text-gray-500">이번 달 총 청구액</div>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">₩89,500,000</div>
            <div className="text-sm text-gray-500">입금 완료</div>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">₩33,800,000</div>
            <div className="text-sm text-gray-500">미수금</div>
          </div>
        </div>
      </div>
    </div>
  );
}

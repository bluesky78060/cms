import React from 'react';
import { 
  PlusIcon, 
  DocumentArrowDownIcon, 
  EyeIcon,
  PencilIcon 
} from '@heroicons/react/24/outline';

export default function InvoiceList() {
  const mockInvoices = [
    {
      invoice_id: 1,
      invoice_number: 'INV-2024-001',
      project_name: '아파트 신축공사 A동',
      client_name: '현대건설',
      issue_date: '2024-03-15',
      period_from: '2024-03-01',
      period_to: '2024-03-15',
      sequence: 1,
      supply_amount: 45000000,
      vat_amount: 4500000,
      total_amount: 49500000,
      status: 'sent'
    },
    {
      invoice_id: 2,
      invoice_number: 'INV-2024-002',
      project_name: '오피스텔 B동 마감공사',
      client_name: 'GS건설',
      issue_date: '2024-03-10',
      period_from: '2024-02-15',
      period_to: '2024-03-10',
      sequence: 2,
      supply_amount: 28000000,
      vat_amount: 2800000,
      total_amount: 30800000,
      status: 'draft'
    },
  ];

  const formatCurrency = (amount: number) => {
    return `₩${amount.toLocaleString()}`;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return '작성중';
      case 'sent': return '발송완료';
      case 'paid': return '입금완료';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  현장명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  발주처
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  청구기간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  차수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  청구금액
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockInvoices.map((invoice) => (
                <tr key={invoice.invoice_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {invoice.invoice_number}
                    </div>
                    <div className="text-sm text-gray-500">
                      {invoice.issue_date}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.project_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.client_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.period_from} ~ {invoice.period_to}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.sequence}차
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.total_amount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      공급가액: {formatCurrency(invoice.supply_amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`
                      inline-flex px-2 py-1 text-xs font-medium rounded-full
                      ${getStatusColor(invoice.status)}
                    `}>
                      {getStatusLabel(invoice.status)}
                    </span>
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
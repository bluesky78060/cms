import React, { useState, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { numberToKorean } from '../utils/numberToKorean';

const Estimates = () => {
  const {
    estimates,
    clients,
    companyInfo,
    addEstimate,
    updateEstimate,
    deleteEstimate,
    convertEstimateToInvoice
  } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printEstimate, setPrintEstimate] = useState(null);
  const printRef = useRef();

  // 상태별 필터링
  const filteredEstimates = estimates.filter(estimate => {
    if (filterStatus === 'all') return true;
    return estimate.status === filterStatus;
  });

  // 상태 한글 변환
  const getStatusText = (status) => {
    const statusMap = {
      draft: '초안',
      sent: '발송됨',
      approved: '승인됨',
      rejected: '거절됨',
      expired: '만료됨'
    };
    return statusMap[status] || status;
  };

  // 상태 색상 변환
  const getStatusColor = (status) => {
    const colorMap = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-yellow-100 text-yellow-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  // 견적서 생성/수정 모달
  const EstimateModal = () => {
    const [formData, setFormData] = useState(
      editingEstimate || {
        clientId: '',
        clientName: '',
        projectName: '',
        date: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'draft',
        items: [],
        notes: '',
        terms: '착수금 30%, 중도금 40%, 잔금 30%'
      }
    );

    const [newItem, setNewItem] = useState({
      category: '',
      description: '',
      quantity: 1,
      unit: '',
      unitPrice: 0,
      notes: ''
    });

    const handleClientChange = (e) => {
      const clientId = e.target.value;
      const client = clients.find(c => c.id === parseInt(clientId));
      setFormData({
        ...formData,
        clientId: parseInt(clientId),
        clientName: client ? client.name : '',
        projectName: client && client.projects.length > 0 ? client.projects[0] : ''
      });
    };

    const addItem = () => {
      if (!newItem.category || !newItem.description) return;
      
      const item = {
        ...newItem,
        totalPrice: newItem.quantity * newItem.unitPrice
      };
      
      setFormData({
        ...formData,
        items: [...formData.items, item]
      });
      
      setNewItem({
        category: '',
        description: '',
        quantity: 1,
        unit: '',
        unitPrice: 0,
        notes: ''
      });
    };

    const removeItem = (index) => {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index)
      });
    };

    const calculateTotals = () => {
      const subtotal = formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const tax = Math.floor(subtotal * 0.1);
      const total = subtotal + tax;
      return { subtotal, tax, total };
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      const { subtotal, tax, total } = calculateTotals();
      
      const estimateData = {
        ...formData,
        subtotal,
        tax,
        total
      };

      if (editingEstimate) {
        updateEstimate(editingEstimate.id, estimateData);
      } else {
        addEstimate(estimateData);
      }
      
      setShowModal(false);
      setEditingEstimate(null);
    };

    const { subtotal, tax, total } = calculateTotals();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">
            {editingEstimate ? '견적서 수정' : '새 견적서 작성'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            {/* 기본 정보 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  건축주 *
                </label>
                <select
                  value={formData.clientId}
                  onChange={handleClientChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">건축주를 선택하세요</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  프로젝트명 *
                </label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  견적일자 *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  유효기간 *
                </label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* 견적 항목 추가 */}
            <div className="border rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium mb-4">견적 항목 추가</h3>
              
              <div className="grid grid-cols-6 gap-2 mb-2">
                <input
                  type="text"
                  placeholder="카테고리"
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="p-2 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  placeholder="작업 설명"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="p-2 border border-gray-300 rounded-md"
                />
                <input
                  type="number"
                  placeholder="수량"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                  className="p-2 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  placeholder="단위"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  className="p-2 border border-gray-300 rounded-md"
                />
                <input
                  type="number"
                  placeholder="단가"
                  value={newItem.unitPrice}
                  onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
                  className="p-2 border border-gray-300 rounded-md"
                />
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700"
                >
                  추가
                </button>
              </div>
              
              <input
                type="text"
                placeholder="비고"
                value={newItem.notes}
                onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* 견적 항목 목록 */}
            {formData.items.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">견적 항목</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">카테고리</th>
                        <th className="px-4 py-2 text-left">설명</th>
                        <th className="px-4 py-2 text-center">수량</th>
                        <th className="px-4 py-2 text-center">단위</th>
                        <th className="px-4 py-2 text-right">단가</th>
                        <th className="px-4 py-2 text-right">금액</th>
                        <th className="px-4 py-2 text-center">삭제</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">{item.category}</td>
                          <td className="px-4 py-2">{item.description}</td>
                          <td className="px-4 py-2 text-center">{item.quantity}</td>
                          <td className="px-4 py-2 text-center">{item.unit}</td>
                          <td className="px-4 py-2 text-right">{item.unitPrice.toLocaleString()}원</td>
                          <td className="px-4 py-2 text-right">{item.totalPrice.toLocaleString()}원</td>
                          <td className="px-4 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4 text-right space-y-1">
                  <div>공급가액: {subtotal.toLocaleString()}원</div>
                  <div>부가세: {tax.toLocaleString()}원</div>
                  <div className="text-lg font-bold">합계: {total.toLocaleString()}원</div>
                </div>
              </div>
            )}

            {/* 추가 정보 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  비고
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  결제 조건
                </label>
                <textarea
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingEstimate(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingEstimate ? '수정' : '생성'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // PDF 출력 모달
  const PrintModal = () => {
    if (!printEstimate) return null;

    const handlePrint = () => {
      const printWindow = window.open('', '_blank');
      const printContent = printRef.current.innerHTML;
      
      printWindow.document.write(`
        <html>
          <head>
            <title>견적서 - ${printEstimate.clientName}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #000; padding: 8px; text-align: left; }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .font-bold { font-weight: bold; }
              .text-lg { font-size: 1.2em; }
              .bg-gray-50 { background-color: #f9f9f9; }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.print();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">견적서 출력</h2>
            <div className="space-x-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                PDF 출력
              </button>
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                닫기
              </button>
            </div>
          </div>
          
          <div ref={printRef}>
            <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>견 적 서</h1>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  견적번호: EST-{printEstimate.id.toString().padStart(4, '0')}
                </div>
              </div>

              <table style={{ width: '100%', marginBottom: '20px', borderCollapse: 'collapse' }}>
                <tr>
                  <td style={{ width: '50%', padding: '10px', border: '1px solid #000' }}>
                    <strong>{companyInfo.name}</strong><br />
                    대표: {companyInfo.representative}<br />
                    주소: {companyInfo.address}<br />
                    전화: {companyInfo.phone}<br />
                    사업자등록번호: {companyInfo.businessNumber}
                  </td>
                  <td style={{ width: '50%', padding: '10px', border: '1px solid #000' }}>
                    <strong>{printEstimate.clientName}</strong><br />
                    프로젝트: {printEstimate.projectName}<br />
                    견적일자: {printEstimate.date}<br />
                    유효기간: {printEstimate.validUntil}<br />
                    상태: {getStatusText(printEstimate.status)}
                  </td>
                </tr>
              </table>

              <table style={{ width: '100%', marginBottom: '20px', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f9f9f9' }}>
                  <tr>
                    <th style={{ padding: '10px', border: '1px solid #000' }}>카테고리</th>
                    <th style={{ padding: '10px', border: '1px solid #000' }}>작업 내용</th>
                    <th style={{ padding: '10px', border: '1px solid #000', textAlign: 'center' }}>수량</th>
                    <th style={{ padding: '10px', border: '1px solid #000', textAlign: 'center' }}>단위</th>
                    <th style={{ padding: '10px', border: '1px solid #000', textAlign: 'right' }}>단가</th>
                    <th style={{ padding: '10px', border: '1px solid #000', textAlign: 'right' }}>금액</th>
                    <th style={{ padding: '10px', border: '1px solid #000' }}>비고</th>
                  </tr>
                </thead>
                <tbody>
                  {printEstimate.items.map((item, index) => (
                    <tr key={index}>
                      <td style={{ padding: '8px', border: '1px solid #000' }}>{item.category}</td>
                      <td style={{ padding: '8px', border: '1px solid #000' }}>{item.description}</td>
                      <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>{item.unit}</td>
                      <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'right' }}>
                        {item.unitPrice.toLocaleString()}원
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'right' }}>
                        {item.totalPrice.toLocaleString()}원
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #000' }}>{item.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                <div style={{ marginBottom: '5px' }}>공급가액: {printEstimate.subtotal.toLocaleString()}원</div>
                <div style={{ marginBottom: '5px' }}>부가세(10%): {printEstimate.tax.toLocaleString()}원</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', borderTop: '2px solid #000', paddingTop: '5px' }}>
                  총 견적금액: 금 {numberToKorean(printEstimate.total)} 원정 ({printEstimate.total.toLocaleString()}원)
                </div>
              </div>

              {printEstimate.terms && (
                <div style={{ marginBottom: '20px' }}>
                  <strong>결제 조건:</strong><br />
                  {printEstimate.terms}
                </div>
              )}

              {printEstimate.notes && (
                <div style={{ marginBottom: '20px' }}>
                  <strong>비고:</strong><br />
                  {printEstimate.notes}
                </div>
              )}

              <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <div style={{ marginBottom: '10px' }}>위와 같이 견적합니다.</div>
                <div>
                  <strong>{companyInfo.name}</strong><br />
                  대표 {companyInfo.representative} (인)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleConvertToInvoice = (estimateId) => {
    const invoiceId = convertEstimateToInvoice(estimateId);
    if (invoiceId) {
      alert(`견적서가 청구서로 변환되었습니다! (청구서 ID: ${invoiceId})`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📋 견적서 관리</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          + 새 견적서
        </button>
      </div>

      {/* 필터 */}
      <div className="mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 rounded-full text-sm ${
              filterStatus === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
            }`}
          >
            전체 ({estimates.length})
          </button>
          <button
            onClick={() => setFilterStatus('draft')}
            className={`px-3 py-1 rounded-full text-sm ${
              filterStatus === 'draft' ? 'bg-gray-100 text-gray-800' : 'bg-gray-50 text-gray-700'
            }`}
          >
            초안 ({estimates.filter(e => e.status === 'draft').length})
          </button>
          <button
            onClick={() => setFilterStatus('sent')}
            className={`px-3 py-1 rounded-full text-sm ${
              filterStatus === 'sent' ? 'bg-blue-100 text-blue-800' : 'bg-gray-50 text-gray-700'
            }`}
          >
            발송됨 ({estimates.filter(e => e.status === 'sent').length})
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-3 py-1 rounded-full text-sm ${
              filterStatus === 'approved' ? 'bg-green-100 text-green-800' : 'bg-gray-50 text-gray-700'
            }`}
          >
            승인됨 ({estimates.filter(e => e.status === 'approved').length})
          </button>
        </div>
      </div>

      {/* 견적서 목록 */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">견적번호</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">건축주</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">프로젝트</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">견적일자</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">유효기간</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">견적금액</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">상태</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEstimates.map((estimate) => (
              <tr key={estimate.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  EST-{estimate.id.toString().padStart(4, '0')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {estimate.clientName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {estimate.projectName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {estimate.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {estimate.validUntil}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {estimate.total.toLocaleString()}원
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(estimate.status)}`}>
                    {getStatusText(estimate.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center space-x-1">
                  <button
                    onClick={() => {
                      setPrintEstimate(estimate);
                      setShowPrintModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    출력
                  </button>
                  <button
                    onClick={() => {
                      setEditingEstimate(estimate);
                      setShowModal(true);
                    }}
                    className="text-green-600 hover:text-green-800"
                  >
                    수정
                  </button>
                  {estimate.status === 'approved' && (
                    <button
                      onClick={() => handleConvertToInvoice(estimate.id)}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      청구서변환
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (window.confirm('이 견적서를 삭제하시겠습니까?')) {
                        deleteEstimate(estimate.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredEstimates.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {filterStatus === 'all' ? '등록된 견적서가 없습니다.' : `${getStatusText(filterStatus)} 상태의 견적서가 없습니다.`}
          </div>
        )}
      </div>

      {/* 모달들 */}
      {showModal && <EstimateModal />}
      {showPrintModal && <PrintModal />}
    </div>
  );
};

export default Estimates;
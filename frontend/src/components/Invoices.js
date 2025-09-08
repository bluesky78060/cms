import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { numberToKorean } from '../utils/numberToKorean';
import { exportToExcel } from '../utils/excelUtils';

function Invoices() {
  const { clients, invoices, setInvoices, companyInfo, workItems } = useApp();


  // 작업 항목 템플릿 데이터 (WorkItems.js와 동일한 데이터)
  const [workItemTemplates] = useState([
    {
      id: 1,
      name: '기초공사',
      category: '토목공사',
      defaultPrice: 3000000,
      unit: '식',
      description: '건물 기초 및 지반 작업'
    },
    {
      id: 2,
      name: '골조공사',
      category: '구조공사',
      defaultPrice: 4000000,
      unit: '식',
      description: '철골 및 철근콘크리트 골조 작업'
    },
    {
      id: 3,
      name: '벽체 철거',
      category: '철거공사',
      defaultPrice: 800000,
      unit: '㎡',
      description: '기존 벽체 철거 및 폐기물 처리'
    },
    {
      id: 4,
      name: '바닥 시공',
      category: '마감공사',
      defaultPrice: 1200000,
      unit: '㎡',
      description: '바닥재 설치 및 마감 작업'
    },
    {
      id: 5,
      name: '내부 칸막이',
      category: '내부공사',
      defaultPrice: 2000000,
      unit: '㎡',
      description: '내부 칸막이벽 설치'
    },
    {
      id: 6,
      name: '전기공사',
      category: '설비공사',
      defaultPrice: 1500000,
      unit: '식',
      description: '전기 배선 및 조명 설치'
    },
    {
      id: 7,
      name: '화장실 철거',
      category: '철거공사',
      defaultPrice: 500000,
      unit: '식',
      description: '기존 화장실 철거'
    },
    {
      id: 8,
      name: '화장실 설치',
      category: '설비공사',
      defaultPrice: 1000000,
      unit: '식',
      description: '새로운 화장실 설치 및 배관'
    },
    {
      id: 9,
      name: '도배 및 페인트',
      category: '마감공사',
      defaultPrice: 800000,
      unit: '㎡',
      description: '벽면 도배 및 페인트 작업'
    },
    {
      id: 10,
      name: '타일 시공',
      category: '마감공사',
      defaultPrice: 1000000,
      unit: '㎡',
      description: '바닥 및 벽면 타일 시공'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [printInvoice, setPrintInvoice] = useState(null);
  const [newInvoice, setNewInvoice] = useState({
    clientId: '',
    client: '',
    workplaceId: '',
    project: '',
    workplaceAddress: '',
    workItems: [{ name: '', quantity: 1, unitPrice: 0, total: 0, templateId: '', notes: '' }]
  });

  const componentRef = useRef();

  // Excel 관련 함수들
  const handleExportToExcel = () => {
    exportToExcel.invoices(invoices);
  };

  const handleExportInvoiceDetail = (invoice) => {
    exportToExcel.invoiceDetail(invoice);
  };

  // Auto-reset printInvoice state to prevent UI issues
  useEffect(() => {
    if (printInvoice) {
      const timer = setTimeout(() => {
        setPrintInvoice(null);
        console.log('Auto-reset printInvoice state');
      }, 3000); // Reset after 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [printInvoice]);

  // 선택된 건축주의 작업장 목록 가져오기
  const getClientWorkplaces = (clientId) => {
    const client = clients.find(c => c.id === parseInt(clientId));
    return client?.workplaces || [];
  };

  // 폼 입력 핸들러
  const handleFormInputChange = (e) => {
    const { name, value } = e.target;
    
    setNewInvoice(prev => {
      const updated = { ...prev, [name]: value };
      
      // 건축주 변경 시 관련 정보 업데이트
      if (name === 'clientId') {
        const selectedClient = clients.find(c => c.id === parseInt(value));
        updated.client = selectedClient?.name || '';
        updated.workplaceId = '';
        updated.workplaceAddress = '';
      }
      
      // 작업장 변경 시 주소 업데이트
      if (name === 'workplaceId') {
        const selectedClient = clients.find(c => c.id === parseInt(prev.clientId));
        const selectedWorkplace = selectedClient?.workplaces.find(w => w.id === parseInt(value));
        updated.workplaceAddress = selectedWorkplace?.address || '';
      }
      
      return updated;
    });
  };

  const addWorkItem = () => {
    setNewInvoice(prev => ({
      ...prev,
      workItems: [...prev.workItems, { name: '', quantity: 1, unitPrice: 0, total: 0, templateId: '', notes: '' }]
    }));
  };

  const updateWorkItem = (index, field, value) => {
    const updatedItems = [...newInvoice.workItems];
    
    // 작업 항목 템플릿 선택 시 작업명과 비고 설정
    if (field === 'templateId' && value) {
      const template = workItemTemplates.find(t => t.id === parseInt(value));
      if (template) {
        updatedItems[index].name = template.name;
        updatedItems[index].templateId = parseInt(value);
        // 단가는 자동 설정하지 않음 - 사용자가 직접 입력
        
        // 실제 workItems에서 해당 작업명과 일치하는 항목의 notes 찾기
        const matchingWorkItem = workItems.find(wi => wi.name === template.name);
        if (matchingWorkItem && matchingWorkItem.notes) {
          updatedItems[index].notes = matchingWorkItem.notes;
        }
      }
    } else if (field === 'name' && value === '') {
      // 직접 입력 선택 시 템플릿 초기화
      updatedItems[index].templateId = '';
    } else {
      updatedItems[index][field] = value;
    }
    
    // 수량이나 단가 변경 시 합계 재계산
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unitPrice;
    }
    
    setNewInvoice(prev => ({
      ...prev,
      workItems: updatedItems
    }));
  };

  const getTotalAmount = (workItems) => {
    return workItems.reduce((sum, item) => sum + item.total, 0);
  };

  const handleCreateInvoice = (e) => {
    e.preventDefault();
    const totalAmount = getTotalAmount(newInvoice.workItems);
    const newInv = {
      ...newInvoice,
      id: `INV-2024-${String(invoices.length + 1).padStart(3, '0')}`,
      amount: totalAmount,
      status: '발송대기',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    
    setInvoices(prev => [...prev, newInv]);
    setNewInvoice({
      clientId: '',
      client: '',
      workplaceId: '',
      project: '',
      workplaceAddress: '',
      workItems: [{ name: '', quantity: 1, unitPrice: 0, total: 0, templateId: '', notes: '' }]
    });
    setShowModal(false);
  };

  const viewInvoiceDetails = (invoice) => {
    setSelectedInvoice(invoice);
  };

  const handleDeleteInvoice = (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId));
    }
  };

  const generatePDF = (invoice) => {
    console.log('PDF generation started:', invoice.id);
    
    // Set printInvoice
    setPrintInvoice(invoice);
    
    // Execute after waiting for state update
    setTimeout(() => {
      console.log('Attempting to open print dialog');
      
      try {
        // Use window.print() directly
        const printContent = componentRef.current;
        if (!printContent) {
          console.error('Cannot find content to print.');
          alert('PDF generation failed. Cannot find content.');
          setPrintInvoice(null); // Reset state
          return;
        }
        
        // Print in new window
        const printWindow = window.open('', '_blank');
        
        // Check if window opened successfully
        if (!printWindow) {
          console.error('Popup blocked or cannot open window.');
          alert('Popup blocked. Please allow popups in browser settings.');
          setPrintInvoice(null); // Reset state
          return;
        }
        printWindow.document.write(`
          <html>
            <head>
              <title>Construction Invoice ${invoice.id}</title>
              <meta charset="UTF-8">
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap');
                
                body { 
                  font-family: 'Noto Sans KR', sans-serif; 
                  margin: 0; 
                  padding: 2rem; 
                  background-color: #f3f4f6;
                  color: #374151;
                  line-height: 1.4;
                }
                
                .invoice-container {
                  max-width: 800px;
                  margin: auto;
                  background-color: #ffffff;
                  padding: 2.5rem;
                  border-radius: 12px;
                  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                }
                
                h1 {
                  border-bottom: 3px solid #1f2937;
                  padding-bottom: 1rem;
                }
                
                .section-title {
                  font-weight: 700;
                  color: #1f2937;
                  border-left: 4px solid #4f46e5;
                  padding-left: 0.75rem;
                  margin-bottom: 1rem;
                }
                
                .table-container {
                  overflow-x: auto;
                }
                
                table {
                  width: 100%;
                  min-width: 600px;
                  border-collapse: collapse;
                }
                
                th, td {
                  padding: 0.75rem 1rem;
                  text-align: left;
                  border-bottom: 1px solid #e5e7eb;
                }
                
                th {
                  background-color: #f9fafb;
                  font-weight: 700;
                  color: #1f2937;
                }
                
                tr:hover {
                  background-color: #f1f5f9;
                }
                
                .signature-area {
                  margin-top: 3rem;
                  text-align: right;
                }
                
                @media print {
                  body {
                    background-color: #fff;
                    padding: 0;
                  }
                  .invoice-container {
                    box-shadow: none;
                    border-radius: 0;
                    padding: 0;
                  }
                  .no-print {
                    display: none;
                  }
                }
              </style>
            </head>
            <body>
              <div class="invoice-container">
                ${printContent.innerHTML}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        
        // Simple approach: just trigger print and let user handle the window
        
        setTimeout(() => {
          try {
            printWindow.print();
            // Don't auto-close the window, let user control it
          } catch (printError) {
            console.error('Print execution error:', printError);
          }
        }, 500);
        
        console.log('Print dialog has been opened.');
        
      } catch (error) {
        console.error('PDF generation error:', error);
        alert('Error occurred during PDF generation: ' + error.message);
        setPrintInvoice(null); // Reset state even on error
      }
    }, 300);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">청구서 관리</h1>
          <p className="text-gray-600">작업 완료 후 청구서를 생성하고 관리하세요</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleExportToExcel}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            📥 Excel 내보내기
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            + 새 청구서
          </button>
        </div>
      </div>

      {/* 청구서 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                청구서 번호
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                건축주
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                프로젝트
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                금액
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                발행일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{invoice.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{invoice.client}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{invoice.project}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {invoice.amount.toLocaleString()}원
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    invoice.status === '결제완료' ? 'bg-green-100 text-green-800' :
                    invoice.status === '발송됨' ? 'bg-blue-100 text-blue-800' :
                    invoice.status === '미결제' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {invoice.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{invoice.date}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => viewInvoiceDetails(invoice)}
                    className="text-blue-600 hover:text-blue-900 mr-2"
                  >
                    상세보기
                  </button>
                  <button 
                    onClick={() => generatePDF(invoice)}
                    className="text-green-600 hover:text-green-900 mr-2"
                  >
                    PDF
                  </button>
                  <button 
                    onClick={() => handleExportInvoiceDetail(invoice)}
                    className="text-orange-600 hover:text-orange-900 mr-2"
                  >
                    Excel
                  </button>
                  <button 
                    onClick={() => handleDeleteInvoice(invoice.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 새 청구서 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">새 청구서 생성</h3>
              <form onSubmit={handleCreateInvoice} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">건축주 *</label>
                    <select
                      name="clientId"
                      value={newInvoice.clientId}
                      onChange={handleFormInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
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
                    <label className="block text-sm font-medium text-gray-700">프로젝트명 *</label>
                    <input
                      type="text"
                      name="project"
                      value={newInvoice.project}
                      onChange={handleFormInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter project name"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">작업장 *</label>
                  <select
                    name="workplaceId"
                    value={newInvoice.workplaceId}
                    onChange={handleFormInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!newInvoice.clientId}
                  >
                    <option value="">
                      {newInvoice.clientId ? '작업장을 선택하세요' : '먼저 건축주를 선택하세요'}
                    </option>
                    {newInvoice.clientId && getClientWorkplaces(newInvoice.clientId).map(workplace => (
                      <option key={workplace.id} value={workplace.id}>
                        {workplace.name} - {workplace.address}
                      </option>
                    ))}
                  </select>
                  {newInvoice.workplaceAddress && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                      <strong>작업장 주소:</strong> {newInvoice.workplaceAddress}
                    </div>
                  )}
                </div>

                {/* 작업 항목 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">작업 항목</label>
                    <button
                      type="button"
                      onClick={addWorkItem}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + 항목 추가
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {newInvoice.workItems.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">작업 템플릿 선택</label>
                            <select
                              value={item.templateId || ''}
                              onChange={(e) => updateWorkItem(index, 'templateId', e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="">템플릿 선택 또는 직접 입력</option>
                              {workItemTemplates.map(template => (
                                <option key={template.id} value={template.id}>
                                  {template.name} ({template.category})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">작업명 (직접입력)</label>
                            <input
                              type="text"
                              placeholder="Or enter manually"
                              value={item.templateId ? '' : item.name}
                              onChange={(e) => updateWorkItem(index, 'name', e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              disabled={!!item.templateId}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">수량</label>
                            <input
                              type="number"
                              placeholder="Quantity"
                              value={item.quantity}
                              onChange={(e) => updateWorkItem(index, 'quantity', parseInt(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              min="1"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">단가 (직접입력)</label>
                            <input
                              type="number"
                              placeholder="Enter unit price"
                              value={item.unitPrice}
                              onChange={(e) => updateWorkItem(index, 'unitPrice', parseInt(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              min="0"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">합계</label>
                            <input
                              type="text"
                              value={item.total.toLocaleString() + '원'}
                              readOnly
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100 text-gray-700 font-medium"
                            />
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-gray-600 mb-1">비고</label>
                          <textarea
                            value={item.notes || ''}
                            onChange={(e) => updateWorkItem(index, 'notes', e.target.value)}
                            rows="2"
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            placeholder="추가 메모나 특이사항을 입력하세요"
                          />
                        </div>
                        {item.templateId && (
                          <div className="mt-2 text-xs text-gray-500 bg-blue-50 p-2 rounded">
                            <strong>선택된 작업:</strong> {workItemTemplates.find(t => t.id === item.templateId)?.description}
                          </div>
                        )}
                        {newInvoice.workItems.length > 1 && (
                          <div className="mt-2 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                const updatedItems = newInvoice.workItems.filter((_, i) => i !== index);
                                setNewInvoice(prev => ({ ...prev, workItems: updatedItems }));
                              }}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              항목 삭제
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-right mt-2">
                    <span className="text-lg font-bold">
                      총합: {getTotalAmount(newInvoice.workItems).toLocaleString()}원
                    </span>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    청구서 생성
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 청구서 상세보기 모달 */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-3xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">청구서 상세 - {selectedInvoice.id}</h3>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="border rounded-lg p-6 bg-gray-50">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p><strong>건축주:</strong> {selectedInvoice.client}</p>
                  <p><strong>프로젝트:</strong> {selectedInvoice.project}</p>
                  <p><strong>작업장 주소:</strong> {selectedInvoice.workplaceAddress}</p>
                </div>
                <div>
                  <p><strong>발행일:</strong> {selectedInvoice.date}</p>
                  <p><strong>지불 기한:</strong> {selectedInvoice.dueDate}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium mb-2">작업 내역</h4>
                <table className="w-full border">
                  <thead className="bg-white">
                    <tr>
                      <th className="border px-3 py-2 text-left">작업명</th>
                      <th className="border px-3 py-2 text-center">수량</th>
                      <th className="border px-3 py-2 text-right">단가</th>
                      <th className="border px-3 py-2 text-right">합계</th>
                      <th className="border px-3 py-2 text-left">비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.workItems.map((item, index) => (
                      <tr key={index}>
                        <td className="border px-3 py-2">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900">
                                {item.name}
                              </span>
                              {item.category && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full ml-2">
                                  {item.category}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <div className="text-sm text-gray-600 leading-relaxed">
                                {item.description.split('\n')[0]}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="border px-3 py-2 text-center">{item.quantity}</td>
                        <td className="border px-3 py-2 text-right">{item.unitPrice.toLocaleString()}원</td>
                        <td className="border px-3 py-2 text-right font-medium">{item.total.toLocaleString()}원</td>
                        <td className="border px-3 py-2 text-left text-sm align-top">
                          {item.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100">
                      <td colSpan="4" className="border px-3 py-2 text-right font-bold">총 금액:</td>
                      <td className="border px-3 py-2 text-right font-bold text-lg">
                        {selectedInvoice.amount.toLocaleString()}원
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF 인쇄용 숨겨진 컴포넌트 */}
      <div style={{ display: 'none' }}>
        <div ref={componentRef} style={{ padding: '40px', fontFamily: "'Noto Sans KR', sans-serif", fontSize: '12px', lineHeight: '1.4', maxWidth: '800px', margin: 'auto', backgroundColor: '#ffffff', color: '#374151' }}>
          {printInvoice && (
            <>
              {/* 청구서 번호 및 제목 */}
              <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div style={{ fontSize: '14px', color: '#374151' }}>
                    <strong>청구서 번호:</strong> {printInvoice.id}
                  </div>
                  <div style={{ fontSize: '14px', color: '#374151' }}>
                    <strong>작성일:</strong> {printInvoice.date}
                  </div>
                </div>
                <div style={{ textAlign: 'center', borderBottom: '3px solid #1f2937', paddingBottom: '20px' }}>
                  <h1 style={{ fontSize: '36px', margin: '0', fontWeight: 'bold', color: '#1f2937', letterSpacing: '8px' }}>청   구   서</h1>
                </div>
              </div>

              {/* 수신자 및 발신자 정보 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
                {/* 건축주 정보 (왼쪽) */}
                <div>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: 'bold', color: '#1f2937', borderLeft: '4px solid #4f46e5', paddingLeft: '12px' }}>
                    수신자 정보 (건축주)
                  </h3>
                  <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px' }}>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>건축주명:</strong> {printInvoice.client}</p>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>프로젝트명:</strong> {printInvoice.project}</p>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>작업장 주소:</strong> {printInvoice.workplaceAddress}</p>
                  </div>
                </div>
                
                {/* 업체 정보 (오른쪽) */}
                <div>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: 'bold', color: '#1f2937', borderLeft: '4px solid #4f46e5', paddingLeft: '12px' }}>
                    발신자 정보 (업체)
                  </h3>
                  <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px' }}>
                    <p style={{ margin: '8px 0', fontSize: '14px', fontWeight: 'bold' }}>{companyInfo.name}</p>
                    <p style={{ margin: '8px 0', fontSize: '12px' }}>사업자등록번호: {companyInfo.businessNumber}</p>
                    <p style={{ margin: '8px 0', fontSize: '12px' }}>대표자: {companyInfo.representative}</p>
                    <p style={{ margin: '8px 0', fontSize: '12px' }}>주소: {companyInfo.address}</p>
                    <p style={{ margin: '8px 0', fontSize: '12px' }}>연락처: {companyInfo.phone}</p>
                    {companyInfo.email && <p style={{ margin: '8px 0', fontSize: '12px' }}>이메일: {companyInfo.email}</p>}
                  </div>
                </div>
              </div>


              {/* 총 청구 금액 */}
              <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#dbeafe', borderRadius: '8px', borderLeft: '4px solid #3b82f6', textAlign: 'left' }}>
                <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: '#1e3a8a' }}>
                  총 청구금액 : 금 {numberToKorean(printInvoice.amount)} 원정
                </p>
              </div>

              {/* 세부 작업 내역 */}
              <div style={{ marginBottom: '40px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold', color: '#1f2937', borderLeft: '4px solid #4f46e5', paddingLeft: '12px' }}>
                  세부 작업 내역
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f9fafb' }}>
                        <th style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'left', fontWeight: 'bold', color: '#1f2937', width: '60px' }}>
                          연번
                        </th>
                        <th style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'left', fontWeight: 'bold', color: '#1f2937' }}>
                          작업명
                        </th>
                        <th style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 'bold', color: '#1f2937' }}>
                          규격
                        </th>
                        <th style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 'bold', color: '#1f2937' }}>
                          단위
                        </th>
                        <th style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 'bold', color: '#1f2937' }}>
                          수량
                        </th>
                        <th style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'right', fontWeight: 'bold', color: '#1f2937' }}>
                          공급가액
                        </th>
                        <th style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 'bold', color: '#1f2937' }}>
                          비고
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {printInvoice.workItems.map((item, index) => (
                        <tr key={index} style={{ ':hover': { backgroundColor: '#f1f5f9' } }}>
                          <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'center' }}>{index + 1}</td>
                          <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb' }}>
                            <div>
                              <strong>{item.name}</strong>
                              {item.description && (
                                <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'center' }}>{item.category || '-'}</td>
                          <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'center' }}>식</td>
                          <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'center' }}>{item.quantity}</td>
                          <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'right' }}>{item.unitPrice.toLocaleString()}원</td>
                          <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'left', fontSize: '11px', verticalAlign: 'top' }}>
                            {item.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold', color: '#1f2937' }}>
                        <td colSpan="6" style={{ padding: '15px 16px', border: '1px solid #e5e7eb', textAlign: 'right', fontSize: '16px' }}>
                          합계:
                        </td>
                        <td style={{ padding: '15px 16px', border: '1px solid #e5e7eb', textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>
                          {printInvoice.amount.toLocaleString()}원
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* 결제 정보 */}
              <div style={{ marginTop: '40px', marginBottom: '30px' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: 'bold', color: '#1f2937', borderLeft: '4px solid #4f46e5', paddingLeft: '12px' }}>
                  결제 정보
                </h3>
                <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                  {companyInfo.bankAccount && (
                    <>
                      <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>계좌정보:</strong></p>
                      <p style={{ margin: '5px 0', fontSize: '14px' }}>{companyInfo.bankAccount}</p>
                      <p style={{ margin: '5px 0', fontSize: '14px' }}>예금주: {companyInfo.accountHolder}</p>
                    </>
                  )}
                </div>
              </div>

              {/* 서명 영역 */}
              <div style={{ textAlign: 'right', marginBottom: '40px' }}>
                <p style={{ margin: '0 0 20px 0', fontSize: '16px', lineHeight: '1.6' }}>위와 같이 청구합니다.</p>
                <div style={{ marginTop: '30px', textAlign: 'right', border: '1px solid #e5e7eb', padding: '20px', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                  <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>
                    {companyInfo.name}<br/>
                    대표: {companyInfo.representative} (인)
                  </p>
                </div>
              </div>

              {/* 페이지 하단 - 문의사항 및 감사 인사 */}
              <div style={{ position: 'relative', marginTop: '60px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                <div style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>
                  <p style={{ margin: '0 0 8px 0', lineHeight: '1.5' }}>이 청구서에 대한 문의사항이 있으시면 연락 주시기 바랍니다.</p>
                  <p style={{ margin: '0', fontWeight: 'bold', fontSize: '13px' }}>감사합니다.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}

export default Invoices;
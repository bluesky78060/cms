import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { numberToKorean } from '../utils/numberToKorean';
import { exportToExcel, importFromExcel, createTemplate } from '../utils/excelUtils';

function Invoices() {
  // eslint-disable-next-line no-unused-vars
  const { clients, invoices, setInvoices, companyInfo, workItems, stampImage } = useApp();

  // 숫자에 콤마 포맷팅 함수
  const formatNumberWithCommas = (number) => {
    if (!number && number !== 0) return '';
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // 청구서 상태 변경 함수
  const handleStatusChange = (invoiceId, newStatus) => {
    setInvoices(prev => 
      prev.map(invoice => 
        invoice.id === invoiceId 
          ? { ...invoice, status: newStatus }
          : invoice
      )
    );
  };


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
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // 상태 옵션 정의
  const statusOptions = ['발송대기', '발송됨', '미결제', '결제완료'];
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

  // eslint-disable-next-line no-unused-vars
  const handleExportInvoiceDetail = (invoice) => {
    exportToExcel.invoiceDetail(invoice);
  };

  const handleImportFromExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const importedInvoices = await importFromExcel.invoices(file);
      setInvoices(prev => [...prev, ...importedInvoices]);
      alert(`${importedInvoices.length}개의 청구서를 가져왔습니다.`);
      e.target.value = ''; // Reset file input
    } catch (error) {
      console.error('Excel 가져오기 오류:', error);
      alert('Excel 파일 가져오기에 실패했습니다.');
    }
  };

  const handleDownloadTemplate = () => {
    createTemplate.invoices();
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
    
    // 작업 항목 템플릿 선택 시 내용과 비고 설정
    if (field === 'templateId' && value) {
      const template = workItemTemplates.find(t => t.id === parseInt(value));
      if (template) {
        updatedItems[index].name = template.name;
        updatedItems[index].templateId = parseInt(value);
        // 단가는 자동 설정하지 않음 - 사용자가 직접 입력
        
        // 실제 workItems에서 해당 내용과 일치하는 항목의 notes 찾기
        const matchingWorkItem = workItems.find(wi => wi.name === template.name);
        if (matchingWorkItem && matchingWorkItem.notes) {
          updatedItems[index].notes = matchingWorkItem.notes;
        }
      }
    } else if (field === 'name' && value === '') {
      // 직접 입력 선택 시 템플릿 초기화
      updatedItems[index].templateId = '';
    } else if (field === 'quantity' || field === 'unitPrice') {
      // 수량이나 단가 필드의 경우 숫자만 추출
      const numbersOnly = value.toString().replace(/[^\d]/g, '');
      const numericValue = parseInt(numbersOnly) || 0;
      updatedItems[index][field] = numericValue;
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

  // 체크박스 관련 함수들
  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedInvoices(invoices.map(invoice => invoice.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectInvoice = (invoiceId, checked) => {
    if (checked) {
      setSelectedInvoices(prev => [...prev, invoiceId]);
    } else {
      setSelectedInvoices(prev => prev.filter(id => id !== invoiceId));
      setSelectAll(false);
    }
  };

  // 선택된 청구서들 삭제
  const handleDeleteSelectedInvoices = () => {
    if (selectedInvoices.length === 0) {
      alert('삭제할 청구서를 선택해주세요.');
      return;
    }

    if (window.confirm(`정말로 선택된 ${selectedInvoices.length}개의 청구서를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      try {
        setInvoices(prev => prev.filter(invoice => !selectedInvoices.includes(invoice.id)));
        setSelectedInvoices([]);
        setSelectAll(false);
        alert(`${selectedInvoices.length}개의 청구서가 성공적으로 삭제되었습니다.`);
      } catch (error) {
        console.error('청구서 삭제 오류:', error);
        alert('청구서 삭제 중 오류가 발생했습니다: ' + error.message);
      }
    }
  };

  const handleDeleteInvoice = (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId));
    }
  };

  const generatePDF = (invoice) => {
    console.log('청구서 PDF 새 탭에서 열기 시작:', invoice.id);
    
    try {
      // Create new window first
      const printWindow = window.open('', '_blank', 'width=1200,height=900,scrollbars=yes,resizable=yes');
      
      // Check if window opened successfully
      if (!printWindow) {
        console.error('팝업이 차단되었습니다');
        alert('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.');
        return;
      }

      // Create comprehensive HTML content directly
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="ko">
          <head>
            <title>청구서 ${invoice.id} - 건설업 청구서 관리 시스템</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
              
              * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
              }
              
              body { 
                font-family: 'Noto Sans KR', sans-serif; 
                margin: 0; 
                padding: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                color: #374151;
                line-height: 1.5;
              }
              
              .container {
                max-width: 1000px;
                margin: 20px auto;
                background-color: #ffffff;
                border-radius: 16px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                overflow: hidden;
              }
              
              .header {
                background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
                color: white;
                padding: 15px;
                text-align: center;
              }
              
              .header h1 {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 5px;
                letter-spacing: 4px;
              }
              
              .invoice-meta {
                display: flex;
                justify-content: space-between;
                margin-top: 10px;
                font-size: 14px;
              }
              
              .content {
                padding: 40px;
              }
              
              .section {
                margin-bottom: 40px;
              }
              
              .section-title {
                font-size: 18px;
                font-weight: 700;
                color: #1f2937;
                border-left: 4px solid #9ca3af;
                padding-left: 12px;
                margin-bottom: 20px;
              }
              
              .grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                margin-bottom: 30px;
              }
              
              .info-box {
                background-color: #f5f5f5;
                padding: 20px;
                border-radius: 12px;
                border: 1px solid #e2e8f0;
              }
              
              .info-box h4 {
                font-size: 16px;
                font-weight: 600;
                color: #374151;
                margin-bottom: 15px;
              }
              
              .info-box p {
                margin: 8px 0;
                font-size: 16px;
              }
              
              .amount-highlight {
                background: #f3f4f6;
                padding: 10px;
                border-radius: 6px;
                border-left: 3px solid #9ca3af;
                text-align: center;
                margin: 20px 0;
              }
              
              .amount-highlight p {
                margin: 0;
                font-size: 18px;
                font-weight: 700;
                color: #374151;
              }
              
              .work-table {
                width: 100%;
                border-collapse: collapse;
                background-color: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              }
              
              .work-table th {
                background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                padding: 15px 12px;
                text-align: center;
                font-weight: 700;
                font-size: 16px;
                color: #1f2937;
                border-bottom: 2px solid #e2e8f0;
              }
              
              .work-table td {
                padding: 14px;
                border-bottom: 1px solid #f1f5f9;
                font-size: 15px;
                vertical-align: top;
              }
              
              .work-table tr:hover {
                background-color: #f8fafc;
              }
              
              .work-table tfoot {
                background: linear-gradient(135deg, #f0f0f0 0%, #e5e5e5 100%);
                font-weight: 700;
              }
              
              .work-table tfoot td {
                padding: 15px 12px;
                border-top: 2px solid #cbd5e1;
                font-size: 18px;
              }
              
              .signature-section {
                margin-top: 40px;
                text-align: right;
              }
              
              .signature-box {
                display: inline-block;
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 20px;
                margin-top: 20px;
              }
              
              .signature-company {
                font-size: 16px;
                font-weight: 700;
                margin-bottom: 15px;
              }
              
              .signature-representative {
                display: flex;
                align-items: center;
                justify-content: flex-end;
                gap: 8px;
              }
              
              .signature-representative span {
                font-size: 16px;
                font-weight: 700;
              }
              
              .stamp-container {
                position: relative;
                display: inline-block;
              }
              
              .stamp-container img {
                width: 60px;
                height: 60px;
                object-fit: contain;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
              }
              
              .footer-message {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                font-size: 12px;
                color: #6b7280;
              }
              
              .controls {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                display: flex;
                gap: 10px;
              }
              
              .btn {
                padding: 12px 20px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                font-size: 14px;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
              }
              
              .btn-print {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
              }
              
              .btn-print:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 15px rgba(16, 185, 129, 0.4);
              }
              
              .btn-close {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                color: white;
              }
              
              .btn-close:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 15px rgba(239, 68, 68, 0.4);
              }
              
              .loading {
                display: none;
                text-align: center;
                padding: 20px;
                font-style: italic;
                color: #6b7280;
              }
              
              @media print {
                body {
                  background: white !important;
                }
                .container {
                  box-shadow: none !important;
                  border-radius: 0 !important;
                  margin: 0 !important;
                }
                .controls, .no-print {
                  display: none !important;
                }
                .header {
                  background: #1e40af !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              }
              
              @media (max-width: 768px) {
                .container {
                  margin: 10px;
                  border-radius: 12px;
                }
                .content {
                  padding: 20px;
                }
                .grid {
                  grid-template-columns: 1fr;
                  gap: 20px;
                }
                .controls {
                  position: static;
                  justify-content: center;
                  margin: 20px;
                }
              }
            </style>
          </head>
          <body>
            <div class="controls no-print">
              <button class="btn btn-print" onclick="handlePrint()">
                🖨️ 인쇄하기
              </button>
              <button class="btn btn-close" onclick="window.close()">
                ✕ 창 닫기
              </button>
            </div>
            
            <div class="container">
              <div class="header">
                <h1>청 구 서</h1>
                <div class="invoice-meta">
                  <div>청구서 번호: <strong>${invoice.id}</strong></div>
                  <div>작성일: <strong>${invoice.date}</strong></div>
                </div>
              </div>
              
              <div class="content">
                <div class="grid">
                  <div class="info-box">
                    <h4>🏢 발주자 정보</h4>
                    <p><strong>건축주명:</strong> ${invoice.client}</p>
                    <p><strong>프로젝트명:</strong> ${invoice.project}</p>
                    <p><strong>작업장 주소:</strong> ${invoice.workplaceAddress}</p>
                  </div>
                  
                  <div class="info-box">
                    <h4>🏗️ 시공업체 정보</h4>
                    <p style="font-weight: 700; font-size: 17px;">${companyInfo.name}</p>
                    <p>사업자등록번호: ${companyInfo.businessNumber}</p>
                    <p>대표자: ${companyInfo.representative}</p>
                    <p>주소: ${companyInfo.address}</p>
                    <p>연락처: ${companyInfo.phone}</p>
                    ${companyInfo.email ? `<p>이메일: ${companyInfo.email}</p>` : ''}
                  </div>
                </div>
                
                <div class="amount-highlight">
                  <p>총 청구금액 : 금 ${numberToKorean(invoice.amount)} 원정</p>
                </div>
                
                <div class="section">
                  <h3 class="section-title">📋 세부 작업 내역</h3>
                  <table class="work-table">
                    <thead>
                      <tr>
                        <th style="width: 50px;">연번</th>
                        <th>내용</th>
                        <th style="width: 100px;">규격</th>
                        <th style="width: 80px;">수량</th>
                        <th style="width: 60px;">단위</th>
                        <th style="width: 120px;">단가</th>
                        <th style="width: 120px;">공급가액</th>
                        <th style="width: 120px;">비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${invoice.workItems.map((item, index) => `
                        <tr>
                          <td style="text-align: center;">${index + 1}</td>
                          <td style="text-align: left;">
                            <strong>${item.name}</strong>
                            ${item.description ? `<div style="font-size: 11px; color: #6b7280; margin-top: 4px;">${item.description}</div>` : ''}
                          </td>
                          <td style="text-align: center;">${item.category || '-'}</td>
                          <td style="text-align: center;">${item.quantity}</td>
                          <td style="text-align: center;">식</td>
                          <td style="text-align: right;">${Math.floor(item.unitPrice / item.quantity).toLocaleString()}원</td>
                          <td style="text-align: right;">${item.unitPrice.toLocaleString()}원</td>
                          <td style="text-align: left;">${item.notes || '-'}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colspan="7" style="text-align: right; font-size: 16px;">합계:</td>
                        <td style="text-align: center; font-size: 16px; font-weight: 700;">
                          ${invoice.amount.toLocaleString()}원
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                ${companyInfo.bankAccount ? `
                <div class="section">
                  <h3 class="section-title">💳 결제 정보</h3>
                  <div class="info-box">
                    <p><strong>계좌정보:</strong> ${companyInfo.bankAccount}</p>
                    <p><strong>예금주:</strong> ${companyInfo.accountHolder}</p>
                  </div>
                </div>
                ` : ''}
                
                <div class="signature-section">
                  <p style="margin-bottom: 20px; font-size: 16px;">위와 같이 청구합니다.</p>
                  
                  <div class="signature-box">
                    <div class="signature-company">
                      ${companyInfo.name}
                    </div>
                    <div class="signature-representative">
                      <span>대표 : ${companyInfo.representative.split('').join(' ')}</span>
                      <div class="stamp-container">
                        <span>(인)</span>
                        ${stampImage ? `<img src="${stampImage}" alt="도장" />` : ''}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="footer-message">
                  <p>이 청구서에 대한 문의사항이 있으시면 연락 주시기 바랍니다.</p>
                  <p style="font-weight: 700; margin-top: 8px;">감사합니다.</p>
                </div>
              </div>
            </div>
            
            <div class="loading" id="loadingMessage">
              🖨️ 인쇄 준비 중...
            </div>
            
            <script>
              function handlePrint() {
                const loading = document.getElementById('loadingMessage');
                loading.style.display = 'block';
                
                // Hide loading after a short delay
                setTimeout(() => {
                  loading.style.display = 'none';
                }, 2000);
                
                // Trigger print
                window.print();
              }
              
              // Keyboard shortcuts
              document.addEventListener('keydown', function(e) {
                // Ctrl+P or Cmd+P for print
                if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                  e.preventDefault();
                  handlePrint();
                }
                
                // Escape to close
                if (e.key === 'Escape') {
                  if (confirm('창을 닫으시겠습니까?')) {
                    window.close();
                  }
                }
              });
              
              // Auto-focus for better keyboard navigation
              window.onload = function() {
                document.body.focus();
                console.log('청구서 PDF가 새 탭에서 성공적으로 열렸습니다.');
                console.log('키보드 단축키: Ctrl+P (인쇄), Esc (창 닫기)');
              };
            </script>
          </body>
        </html>
      `;

      // Write content to new window
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();

      console.log('청구서 PDF가 새 탭에서 성공적으로 열렸습니다:', invoice.id);

    } catch (error) {
      console.error('청구서 PDF 생성 중 오류 발생:', error);
      alert('청구서 PDF 생성 중 오류가 발생했습니다: ' + error.message);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">청구서 관리</h1>
          <p className="text-gray-600">작업 완료 후 청구서를 생성하고 관리하세요</p>
        </div>
        <div className="flex space-x-2">
          {selectedInvoices.length > 0 && (
            <button
              onClick={handleDeleteSelectedInvoices}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              🗑️ 선택 항목 삭제 ({selectedInvoices.length})
            </button>
          )}
          <button
            onClick={handleDownloadTemplate}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            📁 템플릿 다운로드
          </button>
          
          <label className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded cursor-pointer">
            📤 Excel 가져오기
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportFromExcel}
              className="hidden"
            />
          </label>
          
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

      {/* 상태 변경 방법 안내 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h4 className="text-md font-medium text-gray-800 mb-3">📝 청구서 상태 변경 방법</h4>
        <div className="bg-blue-50 p-4 rounded-lg">
          <ul className="text-sm text-gray-700 space-y-2">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span><strong>새 청구서:</strong> 생성 시 자동으로 '발송대기' 상태로 설정됩니다</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span><strong>상태 변경:</strong> 아래 청구서 목록의 '상태' 컬럼 드롭다운을 클릭하여 즉시 변경 가능</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span><strong>미수금 계산:</strong> '미결제', '발송됨', '발송대기' 상태는 미수금으로 계산됩니다</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 청구서 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                청구서 번호
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                건축주
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                프로젝트
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                금액
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                발행일
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.includes(invoice.id)}
                    onChange={(e) => handleSelectInvoice(invoice.id, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-base font-medium text-gray-900">{invoice.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-base text-gray-900">{invoice.client}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-base text-gray-900">{invoice.project}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-base font-medium text-gray-900">
                    {invoice.amount.toLocaleString()}원
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={invoice.status}
                    onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                    className={`text-sm leading-5 font-semibold rounded px-2 py-1 border-0 cursor-pointer ${
                      invoice.status === '결제완료' ? 'bg-green-100 text-green-800' :
                      invoice.status === '발송됨' ? 'bg-blue-100 text-blue-800' :
                      invoice.status === '미결제' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-base text-gray-900">{invoice.date}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-base font-medium">
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
                    🖨️ 출력
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
                            <label className="block text-xs font-medium text-gray-600 mb-1">내용 (직접입력)</label>
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
                              type="text"
                              placeholder="예: 1,000"
                              value={item.quantity ? formatNumberWithCommas(item.quantity) : ''}
                              onChange={(e) => updateWorkItem(index, 'quantity', e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">단가 (직접입력)</label>
                            <input
                              type="text"
                              placeholder="예: 1,000,000"
                              value={item.unitPrice ? formatNumberWithCommas(item.unitPrice) : ''}
                              onChange={(e) => updateWorkItem(index, 'unitPrice', e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                      <th className="border px-3 py-2 text-left">내용</th>
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
              <div style={{ marginBottom: '30px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start', 
                  marginBottom: '5px',
                  backgroundColor: '#f5f5f5',
                  padding: '4px 8px',
                  borderRadius: '2px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '14px', color: '#374151' }}>
                    <strong>청구서 번호:</strong> {printInvoice.id}
                  </div>
                  <div style={{ fontSize: '14px', color: '#374151' }}>
                    <strong>작성일:</strong> {printInvoice.date}
                  </div>
                </div>
                <div style={{ textAlign: 'center', borderBottom: '2px solid #6b7280', paddingBottom: '15px' }}>
                  <h1 style={{ fontSize: '32px', margin: '0', fontWeight: 'bold', color: '#374151', letterSpacing: '6px' }}>청   구   서</h1>
                </div>
              </div>

              {/* 수신자 및 발신자 정보 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
                {/* 건축주 정보 (왼쪽) */}
                <div>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: 'bold', color: '#1f2937', borderLeft: '4px solid #9ca3af', paddingLeft: '12px' }}>
                    발주자 정보
                  </h3>
                  <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px' }}>
                    <p style={{ margin: '8px 0', fontSize: '17px' }}><strong>건축주명:</strong> {printInvoice.client}</p>
                    <p style={{ margin: '8px 0', fontSize: '17px' }}><strong>프로젝트명:</strong> {printInvoice.project}</p>
                    <p style={{ margin: '8px 0', fontSize: '17px' }}><strong>작업장 주소:</strong> {printInvoice.workplaceAddress}</p>
                  </div>
                </div>
                
                {/* 업체 정보 (오른쪽) */}
                <div>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: 'bold', color: '#1f2937', borderLeft: '4px solid #9ca3af', paddingLeft: '12px' }}>
                    시공업체 정보
                  </h3>
                  <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px' }}>
                    <p style={{ margin: '8px 0', fontSize: '17px', fontWeight: 'bold' }}>{companyInfo.name}</p>
                    <p style={{ margin: '8px 0', fontSize: '15px' }}>사업자등록번호: {companyInfo.businessNumber}</p>
                    <p style={{ margin: '8px 0', fontSize: '15px' }}>대표자: {companyInfo.representative}</p>
                    <p style={{ margin: '8px 0', fontSize: '15px' }}>주소: {companyInfo.address}</p>
                    <p style={{ margin: '8px 0', fontSize: '15px' }}>연락처: {companyInfo.phone}</p>
                    {companyInfo.email && <p style={{ margin: '8px 0', fontSize: '15px' }}>이메일: {companyInfo.email}</p>}
                  </div>
                </div>
              </div>


              {/* 총 청구 금액 */}
              <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '6px', borderLeft: '3px solid #9ca3af', textAlign: 'left' }}>
                <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: '#374151' }}>
                  총 청구금액 : 금 {numberToKorean(printInvoice.amount)} 원정
                </p>
              </div>

              {/* 세부 작업 내역 */}
              <div style={{ marginBottom: '40px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold', color: '#1f2937', borderLeft: '4px solid #9ca3af', paddingLeft: '12px' }}>
                  세부 작업 내역
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f9fafb' }}>
                        <th style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 'bold', color: '#1f2937', width: '40px', fontSize: '18px' }}>
                          연번
                        </th>
                        <th style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 'bold', color: '#1f2937', fontSize: '18px' }}>
                          내용
                        </th>
                        <th style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 'bold', color: '#1f2937', fontSize: '18px' }}>
                          규격
                        </th>
                        <th style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 'bold', color: '#1f2937', fontSize: '18px' }}>
                          수량
                        </th>
                        <th style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 'bold', color: '#1f2937', fontSize: '18px' }}>
                          단위
                        </th>
                        <th style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 'bold', color: '#1f2937', fontSize: '18px' }}>
                          단가
                        </th>
                        <th style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 'bold', color: '#1f2937', fontSize: '18px' }}>
                          공급가액
                        </th>
                        <th style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 'bold', color: '#1f2937', fontSize: '18px' }}>
                          비고
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {printInvoice.workItems.map((item, index) => (
                        <tr key={index} style={{ ':hover': { backgroundColor: '#f1f5f9' } }}>
                          <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'center', fontSize: '17px' }}>{index + 1}</td>
                          <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'left', fontSize: '17px' }}>
                            <div>
                              <strong style={{ fontSize: '19px' }}>{item.name}</strong>
                              {item.description && (
                                <div style={{ fontSize: '19px', color: '#6b7280', marginTop: '4px' }}>
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'center', fontSize: '17px' }}>{item.category || '-'}</td>
                          <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'center', fontSize: '17px' }}>{item.quantity}</td>
                          <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'center', fontSize: '17px' }}>식</td>
                          <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'right', fontSize: '17px' }}>{Math.floor(item.unitPrice / item.quantity).toLocaleString()}원</td>
                          <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'right', fontSize: '17px' }}>{item.unitPrice.toLocaleString()}원</td>
                          <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'left', fontSize: '17px', verticalAlign: 'top' }}>
                            {item.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold', color: '#1f2937' }}>
                        <td colSpan="7" style={{ padding: '15px 16px', border: '1px solid #e5e7eb', textAlign: 'right', fontSize: '18px' }}>
                          합계:
                        </td>
                        <td style={{ padding: '15px 16px', border: '1px solid #e5e7eb', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                          {printInvoice.amount.toLocaleString()}원
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* 결제 정보 */}
              <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold', color: '#1f2937', borderLeft: '4px solid #9ca3af', paddingLeft: '12px' }}>
                  결제 정보
                </h3>
                <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                  {companyInfo.bankAccount && (
                    <>
                      <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>계좌정보:</strong></p>
                      <p style={{ margin: '3px 0', fontSize: '14px' }}>{companyInfo.bankAccount}</p>
                      <p style={{ margin: '3px 0', fontSize: '14px' }}>예금주: {companyInfo.accountHolder}</p>
                    </>
                  )}
                </div>
              </div>

              {/* 서명 영역 */}
              <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                <p style={{ margin: '0 0 15px 0', fontSize: '16px', lineHeight: '1.6' }}>위와 같이 청구합니다.</p>
                <div style={{ marginTop: '20px', textAlign: 'right', border: '1px solid #e5e7eb', padding: '15px', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                  <div style={{ textAlign: 'right', marginBottom: '10px' }}>
                    <p style={{ margin: '0', fontSize: '16px', fontWeight: 'bold' }}>
                      {companyInfo.name}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 'bold' }}>대표 : {companyInfo.representative.split('').join(' ')}</span>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <span style={{ fontSize: '16px', fontWeight: 'bold' }}>(인)</span>
                      {stampImage && (
                        <img 
                          src={stampImage} 
                          alt="도장" 
                          style={{ 
                            width: '60px', 
                            height: '60px', 
                            objectFit: 'contain',
                            border: 'none',
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)'
                          }} 
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 페이지 하단 - 문의사항 및 감사 인사 */}
              <div style={{ position: 'relative', marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #e5e7eb' }}>
                <div style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                  <p style={{ margin: '0 0 5px 0', lineHeight: '1.5' }}>이 청구서에 대한 문의사항이 있으시면 연락 주시기 바랍니다.</p>
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
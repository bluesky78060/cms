import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { exportToExcel, importFromExcel, createTemplate } from '../utils/excelUtils';
import { numberToKorean } from '../utils/numberToKorean';

function Estimates() {
  const { 
    clients, 
    estimates, 
    setEstimates, 
    convertEstimateToWorkItems,
    companyInfo,
    units,
    categories
  } = useApp();
  const navigate = useNavigate();
  const componentRef = useRef();
  
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState(null);
  const [printEstimate, setPrintEstimate] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [newEstimate, setNewEstimate] = useState({
    clientId: '',
    workplaceId: '',
    projectName: '',
    title: '',
    validUntil: '',
    category: '',
    status: '검토중',
    notes: '',
    items: [
      {
        category: '',
        name: '',
        description: '',
        quantity: 1,
        unit: '',
        unitPrice: 0,
        notes: ''
      }
    ]
  });
  const [noDueDate, setNoDueDate] = useState(false);

  // Custom calendar overlay state (for 유효기한)
  const calContainerRef = useRef(null);
  const calendarRef = useRef(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  // Initialize calendar month to current selected value
  useEffect(() => {
    if (newEstimate.validUntil) {
      const [y, m] = newEstimate.validUntil.split('-').map(Number);
      if (y && m) setCalendarMonth(new Date(y, m - 1, 1));
    }
  }, [newEstimate.validUntil]);

  // Close calendar when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (calContainerRef.current && !calContainerRef.current.contains(e.target)) {
        setCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const prevMonth = () => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const pad2 = (n) => String(n).padStart(2, '0');
  const pickDate = (day) => {
    if (!day) return;
    const y = calendarMonth.getFullYear();
    const m = calendarMonth.getMonth() + 1;
    const value = `${y}-${pad2(m)}-${pad2(day)}`;
    setNewEstimate((prev) => ({ ...prev, validUntil: value }));
    setCalendarOpen(false);
  };
  const renderCalendarRows = () => {
    const first = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const startDay = first.getDay();
    const days = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(d);
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows.map((row, idx) => (
      <tr key={idx} className="text-center">
        {row.map((d, i2) => {
          const weekend = i2 === 0 || i2 === 6;
          const color = i2 === 0 ? 'text-red-600' : i2 === 6 ? 'text-blue-600' : '';
          return (
            <td
              key={i2}
              className={`px-2 py-1 ${color} ${d ? 'cursor-pointer hover:bg-gray-100 rounded' : ''}`}
              onClick={() => pickDate(d)}
            >
              {d || ''}
            </td>
          );
        })}
      </tr>
    ));
  };

  // (removed) custom calendar overlay
  const statuses = ['검토중', '승인됨', '거부됨', '수정 요청', '작업 전환됨'];

  // Auto-reset printEstimate state to prevent UI issues
  useEffect(() => {
    if (printEstimate) {
      const timer = setTimeout(() => {
        setPrintEstimate(null);
        console.log('Auto-reset printEstimate state');
      }, 3000); // Reset after 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [printEstimate]);

  // 선택된 건축주의 작업장 목록
  const getClientWorkplaces = (clientId) => {
    const client = clients.find(c => c.id === parseInt(clientId));
    return client?.workplaces || [];
  };

  // 필터링된 견적서 목록
  const filteredEstimates = estimates.filter(estimate => {
    if (selectedClient && estimate.clientId !== parseInt(selectedClient)) return false;
    if (selectedStatus && estimate.status !== selectedStatus) return false;
    return true;
  });

  const allVisibleIds = filteredEstimates.map(e => e.id);
  const allSelected = selectedIds.length > 0 && selectedIds.length === allVisibleIds.length;
  const toggleSelectAll = (checked) => setSelectedIds(checked ? allVisibleIds : []);
  const toggleSelectOne = (id, checked) => setSelectedIds(prev => checked ? Array.from(new Set([...prev, id])) : prev.filter(x => x !== id));

  // 숫자 포맷팅 함수
  const formatNumberWithCommas = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    const newValue = name === 'clientId' || name === 'workplaceId' 
      ? parseInt(value) || 0 
      : value;
    
    setNewEstimate(prev => {
      const updated = {
        ...prev,
        [name]: newValue
      };
      
      // 건축주가 변경되면 작업장 선택 초기화
      if (name === 'clientId') {
        updated.workplaceId = '';
      }
      // 작업장 변경 시 프로젝트명 자동 채움(비어있을 때)
      if (name === 'workplaceId') {
        const client = clients.find(c => c.id === (typeof prev.clientId === 'string' ? parseInt(prev.clientId) : prev.clientId));
        const wp = client?.workplaces?.find(w => w.id === (typeof newValue === 'string' ? parseInt(newValue) : newValue));
        if (!updated.projectName && wp?.description) {
          updated.projectName = wp.description;
        }
      }
      
      return updated;
    });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...newEstimate.items];
    
    if (field === 'unitPrice' || field === 'quantity') {
      const numbersOnly = value.replace(/[^\d]/g, '');
      const numericValue = parseInt(numbersOnly) || (field === 'quantity' ? 1 : 0);
      updatedItems[index][field] = numericValue;
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unitPrice;
    } else {
      updatedItems[index][field] = value;
    }
    
    setNewEstimate(prev => ({ ...prev, items: updatedItems }));
  };

  const addItem = () => {
    setNewEstimate(prev => ({
      ...prev,
      items: [...prev.items, {
        category: '',
        name: '',
        description: '',
        quantity: 1,
        unit: '',
        unitPrice: 0,
        notes: ''
      }]
    }));
  };

  const removeItem = (index) => {
    if (newEstimate.items.length > 1) {
      setNewEstimate(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const calculateTotal = () => {
    return newEstimate.items.reduce((sum, item) => 
      sum + ((item.unitPrice || 0) * (item.quantity || 1)), 0
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const selectedClientData = clients.find(c => c.id === newEstimate.clientId);
    const selectedWorkplaceData = getClientWorkplaces(newEstimate.clientId).find(wp => wp.id === newEstimate.workplaceId);
    
    const estimateData = {
      ...newEstimate,
      id: editingEstimate ? editingEstimate.id : `EST-${new Date().getFullYear()}-${String(estimates.length + 1).padStart(3, '0')}`,
      clientName: selectedClientData?.name || '',
      workplaceName: selectedWorkplaceData?.name || '',
      workplaceAddress: selectedWorkplaceData?.address || '',
      date: editingEstimate ? editingEstimate.date : new Date().toISOString().split('T')[0],
      totalAmount: calculateTotal(),
      items: newEstimate.items.map((item, index) => ({
        ...item,
        id: index + 1,
        total: (item.unitPrice || 0) * (item.quantity || 1)
      }))
    };
    
    if (editingEstimate) {
      setEstimates(prev => prev.map(est => 
        est.id === editingEstimate.id ? estimateData : est
      ));
    } else {
      setEstimates(prev => [...prev, estimateData]);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setNewEstimate({
      clientId: '',
      workplaceId: '',
      projectName: '',
      title: '',
      validUntil: '',
      category: '',
      status: '검토중',
      notes: '',
      items: [
        {
          category: '',
          name: '',
          description: '',
          quantity: 1,
          unit: '',
          unitPrice: 0,
          notes: ''
        }
      ]
    });
    setEditingEstimate(null);
    setShowModal(false);
    setNoDueDate(false);
  };

  const handleEdit = (estimate) => {
    setNewEstimate({
      clientId: estimate.clientId,
      workplaceId: estimate.workplaceId || '',
      projectName: estimate.projectName,
      title: estimate.title,
      validUntil: estimate.validUntil,
      category: estimate.category || '',
      status: estimate.status,
      notes: estimate.notes || '',
      items: estimate.items.map(item => ({
        category: item.category,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        notes: item.notes || ''
      }))
    });
    setEditingEstimate(estimate);
    setShowModal(true);
    setNoDueDate(!estimate.validUntil);
  };

  const handleDelete = (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      setEstimates(prev => prev.filter(estimate => estimate.id !== id));
    }
  };
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setEstimates(prev => prev.filter(est => !selectedIds.includes(est.id)));
    setSelectedIds([]);
    setShowConfirmDelete(false);
  };

  const handleConvertToWorkItems = (estimateId) => {
    if (window.confirm('이 견적서를 작업 항목으로 변환하시겠습니까?')) {
      const convertedItems = convertEstimateToWorkItems(estimateId);
      alert(`${convertedItems.length}개의 작업 항목이 생성되었습니다.`);
      navigate('/work-items');
    }
  };

  const handlePrint = (estimate) => {
    // Set printEstimate
    setPrintEstimate(estimate);
    
    // Execute after waiting for state update
    setTimeout(() => {
      console.log('견적서 PDF 새 탭에서 열기:', estimate.id);
      
      // Get the print content
      const printContent = componentRef.current;
      if (!printContent) {
        console.error('인쇄 콘텐츠를 찾을 수 없습니다');
        alert('인쇄 콘텐츠를 준비하는 중입니다. 잠시 후 다시 시도해주세요.');
        return;
      }
      
      // Create new window for printing with better specifications
      const printWindow = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
      if (!printWindow) {
        alert('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.');
        return;
      }
      
      // Write comprehensive HTML content to new window
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ko">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>견적서 - ${estimate.id}</title>
            <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">
            <style>
              * { box-sizing: border-box; }
              body { 
                margin: 0; 
                padding: 20px; 
                font-family: 'Noto Sans KR', sans-serif; 
                background: white;
                line-height: 1.4;
              }
              @media print { 
                body { margin: 0; padding: 15px; }
                .no-print { display: none; }
              }
              .toolbar { position: fixed; top: 10px; right: 10px; z-index: 1000; display: flex; gap: 10px; }
              .print-header {
                background: #3498db;
                color: white;
                padding: 10px 15px;
                border-radius: 5px;
                font-size: 14px;
                cursor: pointer;
              }
              .print-header:hover {
                background: #2980b9;
              }
              .close-header {
                background: #e11d48; /* rose-600 */
                color: white;
                padding: 10px 15px;
                border-radius: 5px;
                font-size: 14px;
                cursor: pointer;
              }
              .close-header:hover {
                background: #be123c; /* rose-700 */
              }
              @media print {
                .toolbar { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="toolbar no-print">
              <div class="close-header" onclick="window.close()">✕ 닫기</div>
              <div class="print-header" onclick="window.print()">🖨️ 인쇄하기 (Ctrl+P)</div>
            </div>
            ${printContent.innerHTML}
            <script>
              // 페이지 로드 완료 후 포커스
              window.onload = function() {
                window.focus();
                console.log('견적서 PDF 준비 완료');
              };
              
              // 키보드 단축키 지원
              document.addEventListener('keydown', function(e) {
                if (e.ctrlKey && e.key === 'p') {
                  e.preventDefault();
                  window.print();
                }
              });
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // 로딩 완료 후 포커스 및 사용자 알림
      setTimeout(() => {
        try {
          printWindow.focus();
          console.log('견적서 새 탭에서 열기 완료');
          
          // 사용자에게 알림 (선택사항)
          // alert('견적서가 새 탭에서 열렸습니다. 인쇄하려면 Ctrl+P를 누르세요.');
        } catch (error) {
          console.error('새 탭 열기 오류:', error);
          alert('새 탭에서 견적서를 여는 중 오류가 발생했습니다.');
        }
      }, 300);
      
    }, 100);
  };

  // 엑셀 내보내기
  const handleExportToExcel = () => {
    exportToExcel.estimates(estimates);
  };

  // 엑셀에서 가져오기
  const handleImportFromExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const importedEstimates = await importFromExcel.estimates(file);
      setEstimates(prev => [...prev, ...importedEstimates]);
      alert(`${importedEstimates.length}개의 견적서를 성공적으로 가져왔습니다.`);
    } catch (error) {
      alert('파일을 가져오는 중 오류가 발생했습니다.');
      console.error('Import error:', error);
    }
    
    e.target.value = '';
  };

  // 템플릿 다운로드
  const handleDownloadTemplate = () => {
    createTemplate.estimates();
  };

  // 상세 견적서 엑셀 내보내기
  // eslint-disable-next-line no-unused-vars
  const handleExportEstimateDetail = (estimate) => {
    const detailData = {
      ...estimate,
      workItems: estimate.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
        category: item.category,
        description: item.description,
        notes: item.notes
      }))
    };
    exportToExcel.estimateDetail(detailData);
  };

  const getStatusColor = (status) => {
    const colors = {
      '검토중': 'bg-yellow-100 text-yellow-800',
      '승인됨': 'bg-green-100 text-green-800',
      '거부됨': 'bg-red-100 text-red-800',
      '수정 요청': 'bg-blue-100 text-blue-800',
      '작업 전환됨': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">견적서 관리</h1>
            <p className="text-gray-600">건축주별 견적서를 관리하고 작업 항목으로 변환하세요</p>
          </div>
          <div className="flex space-x-2">
            {/* Excel 관련 버튼들 */}
            <button
              onClick={handleDownloadTemplate}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              📁 템플릿 다운로드
            </button>
            
            <button
              onClick={handleExportToExcel}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              📥 Excel 내보내기
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
              onClick={() => setShowModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              + 새 견적서
            </button>
          </div>
        </div>
        
        {/* 필터 */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-4 flex-wrap">
            <label className="text-sm font-medium text-gray-700">필터:</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              style={{ fontSize: '15px' }}
            >
              <option value="">전체 건축주</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              style={{ fontSize: '15px' }}
            >
              <option value="">전체 상태</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            
            <div className="text-sm text-gray-500">
              {(selectedClient || selectedStatus) ? 
                `${filteredEstimates.length}개 견적서` : 
                `총 ${estimates.length}개 견적서`
              }
            </div>
            
            {(selectedClient || selectedStatus) && (
              <button
                onClick={() => {
                  setSelectedClient('');
                  setSelectedStatus('');
                }}
                className="text-xs text-green-600 hover:text-green-800"
              >
                필터 초기화
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">총 견적서</p>
              <p className="text-xl font-bold text-gray-900">{filteredEstimates.length}</p>
            </div>
            <div className="bg-green-500 rounded-full p-3 text-white text-2xl">
              📈
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">승인된 견적서</p>
              <p className="text-xl font-bold text-green-600">
                {filteredEstimates.filter(est => est.status === '승인됨').length}
              </p>
            </div>
            <div className="bg-green-500 rounded-full p-3 text-white text-2xl">
              ✅
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">검토 중인 견적서</p>
              <p className="text-xl font-bold text-yellow-600">
                {filteredEstimates.filter(est => est.status === '검토중').length}
              </p>
            </div>
            <div className="bg-yellow-500 rounded-full p-3 text-white text-2xl">
              ⏳
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">총 견적 금액</p>
              <p className="text-xl font-bold text-blue-600">
                {filteredEstimates.reduce((sum, est) => sum + est.totalAmount, 0).toLocaleString()}원
              </p>
            </div>
            <div className="bg-blue-500 rounded-full p-3 text-white text-2xl">
              💰
            </div>
          </div>
        </div>
      </div>

      {/* 견적서 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
          <div className="text-sm text-gray-600">선택됨: {selectedIds.length}개</div>
          {selectedIds.length > 0 && (
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="text-white text-sm font-medium px-3 py-1 rounded bg-red-600 hover:bg-red-700"
            >
              🗑️ 선택 삭제({selectedIds.length})
            </button>
          )}
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={allSelected}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  title="전체 선택"
                />
              </th>
              <th className="px-6 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
                견적서 번호
              </th>
              <th className="px-6 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
                건축주
              </th>
              <th className="px-6 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
                프로젝트
              </th>
              <th className="px-6 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
                작업장
              </th>
              <th className="px-6 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
                견적 금액
              </th>
              <th className="px-6 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
                유효기한
              </th>
              <th className="px-6 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEstimates.map((estimate) => (
              <tr key={estimate.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={selectedIds.includes(estimate.id)}
                    onChange={(e) => toggleSelectOne(estimate.id, e.target.checked)}
                    title="항목 선택"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{estimate.id}</div>
                  <div className="text-sm text-gray-500">{estimate.date}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700">
                        {estimate.clientName.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{estimate.clientName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{estimate.projectName}</div>
                  <div className="text-sm text-gray-500">{estimate.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{estimate.workplaceName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {estimate.totalAmount.toLocaleString()}원
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(estimate.status)}`}>
                    {estimate.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{estimate.validUntil}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => handleEdit(estimate)}
                    className="text-blue-600 hover:text-blue-900 mr-2"
                  >
                    편집
                  </button>
                  <button 
                    onClick={() => handlePrint(estimate)}
                    className="text-green-600 hover:text-green-900 mr-2"
                  >
                    🖨️ 출력
                  </button>
                  <button 
                    onClick={() => handleDelete(estimate.id)}
                    className="text-red-600 hover:text-red-900 mr-2"
                  >
                    삭제
                  </button>
                  {estimate.status === '승인됨' && (
                    <button 
                      onClick={() => handleConvertToWorkItems(estimate.id)}
                      className="text-purple-600 hover:text-purple-900"
                    >
                      작업 변환
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">선택 삭제</h3>
            <p className="text-sm text-gray-600 mb-4">선택된 {selectedIds.length}개의 견적서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setShowConfirmDelete(false)}>취소</button>
              <button className="btn-primary bg-red-600 hover:bg-red-700" onClick={handleBulkDelete}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* 견적서 추가/편집 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-5 mx-auto p-5 border w-4/5 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingEstimate ? '견적서 편집' : '새 견적서 작성'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* 기본 정보 */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-gray-800 mb-3">기본 정보</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">건축주</label>
                      <select
                        name="clientId"
                        value={newEstimate.clientId}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      >
                        <option value="">건축주 선택</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>{client.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">작업장</label>
                      <select
                        name="workplaceId"
                        value={newEstimate.workplaceId}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                        disabled={!newEstimate.clientId}
                      >
                        <option value="">작업장 선택</option>
                        {newEstimate.clientId && getClientWorkplaces(newEstimate.clientId).map(workplace => (
                          <option key={workplace.id} value={workplace.id}>
                            {workplace.name} - {workplace.address}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">프로젝트명</label>
                      <input
                        type="text"
                        name="projectName"
                        value={newEstimate.projectName}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">견적서 제목</label>
                      <input
                        type="text"
                        name="title"
                        value={newEstimate.title}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">유효기한</label>
                      <div className="mt-1 relative inline-block" ref={calContainerRef}>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            name="validUntil"
                            value={newEstimate.validUntil}
                            onChange={handleInputChange}
                            placeholder="YYYY-MM-DD"
                            inputMode="numeric"
                            className="block w-full border border-gray-300 rounded-md px-3 py-2"
                            onFocus={() => !noDueDate && setCalendarOpen(true)}
                            disabled={noDueDate}
                            required={!noDueDate}
                          />
                          <button
                            type="button"
                            className="px-2 py-2 text-gray-600 hover:text-gray-800"
                            onClick={() => !noDueDate && setCalendarOpen((v) => !v)}
                            title="달력 열기"
                            disabled={noDueDate}
                          >
                            📅
                          </button>
                          <label className="flex items-center gap-1 text-xs text-gray-600 select-none">
                            <input
                              type="checkbox"
                              checked={noDueDate}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setNoDueDate(checked);
                                if (checked) {
                                  setCalendarOpen(false);
                                  setNewEstimate(prev => ({ ...prev, validUntil: '' }));
                                }
                              }}
                            />
                            유효기간 선택 안함
                          </label>
                        </div>
                        {calendarOpen && (
                          <div
                            ref={calendarRef}
                            className="absolute z-50 bg-white border border-gray-300 rounded-md shadow-lg mt-2 p-3"
                            style={{ transform: 'scale(2)', transformOrigin: 'top left' }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <button type="button" className="px-2 py-1 text-sm border rounded" onClick={prevMonth}>◀</button>
                              <div className="text-sm font-medium">
                                {calendarMonth.getFullYear()}년 {calendarMonth.getMonth() + 1}월
                              </div>
                              <button type="button" className="px-2 py-1 text-sm border rounded" onClick={nextMonth}>▶</button>
                            </div>
                            <table className="text-xs select-none">
                              <thead>
                                <tr className="text-center text-gray-600">
                                  {['일','월','화','수','목','금','토'].map((d, idx) => (
                                    <th key={d} className={`px-2 py-1 ${idx === 0 ? 'text-red-600' : idx === 6 ? 'text-blue-600' : ''}`}>{d}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {renderCalendarRows()}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">상태</label>
                      <select
                        name="status"
                        value={newEstimate.status}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        {statuses.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 견적 항목들 */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-md font-medium text-gray-800">견적 항목</h4>
                    <button
                      type="button"
                      onClick={addItem}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      + 항목 추가
                    </button>
                  </div>
                  
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {newEstimate.items.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-medium text-gray-700">항목 #{index + 1}</span>
                          {newEstimate.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">카테고리</label>
                            <select
                              value={item.category}
                              onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              required
                            >
                              <option value="">카테고리 선택</option>
                              {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">내용</label>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">설명</label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">단가</label>
                            <input
                              type="text"
                              value={item.unitPrice ? formatNumberWithCommas(item.unitPrice) : ''}
                              onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                              placeholder="0"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">수량</label>
                            <input
                              type="text"
                              value={item.quantity || ''}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              placeholder="1"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">단위</label>
                            <select
                              value={item.unit}
                              onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              required
                            >
                              <option value="">단위 선택</option>
                              {units.map(u => (
                                <option key={u} value={u}>{u}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">합계</label>
                            <div className="w-full bg-gray-100 border border-gray-300 rounded px-2 py-1 text-sm">
                              {((item.unitPrice || 0) * (item.quantity || 1)).toLocaleString()}원
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">비고</label>
                          <textarea
                            value={item.notes}
                            onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                            rows="2"
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 bg-gray-100 rounded">
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900">
                        총 견적 금액: {calculateTotal().toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">특이사항 및 조건</label>
                  <textarea
                    name="notes"
                    value={newEstimate.notes}
                    onChange={handleInputChange}
                    rows="3"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="부가세 별도, 설계 변경 시 추가 견적 등..."
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                  >
                    {editingEstimate ? '수정' : '작성'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PDF 인쇄용 숨겨진 컴포넌트 */}
      <div style={{ display: 'none' }}>
        <div ref={componentRef} style={{ padding: '40px', fontFamily: "'Noto Sans KR', sans-serif", fontSize: '12px', lineHeight: '1.4', maxWidth: '800px', margin: 'auto', backgroundColor: '#ffffff', color: '#374151' }}>
          {printEstimate && (
            <>
              {/* 견적서 번호 및 제목 */}
              <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div style={{ fontSize: '14px', color: '#374151' }}>
                    <strong>견적서 번호:</strong> {printEstimate.id}
                  </div>
                  <div style={{ fontSize: '14px', color: '#374151' }}>
                    <strong>작성일:</strong> {printEstimate.date}
                  </div>
                </div>
                <div style={{ textAlign: 'center', borderBottom: '3px solid #1f2937', paddingBottom: '20px' }}>
                  <h1 style={{ fontSize: '36px', margin: '0', fontWeight: 'bold', color: '#1f2937', letterSpacing: '8px' }}>견   적   서</h1>
                </div>
              </div>

              {/* 고객 정보 및 업체 정보 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                {/* 고객 정보 (왼쪽) */}
                <div>
                  <div style={{ border: '2px solid #374151', padding: '20px', borderRadius: '8px', minWidth: '300px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#1f2937', borderBottom: '1px solid #d1d5db', paddingBottom: '8px' }}>발주처 정보</h3>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>건축주명:</strong> {printEstimate.clientName}</p>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>프로젝트명:</strong> {printEstimate.projectName}</p>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>작업장 주소:</strong> {printEstimate.workplaceAddress}</p>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>유효기한:</strong> {printEstimate.validUntil}</p>
                  </div>
                </div>
                
                {/* 업체 정보 (오른쪽) */}
                <div>
                  <div style={{ border: '2px solid #374151', padding: '20px', borderRadius: '8px', minWidth: '300px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#1f2937', borderBottom: '1px solid #d1d5db', paddingBottom: '8px' }}>시공업체 정보</h3>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>업체명:</strong> {companyInfo.name}</p>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>대표자:</strong> {companyInfo.representative}</p>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>연락처:</strong> {companyInfo.phone}</p>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>주소:</strong> {companyInfo.address}</p>
                    {companyInfo.businessNumber && <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>사업자번호:</strong> {companyInfo.businessNumber}</p>}
                  </div>
                </div>
              </div>

              {/* 총 견적금액 (한글) */}
              <div style={{ textAlign: 'left', marginBottom: '30px', padding: '15px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '0', color: '#1f2937' }}>
                  총 견적금액 : 금 {numberToKorean(printEstimate.totalAmount)} 원정
                </p>
              </div>

              {/* 세부 작업 내역 */}
              <div style={{ marginBottom: '40px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#1f2937', borderBottom: '2px solid #374151', paddingBottom: '8px' }}>세부 견적 내역</h3>
                <div style={{ border: '2px solid #374151', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#374151', color: 'white' }}>
                        <th style={{ padding: '12px 8px', border: '1px solid #6b7280', textAlign: 'center', fontWeight: 'bold', width: '50px' }}>순번</th>
                        <th style={{ padding: '12px 16px', border: '1px solid #6b7280', textAlign: 'center', fontWeight: 'bold', width: '120px' }}>구분</th>
                        <th style={{ padding: '12px 16px', border: '1px solid #6b7280', textAlign: 'center', fontWeight: 'bold', width: '250px' }}>공종 및 내용</th>
                        <th style={{ padding: '12px 16px', border: '1px solid #6b7280', textAlign: 'center', fontWeight: 'bold', width: '80px' }}>수량</th>
                        <th style={{ padding: '12px 16px', border: '1px solid #6b7280', textAlign: 'center', fontWeight: 'bold', width: '80px' }}>단위</th>
                        <th style={{ padding: '12px 16px', border: '1px solid #6b7280', textAlign: 'center', fontWeight: 'bold', width: '100px' }}>
                          단가<br/>
                          <span style={{ fontSize: '10px', fontWeight: 'normal' }}>(천원)</span>
                        </th>
                        <th style={{ padding: '12px 16px', border: '1px solid #6b7280', textAlign: 'center', fontWeight: 'bold', width: '100px' }}>
                          금액<br/>
                          <span style={{ fontSize: '10px', fontWeight: 'normal' }}>(천원)</span>
                        </th>
                        <th style={{ padding: '12px 12px', border: '1px solid #6b7280', textAlign: 'center', fontWeight: 'bold', width: '120px' }}>비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printEstimate.items.map((item, index) => (
                        <tr key={index} style={{ ':hover': { backgroundColor: '#f1f5f9' } }}>
                          <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'center' }}>{index + 1}</td>
                          <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'center' }}>{item.category}</td>
                          <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb' }}>
                            <div>
                              <strong>{item.name}</strong>
                              {item.description && (
                                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', fontStyle: 'italic' }}>
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'center' }}>{item.quantity}</td>
                          <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'center' }}>{item.unit}</td>
                          <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'right' }}>{Math.floor(item.unitPrice / 1000).toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb', textAlign: 'right', fontWeight: 'bold' }}>{Math.floor((item.quantity * item.unitPrice) / 1000).toLocaleString()}</td>
                          <td style={{ padding: '12px 12px', border: '1px solid #e5e7eb', fontSize: '11px', color: '#374151' }}>
                            {item.notes || ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ backgroundColor: '#f8fafc', fontWeight: 'bold', fontSize: '14px' }}>
                        <td colSpan="8" style={{ padding: '16px', border: '1px solid #e5e7eb', textAlign: 'right', fontSize: '16px', fontWeight: 'bold', color: '#374151', backgroundColor: '#f3f4f6' }}>
                          총 견적금액: {printEstimate.totalAmount.toLocaleString()}원
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* 특이사항 및 조건 */}
              {printEstimate.notes && (
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#1f2937', borderBottom: '2px solid #374151', paddingBottom: '8px' }}>특이사항 및 조건</h3>
                  <div style={{ border: '1px solid #d1d5db', padding: '16px', borderRadius: '8px', backgroundColor: '#fefce8' }}>
                    <p style={{ margin: '0', fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-line', color: '#374151' }}>{printEstimate.notes}</p>
                  </div>
                </div>
              )}

              {/* 하단 서명 영역 */}
              <div style={{ marginTop: '50px', borderTop: '1px solid #d1d5db', paddingTop: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ textAlign: 'center', minWidth: '200px' }}>
                    <div style={{ borderBottom: '1px solid #374151', marginBottom: '8px', paddingBottom: '40px' }}></div>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '0', color: '#374151' }}>발주처 확인</p>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: '200px' }}>
                    <div style={{ borderBottom: '1px solid #374151', marginBottom: '8px', paddingBottom: '40px' }}></div>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '0', color: '#374151' }}>시공업체 ({companyInfo.name})</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Estimates;

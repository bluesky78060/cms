import React, { useState, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { exportToExcel, importFromExcel, createTemplate } from '../utils/excelUtils';

function WorkItems() {
  const { clients, workItems, setWorkItems, invoices, setInvoices, getCompletedWorkItemsByClient, addWorkItemToInvoice } = useApp();
  const navigate = useNavigate();
  

  const [selectedClient, setSelectedClient] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);

  const fileInputRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({
    clientId: '',
    workplaceId: '',
    name: '',
    category: '',
    defaultPrice: 0,
    unit: '',
    description: '',
    projectName: '',
    status: '예정',
    notes: ''
  });

  // 일괄 입력용 상태
  const [bulkItems, setBulkItems] = useState([
    {
      name: '',
      category: '',
      defaultPrice: 0,
      unit: '',
      description: '',
      status: '예정',
      notes: ''
    }
  ]);

  const [bulkBaseInfo, setBulkBaseInfo] = useState({
    clientId: '',
    workplaceId: '',
    projectName: ''
  });

  const categories = ['토목공사', '구조공사', '철거공사', '마감공사', '설비공사', '내부공사', '기타'];
  const statuses = ['예정', '진행중', '완료', '보류'];

  // 선택된 건축주의 프로젝트 목록 가져오기
  const getClientProjects = (clientId) => {
    if (!clientId) return [];
    const clientWorkItems = workItems.filter(item => item.clientId === parseInt(clientId));
    const projects = [...new Set(clientWorkItems.map(item => item.projectName).filter(p => p))];
    return projects;
  };

  // 필터링된 작업 항목
  const filteredWorkItems = workItems.filter(item => {
    if (selectedClient && item.clientId !== parseInt(selectedClient)) return false;
    if (selectedProject && item.projectName !== selectedProject) return false;
    return true;
  });

  // 선택된 건축주의 작업장 목록
  const getClientWorkplaces = (clientId) => {
    const client = clients.find(c => c.id === parseInt(clientId));
    return client?.workplaces || [];
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newValue = name === 'defaultPrice' || name === 'clientId' || name === 'workplaceId' 
      ? parseInt(value) || 0 
      : value;
    
    setNewItem(prev => {
      const updated = {
        ...prev,
        [name]: newValue
      };
      
      // 건축주가 변경되면 작업장 선택 초기화
      if (name === 'clientId') {
        updated.workplaceId = '';
      }
      
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const selectedClientData = clients.find(c => c.id === newItem.clientId);
    
    if (editingItem) {
      // 수정
      const selectedWorkplaceData = getClientWorkplaces(newItem.clientId).find(wp => wp.id === newItem.workplaceId);
      setWorkItems(prev => prev.map(item => 
        item.id === editingItem.id 
          ? { 
              ...item, 
              ...newItem,
              clientName: selectedClientData?.name || item.clientName,
              workplaceName: selectedWorkplaceData?.name || item.workplaceName
            }
          : item
      ));
    } else {
      // 새 항목 추가
      const selectedWorkplaceData = getClientWorkplaces(newItem.clientId).find(wp => wp.id === newItem.workplaceId);
      const item = {
        ...newItem,
        id: Math.max(...workItems.map(i => i.id)) + 1,
        clientName: selectedClientData?.name || '',
        workplaceName: selectedWorkplaceData?.name || '',
        date: new Date().toISOString().split('T')[0]
      };
      setWorkItems(prev => [...prev, item]);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setNewItem({
      clientId: '',
      workplaceId: '',
      name: '',
      category: '',
      defaultPrice: 0,
      unit: '',
      description: '',
      projectName: '',
      status: '예정',
      notes: ''
    });
    setEditingItem(null);
    setShowModal(false);
  };

  // 일괄 입력 관련 함수들
  const handleBulkBaseInfoChange = (e) => {
    const { name, value } = e.target;
    setBulkBaseInfo(prev => ({
      ...prev,
      [name]: name === 'clientId' || name === 'workplaceId' ? parseInt(value) || '' : value
    }));
    
    if (name === 'clientId') {
      setBulkBaseInfo(prev => ({ ...prev, workplaceId: '' }));
    }
  };

  const handleBulkItemChange = (index, field, value) => {
    const updatedItems = [...bulkItems];
    updatedItems[index][field] = field === 'defaultPrice' ? parseInt(value) || 0 : value;
    setBulkItems(updatedItems);
  };

  const addBulkItem = () => {
    setBulkItems(prev => [...prev, {
      name: '',
      category: '',
      defaultPrice: 0,
      unit: '',
      description: '',
      status: '예정',
      notes: ''
    }]);
  };

  const removeBulkItem = (index) => {
    if (bulkItems.length > 1) {
      setBulkItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleBulkSubmit = (e) => {
    e.preventDefault();
    
    const selectedClientData = clients.find(c => c.id === bulkBaseInfo.clientId);
    const selectedWorkplaceData = getClientWorkplaces(bulkBaseInfo.clientId).find(wp => wp.id === bulkBaseInfo.workplaceId);
    
    const newItems = bulkItems.map((item, index) => ({
      ...item,
      id: Math.max(...workItems.map(i => i.id)) + index + 1,
      clientId: bulkBaseInfo.clientId,
      clientName: selectedClientData?.name || '',
      workplaceId: bulkBaseInfo.workplaceId,
      workplaceName: selectedWorkplaceData?.name || '',
      projectName: bulkBaseInfo.projectName,
      date: new Date().toISOString().split('T')[0]
    }));
    
    setWorkItems(prev => [...prev, ...newItems]);
    
    // 폼 초기화
    setBulkItems([{
      name: '',
      category: '',
      defaultPrice: 0,
      unit: '',
      description: '',
      status: '예정',
      notes: ''
    }]);
    setBulkBaseInfo({
      clientId: '',
      workplaceId: '',
      projectName: ''
    });
    setShowBulkModal(false);
    
    alert(`${newItems.length}개의 작업 항목이 추가되었습니다.`);
  };

  const handleEdit = (item) => {
    setNewItem({
      clientId: item.clientId,
      workplaceId: item.workplaceId || '',
      name: item.name,
      category: item.category,
      defaultPrice: item.defaultPrice,
      unit: item.unit,
      description: item.description,
      projectName: item.projectName,
      status: item.status,
      notes: item.notes || ''
    });
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      setWorkItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // 체크박스 선택 관리
  const handleItemSelect = (itemId, checked) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const completedItems = filteredWorkItems.filter(item => item.status === '완료');
      setSelectedItems(completedItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  // 선택된 항목들로 청구서 생성
  const handleCreateBulkInvoice = () => {
    if (selectedItems.length === 0) {
      alert('청구서에 포함할 작업 항목을 선택해주세요.');
      return;
    }

    // 선택된 작업 항목들 가져오기
    const selectedWorkItems = workItems.filter(item => selectedItems.includes(item.id));
    
    // 완료된 항목만 필터링
    const completedSelectedItems = selectedWorkItems.filter(item => item.status === '완료');
    
    if (completedSelectedItems.length === 0) {
      alert('완료된 작업 항목만 청구서에 포함할 수 있습니다.');
      return;
    }

    // 같은 건축주인지 확인
    const firstClientId = completedSelectedItems[0].clientId;
    const sameClient = completedSelectedItems.every(item => item.clientId === firstClientId);
    
    if (!sameClient) {
      alert('같은 건축주의 작업 항목만 하나의 청구서로 생성할 수 있습니다.');
      return;
    }

    // 이미 청구서에 포함된 항목 확인
    const unbilledItems = completedSelectedItems.filter(item => {
      return !invoices.some(invoice => 
        invoice.workItems.some(workItemInInvoice => 
          workItemInInvoice.name === item.name && 
          invoice.client === item.clientName
        )
      );
    });

    if (unbilledItems.length === 0) {
      alert('선택된 항목들이 이미 청구서에 포함되어 있습니다.');
      return;
    }

    // 작업장 정보 가져오기 (첫 번째 항목 기준)
    const firstItem = unbilledItems[0];
    const client = clients.find(c => c.id === firstItem.clientId);
    const workplace = client?.workplaces.find(w => w.id === firstItem.workplaceId);

    // 새로운 청구서 생성
    const newInvoiceId = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
    const workItemsForInvoice = unbilledItems.map(item => ({
      name: item.name,
      quantity: 1,
      unitPrice: item.defaultPrice,
      total: item.defaultPrice,
      description: item.description,
      category: item.category,
      notes: item.notes || ''
    }));
    const totalAmount = workItemsForInvoice.reduce((sum, item) => sum + item.total, 0);

    const newInvoice = {
      id: newInvoiceId,
      client: firstItem.clientName,
      project: firstItem.projectName,
      workplaceAddress: workplace?.address || '',
      amount: totalAmount,
      status: '발송대기',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      workItems: workItemsForInvoice
    };

    // 청구서 추가
    setInvoices(prev => [...prev, newInvoice]);
    
    // 선택 항목 초기화
    setSelectedItems([]);

    // 성공 메시지와 함께 청구서 관리 페이지로 이동
    alert(`청구서 ${newInvoiceId}가 생성되었습니다! (${unbilledItems.length}개 항목 포함)`);
    navigate('/invoices');
  };

  // 개별 청구서 생성 함수 (기존 유지)
  const handleCreateInvoice = (workItem) => {
    // 해당 건축주의 완료된 작업 항목들을 가져옴
    const completedItems = getCompletedWorkItemsByClient(workItem.clientId);
    
    // 아직 청구서에 포함되지 않은 완료된 작업 항목들만 필터링
    const unbilledItems = completedItems.filter(item => {
      // 기존 청구서들을 확인해서 이미 청구된 작업인지 체크
      return !invoices.some(invoice => 
        invoice.workItems.some(workItemInInvoice => 
          workItemInInvoice.name === item.name && 
          invoice.client === item.clientName
        )
      );
    });

    if (unbilledItems.length === 0) {
      alert('청구 가능한 완료된 작업 항목이 없습니다.');
      return;
    }

    // 작업장 정보 가져오기
    const client = clients.find(c => c.id === workItem.clientId);
    const workplace = client?.workplaces.find(w => w.id === workItem.workplaceId);

    // 새로운 청구서 생성
    const newInvoiceId = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
    const workItemsForInvoice = unbilledItems.map(item => addWorkItemToInvoice(item));
    const totalAmount = workItemsForInvoice.reduce((sum, item) => sum + item.total, 0);

    const newInvoice = {
      id: newInvoiceId,
      client: workItem.clientName,
      project: workItem.projectName,
      workplaceAddress: workplace?.address || '',
      amount: totalAmount,
      status: '발송대기',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14일 후
      workItems: workItemsForInvoice
    };

    // 청구서 추가
    setInvoices(prev => [...prev, newInvoice]);

    // 성공 메시지와 함께 청구서 관리 페이지로 이동
    alert(`청구서 ${newInvoiceId}가 생성되었습니다! 청구서 관리 페이지로 이동합니다.`);
    navigate('/invoices');
  };

  // Excel 관련 함수들
  const handleExportToExcel = () => {
    exportToExcel.workItems(filteredWorkItems);
  };

  const handleImportFromExcel = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const importedWorkItems = await importFromExcel.workItems(file);
        setWorkItems(prev => [...prev, ...importedWorkItems]);
        alert(`${importedWorkItems.length}개의 작업 항목을 가져왔습니다.`);
      } catch (error) {
        alert('Excel 파일을 가져오는 중 오류가 발생했습니다: ' + error.message);
      }
      e.target.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    createTemplate.workItems();
  };

  const getCategoryColor = (category) => {
    const colors = {
      '토목공사': 'bg-brown-100 text-brown-800',
      '구조공사': 'bg-gray-100 text-gray-800',
      '철거공사': 'bg-red-100 text-red-800',
      '마감공사': 'bg-blue-100 text-blue-800',
      '설비공사': 'bg-yellow-100 text-yellow-800',
      '내부공사': 'bg-green-100 text-green-800',
      '기타': 'bg-purple-100 text-purple-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">작업 항목 관리</h1>
            <p className="text-gray-600">건축주별 작업 항목을 관리하고 진행 상황을 추적하세요</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleDownloadTemplate}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              📁 템플릿 다운로드
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              📤 Excel 가져오기
            </button>
            <button
              onClick={handleExportToExcel}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              📥 Excel 내보내기
            </button>
            {selectedItems.length > 0 && (
              <button
                onClick={handleCreateBulkInvoice}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center"
              >
                📄 선택 항목 청구서 생성 ({selectedItems.length})
              </button>
            )}
            <button
              onClick={() => setShowBulkModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
            >
              📝 일괄 작업 항목 추가
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
            >
              + 새 작업 항목
            </button>
          </div>
        </div>
        
        {/* 건축주 및 프로젝트 필터 */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-4 flex-wrap">
            <label className="text-sm font-medium text-gray-700">필터:</label>
            <select
              value={selectedClient}
              onChange={(e) => {
                setSelectedClient(e.target.value);
                setSelectedProject(''); // 건축주 변경시 프로젝트 필터 초기화
              }}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">전체 건축주</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
            
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={!selectedClient}
            >
              <option value="">
                {selectedClient ? '전체 프로젝트' : '먼저 건축주를 선택하세요'}
              </option>
              {selectedClient && getClientProjects(selectedClient).map(project => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>
            
            <div className="text-sm text-gray-500">
              {(selectedClient || selectedProject) ? 
                `${filteredWorkItems.length}개 항목` : 
                `총 ${workItems.length}개 항목`
              }
            </div>
            
            {(selectedClient || selectedProject) && (
              <button
                onClick={() => {
                  setSelectedClient('');
                  setSelectedProject('');
                }}
                className="text-xs text-purple-600 hover:text-purple-800"
              >
                필터 초기화
              </button>
            )}
          </div>
        </div>
        
        {/* 숨겨진 파일 입력 */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportFromExcel}
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
        />
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {(selectedClient || selectedProject) ? '필터된 작업' : '총 작업 항목'}
              </p>
              <p className="text-3xl font-bold text-gray-900">{filteredWorkItems.length}</p>
            </div>
            <div className="bg-blue-500 rounded-full p-3 text-white text-2xl">
              🔧
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">완료된 작업</p>
              <p className="text-3xl font-bold text-green-600">
                {filteredWorkItems.filter(item => item.status === '완료').length}
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
              <p className="text-sm font-medium text-gray-600 mb-1">진행 중인 작업</p>
              <p className="text-3xl font-bold text-purple-600">
                {filteredWorkItems.filter(item => item.status === '진행중').length}
              </p>
            </div>
            <div className="bg-purple-500 rounded-full p-3 text-white text-2xl">
              🚧
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">총 작업 금액</p>
              <p className="text-3xl font-bold text-orange-600">
                {filteredWorkItems.reduce((sum, item) => sum + item.defaultPrice, 0).toLocaleString()}원
              </p>
            </div>
            <div className="bg-orange-500 rounded-full p-3 text-white text-2xl">
              💰
            </div>
          </div>
        </div>
      </div>

      {/* 작업 항목 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  checked={selectedItems.length > 0 && selectedItems.length === filteredWorkItems.filter(item => item.status === '완료').length}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                건축주
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업명
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업장
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                프로젝트
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                카테고리
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                금액
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                날짜
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredWorkItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={(e) => handleItemSelect(item.id, e.target.checked)}
                    disabled={item.status !== '완료'}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700">
                        {item.clientName.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{item.clientName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-500">{item.description}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.workplaceName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.projectName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {item.defaultPrice.toLocaleString()}원
                  </div>
                  <div className="text-xs text-gray-500">/ {item.unit}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    item.status === '완료' ? 'bg-green-100 text-green-800' :
                    item.status === '진행중' ? 'bg-blue-100 text-blue-800' :
                    item.status === '보류' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.date}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => handleEdit(item)}
                    className="text-blue-600 hover:text-blue-900 mr-2"
                  >
                    편집
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-900 mr-2"
                  >
                    삭제
                  </button>
                  {item.status === '완료' && (
                    <button 
                      onClick={() => handleCreateInvoice(item)}
                      className="text-green-600 hover:text-green-900"
                    >
                      청구서 생성
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 작업 항목 추가/편집 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingItem ? '작업 항목 편집' : '새 작업 항목 추가'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">건축주</label>
                  <select
                    name="clientId"
                    value={newItem.clientId}
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
                    value={newItem.workplaceId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                    disabled={!newItem.clientId}
                  >
                    <option value="">작업장 선택</option>
                    {newItem.clientId && getClientWorkplaces(newItem.clientId).map(workplace => (
                      <option key={workplace.id} value={workplace.id}>
                        {workplace.name} - {workplace.address}
                      </option>
                    ))}
                  </select>
                  {!newItem.clientId && (
                    <p className="text-xs text-gray-500 mt-1">먼저 건축주를 선택하세요</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">프로젝트명</label>
                  <input
                    type="text"
                    name="projectName"
                    value={newItem.projectName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">작업명</label>
                  <input
                    type="text"
                    name="name"
                    value={newItem.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">카테고리</label>
                  <select
                    name="category"
                    value={newItem.category}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  >
                    <option value="">카테고리 선택</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">기본 단가</label>
                  <input
                    type="number"
                    name="defaultPrice"
                    value={newItem.defaultPrice}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">단위</label>
                  <input
                    type="text"
                    name="unit"
                    value={newItem.unit}
                    onChange={handleInputChange}
                    placeholder="예: 식, ㎡, 개, 톤"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">세부 작업</label>
                  <textarea
                    name="description"
                    value={newItem.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">비고</label>
                  <textarea
                    name="notes"
                    value={newItem.notes}
                    onChange={handleInputChange}
                    rows="2"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="추가적인 메모나 특이사항을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">상태</label>
                  <select
                    name="status"
                    value={newItem.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
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
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
                  >
                    {editingItem ? '수정' : '추가'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 일괄 작업 항목 추가 모달 */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">일괄 작업 항목 추가</h3>
              <form onSubmit={handleBulkSubmit} className="space-y-6">
                
                {/* 공통 정보 */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-gray-800 mb-3">공통 정보</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">건축주</label>
                      <select
                        name="clientId"
                        value={bulkBaseInfo.clientId}
                        onChange={handleBulkBaseInfoChange}
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
                        value={bulkBaseInfo.workplaceId}
                        onChange={handleBulkBaseInfoChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                        disabled={!bulkBaseInfo.clientId}
                      >
                        <option value="">작업장 선택</option>
                        {bulkBaseInfo.clientId && getClientWorkplaces(bulkBaseInfo.clientId).map(workplace => (
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
                        value={bulkBaseInfo.projectName}
                        onChange={handleBulkBaseInfoChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 작업 항목들 */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-md font-medium text-gray-800">작업 항목들</h4>
                    <button
                      type="button"
                      onClick={addBulkItem}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + 항목 추가
                    </button>
                  </div>
                  
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {bulkItems.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-medium text-gray-700">작업 항목 #{index + 1}</span>
                          {bulkItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeBulkItem(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">작업명</label>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleBulkItemChange(index, 'name', e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">카테고리</label>
                            <select
                              value={item.category}
                              onChange={(e) => handleBulkItemChange(index, 'category', e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              required
                            >
                              <option value="">카테고리 선택</option>
                              {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">기본 단가</label>
                            <input
                              type="number"
                              value={item.defaultPrice}
                              onChange={(e) => handleBulkItemChange(index, 'defaultPrice', e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">단위</label>
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => handleBulkItemChange(index, 'unit', e.target.value)}
                              placeholder="예: 식, ㎡, 개, 톤"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">상태</label>
                            <select
                              value={item.status}
                              onChange={(e) => handleBulkItemChange(index, 'status', e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            >
                              {statuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">세부 작업</label>
                            <textarea
                              value={item.description}
                              onChange={(e) => handleBulkItemChange(index, 'description', e.target.value)}
                              rows="2"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">비고</label>
                            <textarea
                              value={item.notes}
                              onChange={(e) => handleBulkItemChange(index, 'notes', e.target.value)}
                              rows="2"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              placeholder="추가적인 메모나 특이사항을 입력하세요"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBulkModal(false)}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                  >
                    {bulkItems.length}개 항목 일괄 추가
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkItems;
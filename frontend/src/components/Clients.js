import React, { useState, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { numberToKorean } from '../utils/numberToKorean';
import { exportToExcel, importFromExcel, createTemplate } from '../utils/excelUtils';
import { handlePhoneInput } from '../utils/phoneFormatter';

function Clients() {
  const { 
    clients, 
    setClients, 
    workItems, 
    setWorkItems, 
    invoices, 
    setInvoices,
    getClientProjectCount,
    getClientTotalBilled,
    getClientOutstanding
  } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingClientId, setEditingClientId] = useState(null);
  const [newClient, setNewClient] = useState({
    name: '',
    phone: '',
    mobile: '',
    email: '',
    address: '',
    notes: '',
    workplaces: [{ name: '', address: '', project: '' }]
  });
  const [selectedClients, setSelectedClients] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const fileInputRef = useRef(null);

  // Excel 관련 함수들
  const handleExportToExcel = () => {
    exportToExcel.clients(clients);
  };

  const handleImportFromExcel = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const importedClients = await importFromExcel.clients(file);
        setClients(prev => [...prev, ...importedClients]);
        alert(`${importedClients.length}개의 건축주 정보를 가져왔습니다.`);
      } catch (error) {
        alert('Excel 파일을 가져오는 중 오류가 발생했습니다: ' + error.message);
      }
      // 파일 입력 초기화
      e.target.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    createTemplate.clients();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    let formattedValue = value;
    
    // 전화번호 필드는 자동 포맷팅 적용
    if (name === 'phone') {
      formattedValue = handlePhoneInput(value, false);
    } else if (name === 'mobile') {
      formattedValue = handlePhoneInput(value, true);
    }
    
    setNewClient(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  const handleWorkplaceChange = (index, field, value) => {
    const updatedWorkplaces = [...newClient.workplaces];
    updatedWorkplaces[index][field] = value;
    setNewClient(prev => ({
      ...prev,
      workplaces: updatedWorkplaces
    }));
  };

  const addWorkplace = () => {
    setNewClient(prev => ({
      ...prev,
      workplaces: [...prev.workplaces, { name: '', address: '', project: '' }]
    }));
  };

  const removeWorkplace = (index) => {
    if (newClient.workplaces.length > 1) {
      const updatedWorkplaces = newClient.workplaces.filter((_, i) => i !== index);
      setNewClient(prev => ({
        ...prev,
        workplaces: updatedWorkplaces
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isEditing) {
      // 편집 모드
      const updatedClient = {
        ...newClient,
        id: editingClientId,
        workplaces: newClient.workplaces.map((wp, index) => ({
          ...wp,
          id: wp.id || index + 1
        }))
      };
      setClients(prev => prev.map(client => 
        client.id === editingClientId 
          ? { ...client, ...updatedClient, totalBilled: client.totalBilled, outstanding: client.outstanding, projects: client.projects }
          : client
      ));
    } else {
      // 새로 추가 모드
      const client = {
        ...newClient,
        id: clients.length + 1,
        workplaces: newClient.workplaces.map((wp, index) => ({
          ...wp,
          id: index + 1
        })),
        projects: [],
        totalBilled: 0,
        outstanding: 0
      };
      setClients(prev => [...prev, client]);
    }
    
    // 상태 초기화
    setNewClient({
      name: '',
      phone: '',
      mobile: '',
      email: '',
      address: '',
      notes: '',
      workplaces: [{ name: '', address: '', project: '' }]
    });
    setShowModal(false);
    setIsEditing(false);
    setEditingClientId(null);
  };

  const viewClientDetails = (client) => {
    setSelectedClient(client);
  };

  const handleEditClient = (client) => {
    setIsEditing(true);
    setEditingClientId(client.id);
    setNewClient({
      name: client.name,
      phone: client.phone,
      mobile: client.mobile || '',
      email: client.email,
      address: client.address,
      notes: client.notes,
      workplaces: client.workplaces || [{ name: '', address: '', project: '' }]
    });
    setShowModal(true);
  };

  // 체크박스 관련 함수들
  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedClients(clients.map(client => client.id));
    } else {
      setSelectedClients([]);
    }
  };

  const handleSelectClient = (clientId, checked) => {
    if (checked) {
      setSelectedClients(prev => [...prev, clientId]);
    } else {
      setSelectedClients(prev => prev.filter(id => id !== clientId));
      setSelectAll(false);
    }
  };

  // 선택된 건축주들 삭제
  const handleDeleteSelectedClients = () => {
    if (selectedClients.length === 0) {
      alert('삭제할 건축주를 선택해주세요.');
      return;
    }

    const selectedClientData = clients.filter(client => selectedClients.includes(client.id));
    
    // 관련 데이터 확인
    let totalRelatedWorkItems = 0;
    let totalRelatedInvoices = 0;
    
    selectedClientData.forEach(client => {
      const relatedWorkItems = workItems ? workItems.filter(item => 
        item.clientId === client.id || item.clientName === client.name
      ) : [];
      const relatedInvoices = invoices ? invoices.filter(invoice => 
        invoice.clientId === client.id || invoice.clientName === client.name
      ) : [];
      
      totalRelatedWorkItems += relatedWorkItems.length;
      totalRelatedInvoices += relatedInvoices.length;
    });

    let confirmMessage = `정말로 선택된 ${selectedClients.length}개의 건축주를 삭제하시겠습니까?`;
    
    if (totalRelatedWorkItems > 0 || totalRelatedInvoices > 0) {
      confirmMessage += `\n\n⚠️ 주의사항:`;
      if (totalRelatedWorkItems > 0) {
        confirmMessage += `\n• 연관된 작업 항목 ${totalRelatedWorkItems}개도 함께 삭제됩니다.`;
      }
      if (totalRelatedInvoices > 0) {
        confirmMessage += `\n• 연관된 청구서 ${totalRelatedInvoices}개도 함께 삭제됩니다.`;
      }
    }
    
    confirmMessage += `\n\n이 작업은 되돌릴 수 없습니다.`;

    if (window.confirm(confirmMessage)) {
      try {
        // 건축주들 삭제
        setClients(prev => prev.filter(client => !selectedClients.includes(client.id)));
        
        // 관련 작업 항목 삭제
        if (totalRelatedWorkItems > 0 && workItems && setWorkItems) {
          setWorkItems(prev => prev.filter(item => {
            const client = selectedClientData.find(c => 
              c.id === item.clientId || c.name === item.clientName
            );
            return !client;
          }));
        }
        
        // 관련 청구서 삭제
        if (totalRelatedInvoices > 0 && invoices && setInvoices) {
          setInvoices(prev => prev.filter(invoice => {
            const client = selectedClientData.find(c => 
              c.id === invoice.clientId || c.name === invoice.clientName
            );
            return !client;
          }));
        }
        
        let successMessage = `${selectedClients.length}개의 건축주가 성공적으로 삭제되었습니다.`;
        if (totalRelatedWorkItems > 0 || totalRelatedInvoices > 0) {
          successMessage += `\n연관된 데이터도 함께 정리되었습니다.`;
        }
        
        // 선택 상태 초기화
        setSelectedClients([]);
        setSelectAll(false);
        
        alert(successMessage);
      } catch (error) {
        console.error('건축주 삭제 오류:', error);
        alert('건축주 삭제 중 오류가 발생했습니다: ' + error.message);
      }
    }
  };

  const handleDeleteClient = (client) => {
    // 관련 작업 항목 및 청구서 확인
    const relatedWorkItems = workItems ? workItems.filter(item => 
      item.clientId === client.id || item.clientName === client.name
    ) : [];
    
    const relatedInvoices = invoices ? invoices.filter(invoice => 
      invoice.clientId === client.id || invoice.clientName === client.name
    ) : [];

    let confirmMessage = `정말로 "${client.name}" 건축주를 삭제하시겠습니까?`;
    
    if (relatedWorkItems.length > 0 || relatedInvoices.length > 0) {
      confirmMessage += `\n\n⚠️ 주의사항:`;
      if (relatedWorkItems.length > 0) {
        confirmMessage += `\n• 연관된 작업 항목 ${relatedWorkItems.length}개도 함께 삭제됩니다.`;
      }
      if (relatedInvoices.length > 0) {
        confirmMessage += `\n• 연관된 청구서 ${relatedInvoices.length}개도 함께 삭제됩니다.`;
      }
    }
    
    confirmMessage += `\n\n이 작업은 되돌릴 수 없습니다.`;

    if (window.confirm(confirmMessage)) {
      try {
        // 건축주 삭제
        setClients(prev => prev.filter(c => c.id !== client.id));
        
        // 관련 작업 항목 삭제
        if (relatedWorkItems.length > 0 && workItems && setWorkItems) {
          setWorkItems(prev => prev.filter(item => 
            item.clientId !== client.id && item.clientName !== client.name
          ));
        }
        
        // 관련 청구서 삭제
        if (relatedInvoices.length > 0 && invoices && setInvoices) {
          setInvoices(prev => prev.filter(invoice => 
            invoice.clientId !== client.id && invoice.clientName !== client.name
          ));
        }
        
        let successMessage = '건축주가 성공적으로 삭제되었습니다.';
        if (relatedWorkItems.length > 0 || relatedInvoices.length > 0) {
          successMessage += `\n연관된 데이터도 함께 정리되었습니다.`;
        }
        
        alert(successMessage);
      } catch (error) {
        console.error('건축주 삭제 오류:', error);
        alert('건축주 삭제 중 오류가 발생했습니다: ' + error.message);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">건축주 관리</h1>
          <p className="text-gray-600">건축주 정보를 관리하고 프로젝트 이력을 추적하세요</p>
        </div>
        <div className="flex space-x-2">
          {selectedClients.length > 0 && (
            <button
              onClick={handleDeleteSelectedClients}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              🗑️ 선택 항목 삭제 ({selectedClients.length})
            </button>
          )}
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
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            + 새 건축주
          </button>
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

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">총 건축주</p>
              <p className="text-3xl font-bold text-gray-900">{clients.length}</p>
            </div>
            <div className="bg-blue-500 rounded-full p-3 text-white text-2xl">
              👥
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">총 청구금액 :</p>
              <p className="text-3xl font-bold text-green-600">
                금 {numberToKorean(clients.reduce((sum, client) => sum + getClientTotalBilled(client.id), 0))} 원정
              </p>
            </div>
            <div className="bg-green-500 rounded-full p-3 text-white text-2xl">
              💰
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">미수금</p>
              <p className="text-3xl font-bold text-red-600">
                {clients.reduce((sum, client) => sum + getClientOutstanding(client.id), 0).toLocaleString()}원
              </p>
            </div>
            <div className="bg-red-500 rounded-full p-3 text-white text-2xl">
              ⚠️
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">미수금 건수</p>
              <p className="text-3xl font-bold text-orange-600">
                {clients.filter(client => getClientOutstanding(client.id) > 0).length}
              </p>
            </div>
            <div className="bg-orange-500 rounded-full p-3 text-white text-2xl">
              📋
            </div>
          </div>
        </div>
      </div>

      {/* 건축주 목록 */}
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
                이름
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                연락처
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                주소
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                프로젝트 수
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                총 청구액
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                미수금
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedClients.includes(client.id)}
                    onChange={(e) => handleSelectClient(client.id, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {client.name.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-base font-medium text-gray-900">{client.name}</div>
                      <div className="text-base text-gray-500">{client.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {client.phone && <div>전화: {client.phone}</div>}
                    {client.mobile && <div>휴대폰: {client.mobile}</div>}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-base text-gray-900">{client.address}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-base text-gray-900">{getClientProjectCount(client.id)}개</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-base font-medium text-gray-900">
                    {getClientTotalBilled(client.id).toLocaleString()}원
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-base font-medium ${
                    getClientOutstanding(client.id) > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {getClientOutstanding(client.id).toLocaleString()}원
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-base font-medium">
                  <button 
                    onClick={() => viewClientDetails(client)}
                    className="text-blue-600 hover:text-blue-900 mr-2"
                  >
                    상세보기
                  </button>
                  <button 
                    className="text-green-600 hover:text-green-900 mr-2"
                    onClick={() => handleEditClient(client)}
                  >
                    편집
                  </button>
                  <button 
                    className="text-red-600 hover:text-red-900"
                    onClick={() => handleDeleteClient(client)}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 새 건축주 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isEditing ? '건축주 정보 수정' : '새 건축주 추가'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">이름</label>
                  <input
                    type="text"
                    name="name"
                    value={newClient.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">전화번호</label>
                  <input
                    type="tel"
                    name="phone"
                    value={newClient.phone}
                    onChange={handleInputChange}
                    placeholder="02-1234-5678"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">휴대전화</label>
                  <input
                    type="tel"
                    name="mobile"
                    value={newClient.mobile}
                    onChange={handleInputChange}
                    placeholder="010-1234-5678"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">이메일</label>
                  <input
                    type="email"
                    name="email"
                    value={newClient.email}
                    onChange={handleInputChange}
                    placeholder="선택사항"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">주소</label>
                  <textarea
                    name="address"
                    value={newClient.address}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="선택사항"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">메모</label>
                  <textarea
                    name="notes"
                    value={newClient.notes}
                    onChange={handleInputChange}
                    rows="3"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                {/* 작업장 정보 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">작업장 정보</label>
                    <button
                      type="button"
                      onClick={addWorkplace}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + 작업장 추가
                    </button>
                  </div>
                  
                  {newClient.workplaces.map((workplace, index) => (
                    <div key={index} className="border rounded-md p-3 mb-3 bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">작업장 {index + 1}</span>
                        {newClient.workplaces.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeWorkplace(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="작업장명 (예: 신축 주택, 카페 인테리어 등)"
                          value={workplace.name}
                          onChange={(e) => handleWorkplaceChange(index, 'name', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          required
                        />
                        <input
                          type="text"
                          placeholder="작업장 주소"
                          value={workplace.address}
                          onChange={(e) => handleWorkplaceChange(index, 'address', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          required
                        />
                        <input
                          type="text"
                          placeholder="프로젝트명 (예: 신축공사, 리모델링 등)"
                          value={workplace.project}
                          onChange={(e) => handleWorkplaceChange(index, 'project', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setIsEditing(false);
                      setEditingClientId(null);
                      setNewClient({
                        name: '',
                        phone: '',
                        mobile: '',
                        email: '',
                        address: '',
                        notes: '',
                        workplaces: [{ name: '', address: '', project: '' }]
                      });
                    }}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                  >
                    {isEditing ? '수정' : '추가'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 건축주 상세보기 모달 */}
      {selectedClient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-3xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">건축주 상세 정보 - {selectedClient.name}</h3>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="border rounded-lg p-6 bg-gray-50">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium mb-3">기본 정보</h4>
                  <p className="mb-2"><strong>이름:</strong> {selectedClient.name}</p>
                  {selectedClient.phone && <p className="mb-2"><strong>전화번호:</strong> {selectedClient.phone}</p>}
                  {selectedClient.mobile && <p className="mb-2"><strong>휴대전화:</strong> {selectedClient.mobile}</p>}
                  {selectedClient.email && <p className="mb-2"><strong>이메일:</strong> {selectedClient.email}</p>}
                  <p><strong>주소:</strong> {selectedClient.address}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-3">재무 정보</h4>
                  <p className="mb-2"><strong>총 청구액:</strong> {getClientTotalBilled(selectedClient.id).toLocaleString()}원</p>
                  <p className="mb-2"><strong>미수금:</strong> 
                    <span className={getClientOutstanding(selectedClient.id) > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                      {getClientOutstanding(selectedClient.id).toLocaleString()}원
                    </span>
                  </p>
                  <p><strong>프로젝트 수:</strong> {getClientProjectCount(selectedClient.id)}개</p>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium mb-2">작업장 정보</h4>
                {selectedClient.workplaces && selectedClient.workplaces.length > 0 ? (
                  <div className="space-y-3">
                    {selectedClient.workplaces.map((workplace, index) => (
                      <div key={index} className="bg-white rounded border p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-gray-900">{workplace.name}</h5>
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                            작업장 {index + 1}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>주소:</strong> {workplace.address}
                        </p>
                        {workplace.project && (
                          <p className="text-sm text-gray-600">
                            <strong>프로젝트:</strong> {workplace.project}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">등록된 작업장이 없습니다.</p>
                )}
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-2">프로젝트 이력</h4>
                {selectedClient.projects.length > 0 ? (
                  <ul className="bg-white rounded border p-3">
                    {selectedClient.projects.map((project, index) => (
                      <li key={index} className="py-1 border-b last:border-b-0">
                        • {project}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">진행된 프로젝트가 없습니다.</p>
                )}
              </div>
              
              {selectedClient.notes && (
                <div>
                  <h4 className="font-medium mb-2">메모</h4>
                  <p className="bg-white rounded border p-3">{selectedClient.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clients;
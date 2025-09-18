import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { exportToExcel, importFromExcel, createTemplate } from '../utils/excelUtils';

// 한국 전화번호 자동 하이픈 포매터
function formatPhoneKR(input) {
  const digits = String(input || '').replace(/\D/g, '');
  if (digits.startsWith('02')) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2, digits.length - 4)}-${digits.slice(digits.length - 4)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`; // 02-xxxx-xxxx
  }
  // 모바일(010 등) 및 기타 지역번호(3자리)
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 11) return `${digits.slice(0, 3)}-${digits.slice(3, digits.length - 4)}-${digits.slice(digits.length - 4)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`; // 최대 11자리
}

function Clients() {
  const { clients, setClients, invoices, workItems } = useApp();
  const [selectedIds, setSelectedIds] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingClientId, setEditingClientId] = useState(null);
  const [newClient, setNewClient] = useState({
    type: 'PERSON', // 'PERSON' | 'BUSINESS'
    name: '',
    phone: '',
    mobile: '',
    email: '',
    address: '',
    notes: '',
    business: {
      businessName: '', // 상호
      representative: '', // 대표자
      businessNumber: '', // 10자리
      businessType: '', // 업태
      businessItem: '', // 업종
      businessAddress: '',
      taxEmail: ''
    },
    workplaces: [{ name: '', address: '', description: '' }]
  });

  const fileInputRef = useRef(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // 일괄 선택/삭제 상태 및 핸들러
  const allVisibleIds = clients.map(c => c.id);
  const allSelected = selectedIds.length > 0 && selectedIds.length === allVisibleIds.length;
  const toggleSelectAll = (checked) => setSelectedIds(checked ? allVisibleIds : []);
  const toggleSelectOne = (id, checked) => setSelectedIds(prev => checked ? Array.from(new Set([...prev, id])) : prev.filter(x => x !== id));
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setClients(prev => prev.filter(c => !selectedIds.includes(c.id)));
    setSelectedIds([]);
    setShowConfirmDelete(false);
  };

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
    const next = (name === 'phone' || name === 'mobile') ? formatPhoneKR(value) : value;
    setNewClient(prev => ({
      ...prev,
      [name]: next
    }));
  };

  const formatBizNo = (val) => {
    const d = String(val || '').replace(/\D/g, '').slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 5) return `${d.slice(0,3)}-${d.slice(3)}`;
    return `${d.slice(0,3)}-${d.slice(3,5)}-${d.slice(5)}`;
  };

  const handleBusinessChange = (e) => {
    const { name, value } = e.target;
    const v = name === 'businessNumber' ? formatBizNo(value) : value;
    setNewClient(prev => ({
      ...prev,
      business: {
        ...prev.business,
        [name]: v
      }
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
      workplaces: [...prev.workplaces, { name: '', address: '', description: '' }]
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
    const payload = { ...newClient };
    if (payload.type === 'BUSINESS') {
      // 기본 표시 이름 보정: 상호를 이름으로 사용
      if (!payload.name && payload.business?.businessName) {
        payload.name = payload.business.businessName;
      }
      // 간단한 사업자번호 길이 검증(선택): 10자리 숫자
      const digits = String(payload.business?.businessNumber || '').replace(/\D/g, '');
      if (digits.length > 0 && digits.length !== 10) {
        alert('사업자등록번호는 숫자 10자리여야 합니다.');
        return;
      }
    }
    
    if (isEditing) {
      // 편집 모드
      const updatedClient = {
        ...payload,
        id: editingClientId,
        workplaces: newClient.workplaces.map((wp, index) => ({
          ...wp,
          id: wp.id || index + 1
        })),
        projects: Array.from(new Set((newClient.workplaces || [])
          .map(wp => (wp.description || '').trim())
          .filter(Boolean)))
      };
      setClients(prev => prev.map(client => 
        client.id === editingClientId 
          ? { ...client, ...updatedClient, totalBilled: client.totalBilled, outstanding: client.outstanding }
          : client
      ));
    } else {
      // 새로 추가 모드
      const client = {
        ...payload,
        id: clients.length + 1,
        workplaces: newClient.workplaces.map((wp, index) => ({
          ...wp,
          id: index + 1
        })),
        projects: Array.from(new Set((newClient.workplaces || [])
          .map(wp => (wp.description || '').trim())
          .filter(Boolean))),
        totalBilled: 0,
        outstanding: 0
      };
      setClients(prev => [...prev, client]);
    }
    
    // 상태 초기화
    setNewClient({
      type: 'PERSON',
      name: '',
      phone: '',
      mobile: '',
      email: '',
      address: '',
      notes: '',
      business: {
        businessName: '',
        representative: '',
        businessNumber: '',
        businessType: '',
        businessItem: '',
        businessAddress: '',
        taxEmail: ''
      },
      workplaces: [{ name: '', address: '', description: '' }]
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
      type: client.type || 'PERSON',
      name: client.name,
      phone: client.phone,
      mobile: client.mobile || '',
      email: client.email,
      address: client.address,
      notes: client.notes,
      business: client.business || {
        businessName: '',
        representative: '',
        businessNumber: '',
        businessType: '',
        businessItem: '',
        businessAddress: '',
        taxEmail: ''
      },
      workplaces: client.workplaces || [{ name: '', address: '', description: '' }]
    });
    setShowModal(true);
  };

  // 계산: 청구액/미수금 (invoices 기반, clientId 우선/이름 보조)
  const totalsByClientId = useMemo(() => {
    const map = new Map();
    clients.forEach(c => map.set(c.id, { total: 0, outstanding: 0 }));
    (invoices || []).forEach(inv => {
      const amount = Number(inv.amount) || 0;
      let cid = inv.clientId != null && inv.clientId !== '' ? parseInt(inv.clientId) : null;
      if (!cid) {
        const match = clients.find(c => c.name === inv.client);
        cid = match ? match.id : null;
      }
      if (!cid) return;
      const agg = map.get(cid) || { total: 0, outstanding: 0 };
      agg.total += amount;
      if (inv.status !== '결제완료') agg.outstanding += amount;
      map.set(cid, agg);
    });
    return map;
  }, [clients, invoices]);

  const grandTotals = useMemo(() => {
    let total = 0;
    let outstanding = 0;
    (invoices || []).forEach(inv => {
      const amount = Number(inv.amount) || 0;
      total += amount;
      if (inv.status !== '결제완료') outstanding += amount;
    });
    return { total, outstanding };
  }, [invoices]);

  // 프로젝트 수: clients.projects + workItems.projectName + invoices.project에서 고유값 집계
  const projectCountsByClientId = useMemo(() => {
    const sets = new Map();
    const ensureSet = (id) => {
      if (!sets.has(id)) sets.set(id, new Set());
      return sets.get(id);
    };

    // 기존 client.projects 반영
    clients.forEach(c => {
      const s = ensureSet(c.id);
      (c.projects || []).forEach(p => {
        const v = (p || '').trim();
        if (v) s.add(v);
      });
    });

    // workItems.projectName 반영
    (workItems || []).forEach(wi => {
      if (!wi) return;
      const cid = wi.clientId;
      if (!cid) return;
      const v = (wi.projectName || '').trim();
      if (!v) return;
      ensureSet(cid).add(v);
    });

    // invoices.project 반영 (clientId 우선, 없으면 이름 매칭)
    (invoices || []).forEach(inv => {
      const v = (inv.project || '').trim();
      if (!v) return;
      let cid = inv.clientId != null && inv.clientId !== '' ? parseInt(inv.clientId) : null;
      if (!cid) {
        const match = clients.find(c => c.name === inv.client);
        cid = match ? match.id : null;
      }
      if (!cid) return;
      ensureSet(cid).add(v);
    });

    // 크기 맵으로 변환
    const counts = new Map();
    for (const [id, set] of sets.entries()) counts.set(id, set.size);
    return counts;
  }, [clients, workItems, invoices]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">건축주 관리</h1>
          <p className="text-gray-600">건축주 정보를 관리하고 프로젝트 이력을 추적하세요</p>
        </div>
        <div className="flex space-x-2">
          {selectedIds.length > 0 && (
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center"
              title="선택된 건축주 일괄 삭제"
            >
              🗑️ 선택 삭제({selectedIds.length})
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
              <p className="text-xl font-bold text-gray-900">{clients.length}</p>
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
              <p className="text-xl font-bold text-green-600">
                {grandTotals.total.toLocaleString()}원
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
              <p className="text-xl font-bold text-red-600">
                {grandTotals.outstanding.toLocaleString()}원
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
              <p className="text-xl font-bold text-orange-600">
                {clients.filter(c => (totalsByClientId.get(c.id)?.outstanding || 0) > 0).length}
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
                  className="rounded border-gray-300"
                  checked={allSelected}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  title="전체 선택"
                />
              </th>
              <th className="px-6 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
                이름
              </th>
              <th className="px-6 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
                연락처
              </th>
              <th className="px-6 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
                주소
              </th>
              <th className="px-6 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
                프로젝트 수
              </th>
              <th className="px-6 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
                총 청구액
              </th>
              <th className="px-6 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
                미수금
              </th>
              <th className="px-6 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
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
                    className="rounded border-gray-300"
                    checked={selectedIds.includes(client.id)}
                    onChange={(e) => toggleSelectOne(client.id, e.target.checked)}
                    title="항목 선택"
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
                      <div className="text-sm font-medium text-gray-900">
                        {client.name}
                        {client.type === 'BUSINESS' && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">사업자</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {client.email}
                        {client.type === 'BUSINESS' && client.business?.businessNumber && (
                          <span className="ml-2">사업자등록번호: {client.business.businessNumber}</span>
                        )}
                      </div>
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
                  <div className="text-sm text-gray-900">{client.address}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{(projectCountsByClientId.get(client.id) || 0)}개</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {(totalsByClientId.get(client.id)?.total || 0).toLocaleString()}원
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${
                    (totalsByClientId.get(client.id)?.outstanding || 0) > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {(totalsByClientId.get(client.id)?.outstanding || 0).toLocaleString()}원
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                  <button className="text-red-600 hover:text-red-900">삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 선택 삭제 확인 모달 */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">선택 삭제</h3>
            <p className="text-sm text-gray-600 mb-4">선택된 {selectedIds.length}명의 건축주를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setShowConfirmDelete(false)}>취소</button>
              <button className="btn-primary bg-red-600 hover:bg-red-700" onClick={handleBulkDelete}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* 새 건축주 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isEditing ? '건축주 정보 수정' : '새 건축주 추가'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 유형 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
                  <div className="flex items-center gap-6">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="type"
                        value="PERSON"
                        checked={newClient.type === 'PERSON'}
                        onChange={() => setNewClient(prev => ({ ...prev, type: 'PERSON' }))}
                      />
                      개인
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="type"
                        value="BUSINESS"
                        checked={newClient.type === 'BUSINESS'}
                        onChange={() => setNewClient(prev => ({ ...prev, type: 'BUSINESS' }))}
                      />
                      사업자
                    </label>
                  </div>
                </div>
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
                {/* 사업자 정보 */}
                {newClient.type === 'BUSINESS' && (
                  <div className="border rounded-md p-3 bg-yellow-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">상호</label>
                        <input
                          type="text"
                          name="businessName"
                          value={newClient.business.businessName}
                          onChange={handleBusinessChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                          required={newClient.type === 'BUSINESS'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">대표자</label>
                        <input
                          type="text"
                          name="representative"
                          value={newClient.business.representative}
                          onChange={handleBusinessChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                          required={newClient.type === 'BUSINESS'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">사업자등록번호</label>
                        <input
                          type="text"
                          name="businessNumber"
                          value={newClient.business.businessNumber}
                          onChange={handleBusinessChange}
                          placeholder="000-00-00000"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                          required={newClient.type === 'BUSINESS'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">발행 이메일</label>
                        <input
                          type="email"
                          name="taxEmail"
                          value={newClient.business.taxEmail}
                          onChange={handleBusinessChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                          required={newClient.type === 'BUSINESS'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">업태</label>
                        <input
                          type="text"
                          name="businessType"
                          value={newClient.business.businessType}
                          onChange={handleBusinessChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">업종</label>
                        <input
                          type="text"
                          name="businessItem"
                          value={newClient.business.businessItem}
                          onChange={handleBusinessChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">사업장 주소</label>
                        <input
                          type="text"
                          name="businessAddress"
                          value={newClient.business.businessAddress}
                          onChange={handleBusinessChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>
                )}
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트</label>
                        <textarea
                          placeholder="프로젝트 (필수사항)"
                          value={workplace.description}
                          onChange={(e) => handleWorkplaceChange(index, 'description', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          rows="2"
                          required
                        />
                        <p className="mt-1 text-xs text-red-600">필수사항: 프로젝트명을 입력해주세요.</p>
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
                        workplaces: [{ name: '', address: '', description: '' }]
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
                  <p className="mb-2"><strong>총 청구액:</strong> {selectedClient.totalBilled.toLocaleString()}원</p>
                  <p className="mb-2"><strong>미수금:</strong> 
                    <span className={selectedClient.outstanding > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                      {selectedClient.outstanding.toLocaleString()}원
                    </span>
                  </p>
                  <p><strong>완료 프로젝트:</strong> {selectedClient.projects.length}개</p>
                </div>
              </div>

              {selectedClient.type === 'BUSINESS' && (
                <div className="border rounded-md p-4 bg-yellow-50 mb-6">
                  <h4 className="font-medium mb-3">사업자 정보</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <p><strong>상호:</strong> {selectedClient.business?.businessName || '-'}</p>
                    <p><strong>대표자:</strong> {selectedClient.business?.representative || '-'}</p>
                    <p><strong>사업자등록번호:</strong> {selectedClient.business?.businessNumber || '-'}</p>
                    <p><strong>발행 이메일:</strong> {selectedClient.business?.taxEmail || '-'}</p>
                    <p><strong>업태:</strong> {selectedClient.business?.businessType || '-'}</p>
                    <p><strong>업종:</strong> {selectedClient.business?.businessItem || '-'}</p>
                    <p className="col-span-2"><strong>사업장 주소:</strong> {selectedClient.business?.businessAddress || '-'}</p>
                  </div>
                </div>
              )}
              
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
                        {workplace.description && (
                          <p className="text-sm text-gray-600">
                            <strong>프로젝트:</strong> {workplace.description}
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

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { checkStorageAvailable, getStorageInfo, imageToBase64, saveStampImage, removeStampImage } from '../utils/imageStorage';
import { storage } from '../services/storage';
import { formatPhoneNumber } from '../utils/phoneFormatter';

function CompanyInfo() {
  const { companyInfo, setCompanyInfo, units, setUnits, categories, setCategories, stampImage, setStampImage } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...companyInfo });
  
  // 설정 관련 상태
  const [newUnit, setNewUnit] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [storageInfo, setStorageInfo] = useState({ used: '0 KB', stampImageSize: '0 KB' });
  const [dataDir, setDataDir] = useState('');
  const [browserDirName, setBrowserDirName] = useState('');
  const fileInputRef = useRef(null);

  // 컴포넌트 로드 시 저장소 정보 업데이트
  useEffect(() => {
    if (checkStorageAvailable()) {
      setStorageInfo(getStorageInfo());
    }
    // Load Electron data directory if available
    (async () => {
      try {
        if (window.cms && typeof window.cms.getBaseDir === 'function') {
          const dir = await window.cms.getBaseDir();
          setDataDir(dir);
        }
      } catch (e) {}
      try {
        const info = await storage.getBrowserDirectoryInfo?.();
        if (info?.name) setBrowserDirName(info.name);
      } catch (e) {}
    })();
  }, [stampImage]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // 전화번호 필드인 경우 자동 포맷팅 적용
    const formattedValue = name === 'phone' ? formatPhoneNumber(value) : value;
    
    setEditForm(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  const handleSave = () => {
    setCompanyInfo(editForm);
    setIsEditing(false);
    alert('건축업체 정보가 저장되었습니다.');
  };

  const handleCancel = () => {
    setEditForm({ ...companyInfo });
    setIsEditing(false);
  };

  // 설정 관련 함수들
  const handleAddUnit = () => {
    if (newUnit.trim() && !units.includes(newUnit.trim())) {
      setUnits(prev => [...prev, newUnit.trim()]);
      setNewUnit('');
      alert('새로운 단위가 추가되었습니다.');
    } else if (units.includes(newUnit.trim())) {
      alert('이미 존재하는 단위입니다.');
    }
  };

  const handleRemoveUnit = (unit) => {
    if (window.confirm(`'${unit}' 단위를 삭제하시겠습니까?`)) {
      setUnits(prev => prev.filter(u => u !== unit));
      alert('단위가 삭제되었습니다.');
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories(prev => [...prev, newCategory.trim()]);
      setNewCategory('');
      alert('새로운 카테고리가 추가되었습니다.');
    } else if (categories.includes(newCategory.trim())) {
      alert('이미 존재하는 카테고리입니다.');
    }
  };

  const handleRemoveCategory = (category) => {
    if (window.confirm(`'${category}' 카테고리를 삭제하시겠습니까?`)) {
      setCategories(prev => prev.filter(c => c !== category));
      alert('카테고리가 삭제되었습니다.');
    }
  };

  const handleStampImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        try {
          // 파일 크기 확인 (5MB 제한)
          if (file.size > 5 * 1024 * 1024) {
            alert('이미지 파일 크기는 5MB를 초과할 수 없습니다.');
            return;
          }

          const imageDataUrl = await imageToBase64(file);
          
          // localStorage에 저장 시도
          const saved = saveStampImage(imageDataUrl);
          if (saved) {
            setStampImage(imageDataUrl);
            alert('도장 이미지가 성공적으로 저장되었습니다.');
            console.log('저장소 사용량:', getStorageInfo());
          } else {
            alert('이미지 저장에 실패했습니다. 파일 크기를 줄여주세요.');
          }
        } catch (error) {
          console.error('이미지 처리 오류:', error);
          alert('이미지 처리 중 오류가 발생했습니다.');
        }
      } else {
        alert('이미지 파일만 업로드 가능합니다.');
      }
    }
  };

  const handleRemoveStampImage = () => {
    if (window.confirm('도장 이미지를 삭제하시겠습니까?')) {
      const removed = removeStampImage();
      if (removed) {
        setStampImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        alert('도장 이미지가 완전히 삭제되었습니다.');
        console.log('저장소 사용량:', getStorageInfo());
      } else {
        alert('이미지 삭제 중 오류가 발생했습니다.');
      }
    }
  };


  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">환경설정</h1>
        <p className="text-gray-600">건축업체 정보와 시스템 설정을 관리하세요</p>
      </div>

      {/* 상단 레이아웃: 업체 정보와 시스템 설정 */}
      <div className="flex flex-col lg:flex-row lg:flex-wrap gap-8 mb-8">
        
        {/* 환경설정 */}
        <div className="flex-1 bg-white rounded-lg shadow flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">업체 정보 관리</h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              수정
            </button>
          ) : (
            <div className="space-x-2">
              <button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                저장
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
              >
                취소
              </button>
            </div>
          )}
          </div>

          <div className="p-6 flex-1">
            <div className="grid grid-cols-1 gap-6">
              
              {/* 첫 번째 행: 업체명, 사업자등록번호 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 업체명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    업체명 <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={editForm.name}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{companyInfo.name}</p>
                  )}
                </div>

                {/* 사업자등록번호 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    사업자등록번호 <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="businessNumber"
                      value={editForm.businessNumber}
                      onChange={handleInputChange}
                      placeholder="000-00-00000"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{companyInfo.businessNumber}</p>
                  )}
                </div>
              </div>

              {/* 두 번째 행: 대표자명, 전화번호 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 대표자명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    대표자명 <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="representative"
                      value={editForm.representative}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{companyInfo.representative}</p>
                  )}
                </div>

                {/* 전화번호 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    전화번호 <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={editForm.phone}
                      onChange={handleInputChange}
                      placeholder="02-0000-0000"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{companyInfo.phone}</p>
                  )}
                </div>
              </div>

              {/* 세 번째 행: 이메일 (전체 너비) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleInputChange}
                    placeholder="info@company.com"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{companyInfo.email || '-'}</p>
                )}
              </div>

              {/* 네 번째 행: 주소 (전체 너비) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  주소 <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="address"
                    value={editForm.address}
                    onChange={handleInputChange}
                    placeholder="서울시 강남구 테헤란로 123"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                ) : (
                  <p className="text-gray-900 py-2">{companyInfo.address}</p>
                )}
              </div>

              {/* 다섯 번째 행: 계좌번호, 예금주명 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 계좌번호 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    계좌번호
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="bankAccount"
                      value={editForm.bankAccount}
                      onChange={handleInputChange}
                      placeholder="은행명 000-000-000000"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{companyInfo.bankAccount || '-'}</p>
                  )}
                </div>

                {/* 예금주명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    예금주명
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="accountHolder"
                      value={editForm.accountHolder}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{companyInfo.accountHolder || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 안내 메시지 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    여기서 설정한 정보는 생성되는 모든 청구서에 자동으로 포함됩니다. 
                    정확한 정보를 입력해주세요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 시스템 설정 */}
        <div className="flex-1 bg-white rounded-lg shadow flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">시스템 설정</h2>
            <div className="h-10"></div>
          </div>
          <div className="p-6 flex-1">
            <div className="space-y-8">
              
              {/* 상단: 단위 관리와 카테고리 관리 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 단위 관리 */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">단위 관리</h3>
                  <div className="space-y-4">
                    {/* 단위 추가 */}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newUnit}
                        onChange={(e) => setNewUnit(e.target.value)}
                        placeholder="새 단위 입력"
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddUnit()}
                      />
                      <button
                        onClick={handleAddUnit}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm"
                      >
                        추가
                      </button>
                    </div>

                    {/* 단위 목록 */}
                    <div className="border border-gray-200 rounded-md max-h-48 overflow-y-auto">
                      <div className="p-2">
                        {units.map((unit, index) => (
                          <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                            <span className="text-gray-900 text-sm">{unit}</span>
                            <button
                              onClick={() => handleRemoveUnit(unit)}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              삭제
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 카테고리 관리 */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">카테고리 관리</h3>
                  <div className="space-y-4">
                    {/* 카테고리 추가 */}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="새 카테고리 입력"
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                      />
                      <button
                        onClick={handleAddCategory}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm"
                      >
                        추가
                      </button>
                    </div>

                    {/* 카테고리 목록 */}
                    <div className="border border-gray-200 rounded-md max-h-48 overflow-y-auto">
                      <div className="p-2">
                        {categories.map((category, index) => (
                          <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                            <span className="text-gray-900 text-sm">{category}</span>
                            <button
                              onClick={() => handleRemoveCategory(category)}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              삭제
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 하단: 도장 이미지 관리 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">도장 이미지 관리</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* 이미지 업로드 영역 */}
                  <div>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="mt-4">
                          <label htmlFor="stamp-image" className="cursor-pointer">
                            <span className="block text-sm font-medium text-gray-900">
                              도장 이미지 업로드
                            </span>
                            <span className="block text-sm text-gray-500 mt-1">
                              PNG, JPG 파일만 지원 (최대 2MB)
                            </span>
                          </label>
                          <input
                            id="stamp-image"
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleStampImageChange}
                            className="hidden"
                          />
                        </div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm"
                        >
                          파일 선택
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 이미지 미리보기 및 정보 */}
                  <div className="space-y-4">
                    {/* 이미지 미리보기 */}
                    {stampImage ? (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">미리보기</h4>
                        <div className="flex items-center space-x-4">
                          <div className="w-24 h-24 border border-gray-200 rounded-lg overflow-hidden">
                            <img
                              src={stampImage}
                              alt="도장 미리보기"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <button
                            onClick={handleRemoveStampImage}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <p className="text-sm">업로드된 이미지가 없습니다</p>
                      </div>
                    )}

                    {/* 도장 설명 */}
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            업로드된 도장 이미지는 청구서 생성 시 자동으로 포함됩니다. 
                            선명하고 투명 배경의 이미지를 사용하시기 바랍니다.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 저장소 정보 */}
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                          </svg>
                        </div>
                        <div className="ml-2">
                          <p className="text-xs text-blue-700">
                            저장소 사용량: {storageInfo.used} | 도장 이미지: {storageInfo.stampImageSize}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 데이터 저장 위치 (Electron/Browser) */}
        <div className="w-full bg-white rounded-lg shadow h-max">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">데이터 저장 위치</h2>
          </div>
          <div className="p-6 space-y-3">
            {dataDir ? (
              <>
                <div>
                  <p className="text-sm text-gray-600 mb-1">현재 디렉토리</p>
                  <div className="text-sm font-mono break-all bg-gray-50 border rounded p-2">{dataDir}</div>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const dir = await window.cms.chooseBaseDir();
                      setDataDir(dir);
                      alert('데이터 저장 위치가 변경되었습니다.');
                    } catch (e) {
                      alert('디렉토리 선택 중 오류가 발생했습니다.');
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm"
                >
                  디렉토리 변경
                </button>
                <p className="text-xs text-gray-500">Electron 환경에서만 사용할 수 있습니다.</p>
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">브라우저 저장 방식</p>
                {browserDirName ? (
                  <div className="text-sm">선택된 폴더: <span className="font-mono bg-gray-50 border rounded px-2 py-1">{browserDirName}</span></div>
                ) : (
                  <p className="text-sm text-gray-500">기본 저장소(localStorage)를 사용 중입니다.</p>
                )}
                {('showDirectoryPicker' in window) ? (
                  <button
                    onClick={async () => {
                      const ok = await storage.chooseBrowserDirectory?.();
                      if (ok) {
                        const info = await storage.getBrowserDirectoryInfo?.();
                        setBrowserDirName(info?.name || '');
                        alert('브라우저에서 사용할 폴더가 설정되었습니다. 이후 변경 사항은 해당 폴더의 store.json에도 저장됩니다.');
                      } else {
                        alert('폴더 선택이 취소되었거나 권한이 없습니다.');
                      }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm"
                  >
                    브라우저 폴더 선택(Edge/Chrome)
                  </button>
                ) : (
                  <p className="text-xs text-gray-500">이 브라우저는 폴더 선택을 지원하지 않습니다.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyInfo;

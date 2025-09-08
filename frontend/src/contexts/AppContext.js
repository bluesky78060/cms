import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStorageData, setStorageData } from '../utils/localStorage';
import { DEFAULT_COMPANY_INFO, DEFAULT_CLIENTS, DEFAULT_WORK_ITEMS, DEFAULT_INVOICES } from './defaultData';

// Context 생성
const AppContext = createContext();

// Custom Hook for using context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Provider 컴포넌트
export const AppProvider = ({ children }) => {
  // localStorage에서 데이터 불러오기, 없으면 기본값 사용
  const [companyInfo, setCompanyInfoState] = useState(
    getStorageData('COMPANY_INFO', DEFAULT_COMPANY_INFO)
  );
  
  const [clients, setClientsState] = useState(
    getStorageData('CLIENTS', DEFAULT_CLIENTS)
  );
  
  const [workItems, setWorkItemsState] = useState(
    getStorageData('WORK_ITEMS', DEFAULT_WORK_ITEMS)
  );
  
  const [invoices, setInvoicesState] = useState(
    getStorageData('INVOICES', DEFAULT_INVOICES)
  );

  // localStorage에 자동 저장하는 래퍼 함수들
  const setCompanyInfo = (newCompanyInfo) => {
    setCompanyInfoState(newCompanyInfo);
    setStorageData('COMPANY_INFO', newCompanyInfo);
  };

  const setClients = (newClients) => {
    setClientsState(newClients);
    setStorageData('CLIENTS', newClients);
  };

  const setWorkItems = (newWorkItems) => {
    setWorkItemsState(newWorkItems);
    setStorageData('WORK_ITEMS', newWorkItems);
  };

  const setInvoices = (newInvoices) => {
    setInvoicesState(newInvoices);
    setStorageData('INVOICES', newInvoices);
  };

  // 데이터 초기화 함수
  const resetAllData = () => {
    setCompanyInfo(DEFAULT_COMPANY_INFO);
    setClients(DEFAULT_CLIENTS);
    setWorkItems(DEFAULT_WORK_ITEMS);
    setInvoices(DEFAULT_INVOICES);
  };

  // 클라이언트 관련 함수들
  const addClient = (client) => {
    const newClient = {
      ...client,
      id: Math.max(0, ...clients.map(c => c.id)) + 1,
      workplaces: client.workplaces || [],
      projects: client.projects || [],
      totalBilled: client.totalBilled || 0,
      outstanding: client.outstanding || 0,
      notes: client.notes || ''
    };
    const updatedClients = [...clients, newClient];
    setClients(updatedClients);
  };

  const updateClient = (id, updatedClient) => {
    const updatedClients = clients.map(client =>
      client.id === id ? { ...client, ...updatedClient } : client
    );
    setClients(updatedClients);
  };

  const deleteClient = (id) => {
    const updatedClients = clients.filter(client => client.id !== id);
    setClients(updatedClients);
  };

  // 작업 항목 관련 함수들
  const addWorkItem = (workItem) => {
    const newWorkItem = {
      ...workItem,
      id: Math.max(0, ...workItems.map(w => w.id)) + 1,
      totalPrice: workItem.quantity * workItem.unitPrice,
      notes: workItem.notes || ''
    };
    const updatedWorkItems = [...workItems, newWorkItem];
    setWorkItems(updatedWorkItems);
  };

  const updateWorkItem = (id, updatedWorkItem) => {
    const updatedWorkItems = workItems.map(item =>
      item.id === id ? { 
        ...item, 
        ...updatedWorkItem,
        totalPrice: updatedWorkItem.quantity * updatedWorkItem.unitPrice
      } : item
    );
    setWorkItems(updatedWorkItems);
  };

  const deleteWorkItem = (id) => {
    const updatedWorkItems = workItems.filter(item => item.id !== id);
    setWorkItems(updatedWorkItems);
  };

  // 청구서 관련 함수들
  const addInvoice = (invoice) => {
    const newInvoice = {
      ...invoice,
      id: Math.max(0, ...invoices.map(i => i.id)) + 1,
    };
    const updatedInvoices = [...invoices, newInvoice];
    setInvoices(updatedInvoices);
  };

  const updateInvoice = (id, updatedInvoice) => {
    const updatedInvoices = invoices.map(invoice =>
      invoice.id === id ? { ...invoice, ...updatedInvoice } : invoice
    );
    setInvoices(updatedInvoices);
  };

  const deleteInvoice = (id) => {
    const updatedInvoices = invoices.filter(invoice => invoice.id !== id);
    setInvoices(updatedInvoices);
  };

  // Context value
  const contextValue = {
    // 상태
    companyInfo,
    clients,
    workItems,
    invoices,
    
    // 상태 업데이트 함수
    setCompanyInfo,
    setClients,
    setWorkItems,
    setInvoices,
    
    // 유틸리티 함수
    resetAllData,
    
    // 클라이언트 관련 함수
    addClient,
    updateClient,
    deleteClient,
    
    // 작업 항목 관련 함수
    addWorkItem,
    updateWorkItem,
    deleteWorkItem,
    
    // 청구서 관련 함수
    addInvoice,
    updateInvoice,
    deleteInvoice
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
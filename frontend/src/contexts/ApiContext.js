import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  clientsApi, 
  projectsApi, 
  workLogsApi, 
  invoicesApi, 
  testApiConnection 
} from '../services/api';

// Context 생성
const ApiContext = createContext();

// Custom Hook for using context
export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};

// API Provider 컴포넌트
export const ApiProvider = ({ children }) => {
  // 상태 관리
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workLogs, setWorkLogs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiConnected, setApiConnected] = useState(false);

  // API 연결 상태 확인
  useEffect(() => {
    checkApiConnection();
  }, []);

  const checkApiConnection = async () => {
    try {
      setLoading(true);
      const result = await testApiConnection();
      setApiConnected(result.success);
      if (!result.success) {
        setError(`백엔드 서버 연결 실패: ${result.message}`);
      }
    } catch (err) {
      setApiConnected(false);
      setError(`API 연결 오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    if (apiConnected) {
      loadAllData();
    }
  }, [apiConnected]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 병렬로 모든 데이터 로드
      const [clientsData, projectsData, workLogsData, invoicesData] = await Promise.all([
        clientsApi.getAll(),
        projectsApi.getAll(),
        workLogsApi.getAll(),
        invoicesApi.getAll(),
      ]);

      setClients(clientsData);
      setProjects(projectsData);
      setWorkLogs(workLogsData);
      setInvoices(invoicesData);

    } catch (err) {
      setError(`데이터 로드 실패: ${err.message}`);
      console.error('Data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 클라이언트 관련 함수들
  const createClient = async (clientData) => {
    try {
      const newClient = await clientsApi.create(clientData);
      setClients(prev => [...prev, newClient]);
      return newClient;
    } catch (err) {
      setError(`클라이언트 생성 실패: ${err.message}`);
      throw err;
    }
  };

  const updateClient = async (clientId, clientData) => {
    try {
      const updatedClient = await clientsApi.update(clientId, clientData);
      setClients(prev => prev.map(client => 
        client.client_id === clientId ? updatedClient : client
      ));
      return updatedClient;
    } catch (err) {
      setError(`클라이언트 수정 실패: ${err.message}`);
      throw err;
    }
  };

  const deleteClient = async (clientId) => {
    try {
      await clientsApi.delete(clientId);
      setClients(prev => prev.filter(client => client.client_id !== clientId));
    } catch (err) {
      setError(`클라이언트 삭제 실패: ${err.message}`);
      throw err;
    }
  };

  // 프로젝트 관련 함수들
  const createProject = async (projectData) => {
    try {
      const newProject = await projectsApi.create(projectData);
      setProjects(prev => [...prev, newProject]);
      return newProject;
    } catch (err) {
      setError(`프로젝트 생성 실패: ${err.message}`);
      throw err;
    }
  };

  const updateProject = async (projectId, projectData) => {
    try {
      const updatedProject = await projectsApi.update(projectId, projectData);
      setProjects(prev => prev.map(project => 
        project.project_id === projectId ? updatedProject : project
      ));
      return updatedProject;
    } catch (err) {
      setError(`프로젝트 수정 실패: ${err.message}`);
      throw err;
    }
  };

  const deleteProject = async (projectId) => {
    try {
      await projectsApi.delete(projectId);
      setProjects(prev => prev.filter(project => project.project_id !== projectId));
    } catch (err) {
      setError(`프로젝트 삭제 실패: ${err.message}`);
      throw err;
    }
  };

  // 청구서 관련 함수들
  const createInvoice = async (invoiceData) => {
    try {
      const newInvoice = await invoicesApi.create(invoiceData);
      setInvoices(prev => [...prev, newInvoice]);
      return newInvoice;
    } catch (err) {
      setError(`청구서 생성 실패: ${err.message}`);
      throw err;
    }
  };

  const updateInvoice = async (invoiceId, invoiceData) => {
    try {
      const updatedInvoice = await invoicesApi.update(invoiceId, invoiceData);
      setInvoices(prev => prev.map(invoice => 
        invoice.invoice_id === invoiceId ? updatedInvoice : invoice
      ));
      return updatedInvoice;
    } catch (err) {
      setError(`청구서 수정 실패: ${err.message}`);
      throw err;
    }
  };

  const deleteInvoice = async (invoiceId) => {
    try {
      await invoicesApi.delete(invoiceId);
      setInvoices(prev => prev.filter(invoice => invoice.invoice_id !== invoiceId));
    } catch (err) {
      setError(`청구서 삭제 실패: ${err.message}`);
      throw err;
    }
  };

  // Context 값
  const contextValue = {
    // 데이터
    clients,
    projects,
    workLogs,
    invoices,
    
    // 상태
    loading,
    error,
    apiConnected,
    
    // 함수들
    loadAllData,
    checkApiConnection,
    
    // 클라이언트 관리
    createClient,
    updateClient,
    deleteClient,
    
    // 프로젝트 관리
    createProject,
    updateProject,
    deleteProject,
    
    // 청구서 관리
    createInvoice,
    updateInvoice,
    deleteInvoice,
    
    // 유틸리티
    clearError: () => setError(null),
  };

  return (
    <ApiContext.Provider value={contextValue}>
      {children}
    </ApiContext.Provider>
  );
};
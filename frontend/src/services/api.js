/**
 * API 서비스 - localStorage를 Supabase 백엔드 API로 대체
 */

// API 기본 설정
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// API 요청 헬퍼 함수
async function apiRequest(url, options = {}) {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(`${API_BASE_URL}${url}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.detail || `HTTP Error: ${response.status}`,
        response.status,
        errorData
      );
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Network Error: ${error.message}`, 0, error);
  }
}

// 클라이언트 API
export const clientsApi = {
  // 모든 클라이언트 조회
  async getAll() {
    return await apiRequest('/clients');
  },

  // 클라이언트 생성
  async create(clientData) {
    return await apiRequest('/clients', {
      method: 'POST',
      body: clientData,
    });
  },

  // 클라이언트 수정
  async update(clientId, clientData) {
    return await apiRequest(`/clients/${clientId}`, {
      method: 'PUT',
      body: clientData,
    });
  },

  // 클라이언트 삭제
  async delete(clientId) {
    return await apiRequest(`/clients/${clientId}`, {
      method: 'DELETE',
    });
  },

  // 클라이언트 상세 조회
  async getById(clientId) {
    return await apiRequest(`/clients/${clientId}`);
  }
};

// 프로젝트 API
export const projectsApi = {
  async getAll() {
    return await apiRequest('/projects');
  },

  async create(projectData) {
    return await apiRequest('/projects', {
      method: 'POST',
      body: projectData,
    });
  },

  async update(projectId, projectData) {
    return await apiRequest(`/projects/${projectId}`, {
      method: 'PUT',
      body: projectData,
    });
  },

  async delete(projectId) {
    return await apiRequest(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  },

  async getByClientId(clientId) {
    return await apiRequest(`/projects?client_id=${clientId}`);
  }
};

// 작업 로그 API
export const workLogsApi = {
  async getAll() {
    return await apiRequest('/work-logs');
  },

  async create(workLogData) {
    return await apiRequest('/work-logs', {
      method: 'POST',
      body: workLogData,
    });
  },

  async update(workLogId, workLogData) {
    return await apiRequest(`/work-logs/${workLogId}`, {
      method: 'PUT',
      body: workLogData,
    });
  },

  async delete(workLogId) {
    return await apiRequest(`/work-logs/${workLogId}`, {
      method: 'DELETE',
    });
  }
};

// 청구서 API
export const invoicesApi = {
  async getAll() {
    return await apiRequest('/invoices');
  },

  async create(invoiceData) {
    return await apiRequest('/invoices', {
      method: 'POST',
      body: invoiceData,
    });
  },

  async update(invoiceId, invoiceData) {
    return await apiRequest(`/invoices/${invoiceId}`, {
      method: 'PUT',
      body: invoiceData,
    });
  },

  async delete(invoiceId) {
    return await apiRequest(`/invoices/${invoiceId}`, {
      method: 'DELETE',
    });
  },

  async getById(invoiceId) {
    return await apiRequest(`/invoices/${invoiceId}`);
  }
};

// 집계 데이터 API
export const aggregationApi = {
  async getClientStats(clientId) {
    return await apiRequest(`/aggregation/clients/${clientId}/stats`);
  },

  async getDashboardStats() {
    return await apiRequest('/aggregation/dashboard');
  }
};

// API 연결 테스트
export async function testApiConnection() {
  try {
    await apiRequest('/health');
    return { success: true, message: 'API 연결 성공' };
  } catch (error) {
    return { 
      success: false, 
      message: `API 연결 실패: ${error.message}`,
      error 
    };
  }
}

export { ApiError };
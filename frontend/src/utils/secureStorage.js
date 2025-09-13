// 보안키 안전 저장을 위한 IndexedDB 유틸리티

class SecureStorage {
  constructor() {
    this.dbName = 'CMS_Security_DB';
    this.version = 1;
    this.storeName = 'security_keys';
  }

  // IndexedDB 초기화
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // 보안키 저장
  async saveSecurityKey(keyData) {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const data = {
        id: 'current_security_key',
        keyData: keyData,
        timestamp: Date.now(),
        encrypted: true
      };
      
      return new Promise((resolve, reject) => {
        const request = store.put(data);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to save security key:', error);
      return false;
    }
  }

  // 보안키 조회
  async getSecurityKey() {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.get('current_security_key');
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            resolve(result.keyData);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get security key:', error);
      return null;
    }
  }

  // 보안키 삭제
  async clearSecurityKey() {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.delete('current_security_key');
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to clear security key:', error);
      return false;
    }
  }

  // 전체 데이터베이스 삭제
  async clearAllSecurityData() {
    try {
      // IndexedDB 전체 삭제
      return new Promise((resolve, reject) => {
        const deleteRequest = indexedDB.deleteDatabase(this.dbName);
        deleteRequest.onsuccess = () => resolve(true);
        deleteRequest.onerror = () => reject(deleteRequest.error);
      });
    } catch (error) {
      console.error('Failed to clear all security data:', error);
      return false;
    }
  }

  // 보안키 검증 상태 확인
  async isSecurityKeyValid() {
    try {
      const keyData = await this.getSecurityKey();
      if (!keyData) return false;
      
      // 만료일 확인
      if (keyData.expiryDate) {
        const expiry = new Date(keyData.expiryDate);
        if (expiry < new Date()) {
          await this.clearSecurityKey();
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to validate security key:', error);
      return false;
    }
  }

  // 브라우저 캐시와 함께 완전 삭제 (FORCE_SECURITY_AUTH 플래그는 보존)
  async completeCleanup() {
    try {
      // FORCE_SECURITY_AUTH 플래그 임시 저장
      const forceAuthFlag = localStorage.getItem('FORCE_SECURITY_AUTH');
      
      // IndexedDB 삭제
      await this.clearAllSecurityData();
      
      // localStorage 삭제 (보안키 관련만)
      localStorage.removeItem('SECURITY_KEY_VERIFIED');
      localStorage.removeItem('VERIFIED_KEY_DATA');
      localStorage.removeItem('CURRENT_USER');
      
      // sessionStorage 삭제
      sessionStorage.clear();
      
      // FORCE_SECURITY_AUTH 플래그 복원
      if (forceAuthFlag) {
        localStorage.setItem('FORCE_SECURITY_AUTH', forceAuthFlag);
      }
      
      // 브라우저 캐시 정리 요청 (가능한 경우)
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      return true;
    } catch (error) {
      console.error('Failed to complete cleanup:', error);
      return false;
    }
  }
}

// 싱글톤 인스턴스
const secureStorage = new SecureStorage();

export default secureStorage;
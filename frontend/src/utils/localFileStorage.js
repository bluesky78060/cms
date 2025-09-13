// localFileStorage.js
// 로컬 폴더 기반 데이터 저장 유틸리티

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

class LocalFileStorage {
  constructor(dataPath) {
    this.dataPath = dataPath;
    this.initialized = false;
  }

  // 초기화 확인
  ensureInitialized() {
    if (!this.initialized) {
      throw new Error('LocalFileStorage가 초기화되지 않았습니다. init()을 먼저 호출하세요.');
    }
  }

  // 초기화
  async init() {
    if (!this.dataPath) {
      throw new Error('데이터 경로가 설정되지 않았습니다.');
    }
    this.initialized = true;
  }

  // 사용자별 데이터 파일 경로 생성
  getUserDataPath(username, dataType) {
    return path.join(this.dataPath, 'users', `${username}_${dataType}.json`);
  }

  // 사용자별 데이터 저장
  async setUserData(username, dataType, data) {
    this.ensureInitialized();
    
    try {
      const filePath = this.getUserDataPath(username, dataType);
      const dirPath = path.dirname(filePath);
      
      // 사용자 폴더가 없으면 생성
      await fsp.mkdir(dirPath, { recursive: true });
      
      // 데이터에 메타데이터 추가
      const fileData = {
        username,
        dataType,
        data,
        lastUpdated: new Date().toISOString(),
        version: '1.0.0'
      };
      
      await fsp.writeFile(filePath, JSON.stringify(fileData, null, 2), 'utf-8');
      console.log(`✅ 저장 완료: ${username}/${dataType}`);
      
      return true;
    } catch (error) {
      console.error(`❌ 저장 실패: ${username}/${dataType}`, error);
      throw error;
    }
  }

  // 사용자별 데이터 조회
  async getUserData(username, dataType, defaultValue = null) {
    this.ensureInitialized();
    
    try {
      const filePath = this.getUserDataPath(username, dataType);
      
      // 파일이 없으면 기본값 반환
      if (!await this.exists(filePath)) {
        return defaultValue;
      }
      
      const fileContent = await fsp.readFile(filePath, 'utf-8');
      const fileData = JSON.parse(fileContent);
      
      // 데이터 검증
      if (fileData.username !== username || fileData.dataType !== dataType) {
        console.warn(`⚠️ 데이터 불일치: ${filePath}`);
        return defaultValue;
      }
      
      return fileData.data;
    } catch (error) {
      console.error(`❌ 조회 실패: ${username}/${dataType}`, error);
      return defaultValue;
    }
  }

  // 사용자 데이터 삭제
  async removeUserData(username, dataType) {
    this.ensureInitialized();
    
    try {
      const filePath = this.getUserDataPath(username, dataType);
      
      if (await this.exists(filePath)) {
        await fsp.rm(filePath);
        console.log(`🗑️ 삭제 완료: ${username}/${dataType}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`❌ 삭제 실패: ${username}/${dataType}`, error);
      throw error;
    }
  }

  // 사용자 전체 데이터 삭제
  async removeAllUserData(username) {
    this.ensureInitialized();
    
    try {
      const userDir = path.join(this.dataPath, 'users');
      const files = await fsp.readdir(userDir);
      
      const userFiles = files.filter(file => file.startsWith(`${username}_`));
      
      await Promise.all(
        userFiles.map(file => 
          fsp.rm(path.join(userDir, file)).catch(console.error)
        )
      );
      
      console.log(`🗑️ 사용자 전체 데이터 삭제 완료: ${username}`);
      return true;
    } catch (error) {
      console.error(`❌ 사용자 데이터 삭제 실패: ${username}`, error);
      throw error;
    }
  }

  // 사용자 목록 조회
  async getAllUsers() {
    this.ensureInitialized();
    
    try {
      const userDir = path.join(this.dataPath, 'users');
      
      if (!await this.exists(userDir)) {
        return [];
      }
      
      const files = await fsp.readdir(userDir);
      const users = new Set();
      
      // 파일명에서 사용자명 추출
      files.forEach(file => {
        if (file.includes('_') && file.endsWith('.json')) {
          const username = file.split('_')[0];
          users.add(username);
        }
      });
      
      return Array.from(users);
    } catch (error) {
      console.error('❌ 사용자 목록 조회 실패:', error);
      return [];
    }
  }

  // 백업 생성
  async createBackup(username = null) {
    this.ensureInitialized();
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = username 
        ? `backup_${username}_${timestamp}.json`
        : `backup_all_${timestamp}.json`;
      
      const backupPath = path.join(this.dataPath, 'backups', backupName);
      await fsp.mkdir(path.dirname(backupPath), { recursive: true });
      
      let backupData = {
        createdAt: new Date().toISOString(),
        type: username ? 'user' : 'all',
        data: {}
      };
      
      if (username) {
        // 특정 사용자 백업
        const dataTypes = ['CLIENTS', 'WORK_ITEMS', 'INVOICES', 'ESTIMATES', 'COMPANY_INFO'];
        for (const dataType of dataTypes) {
          const data = await this.getUserData(username, dataType);
          if (data !== null) {
            backupData.data[dataType] = data;
          }
        }
      } else {
        // 전체 백업
        const users = await this.getAllUsers();
        for (const user of users) {
          backupData.data[user] = {};
          const dataTypes = ['CLIENTS', 'WORK_ITEMS', 'INVOICES', 'ESTIMATES', 'COMPANY_INFO'];
          for (const dataType of dataTypes) {
            const data = await this.getUserData(user, dataType);
            if (data !== null) {
              backupData.data[user][dataType] = data;
            }
          }
        }
      }
      
      await fsp.writeFile(backupPath, JSON.stringify(backupData, null, 2), 'utf-8');
      console.log(`💾 백업 생성 완료: ${backupPath}`);
      
      return backupPath;
    } catch (error) {
      console.error('❌ 백업 생성 실패:', error);
      throw error;
    }
  }

  // 백업 복원
  async restoreBackup(backupPath) {
    this.ensureInitialized();
    
    try {
      if (!await this.exists(backupPath)) {
        throw new Error(`백업 파일을 찾을 수 없습니다: ${backupPath}`);
      }
      
      const backupContent = await fsp.readFile(backupPath, 'utf-8');
      const backupData = JSON.parse(backupContent);
      
      if (backupData.type === 'user') {
        // 사용자별 복원 로직 구현 필요
        throw new Error('사용자별 백업 복원은 아직 구현되지 않았습니다.');
      } else {
        // 전체 복원
        for (const [username, userData] of Object.entries(backupData.data)) {
          for (const [dataType, data] of Object.entries(userData)) {
            await this.setUserData(username, dataType, data);
          }
        }
      }
      
      console.log(`📂 백업 복원 완료: ${backupPath}`);
      return true;
    } catch (error) {
      console.error('❌ 백업 복원 실패:', error);
      throw error;
    }
  }

  // localStorage에서 마이그레이션
  async migrateFromLocalStorage() {
    this.ensureInitialized();
    
    try {
      // 브라우저 환경에서는 localStorage 접근 불가
      if (typeof window === 'undefined' || !window.localStorage) {
        console.log('localStorage를 사용할 수 없습니다.');
        return false;
      }
      
      console.log('🔄 localStorage에서 데이터를 마이그레이션합니다...');
      
      // 시스템 사용자 목록 조회
      const systemUsers = JSON.parse(localStorage.getItem('SYSTEM_USERS') || '{}');
      
      for (const username of Object.keys(systemUsers)) {
        console.log(`마이그레이션 중: ${username}`);
        
        // 각 데이터 타입 마이그레이션
        const dataTypes = ['CLIENTS', 'WORK_ITEMS', 'INVOICES', 'ESTIMATES', 'COMPANY_INFO'];
        
        for (const dataType of dataTypes) {
          const key = `USER_${username}_${dataType}`;
          const data = localStorage.getItem(key);
          
          if (data) {
            try {
              const parsedData = JSON.parse(data);
              await this.setUserData(username, dataType, parsedData);
            } catch (parseError) {
              console.warn(`데이터 파싱 실패: ${key}`, parseError);
            }
          }
        }
      }
      
      // 시스템 사용자 정보도 저장
      for (const [username, userInfo] of Object.entries(systemUsers)) {
        await this.setUserData(username, 'USER_INFO', userInfo);
      }
      
      console.log('✅ localStorage 마이그레이션 완료');
      return true;
    } catch (error) {
      console.error('❌ localStorage 마이그레이션 실패:', error);
      throw error;
    }
  }

  // 파일 존재 여부 확인
  async exists(filePath) {
    try {
      await fsp.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  // 데이터 폴더 정보
  getInfo() {
    return {
      dataPath: this.dataPath,
      initialized: this.initialized
    };
  }
}

module.exports = LocalFileStorage;
# 고급 보안키 시스템 구현 계획

## 개요
컴퓨터 고유 정보를 이용한 보안키 바인딩 시스템으로, 키 복사를 완전 차단하고 암호화를 통해 안전하게 보관하는 방법

## 🔒 컴퓨터 고유 정보 기반 바인딩

### 1. 브라우저/시스템 고유 정보 수집
- **Canvas Fingerprinting**: 브라우저가 그래픽을 렌더링하는 방식의 고유성
- **WebGL Fingerprinting**: GPU 및 드라이버 정보
- **AudioContext Fingerprinting**: 오디오 처리 방식의 차이
- **Screen Resolution + Color Depth**: 디스플레이 고유 정보
- **Timezone + Language**: 시스템 설정 조합
- **Hardware Info**: CPU 코어 수, 메모리, 플랫폼 정보

### 2. 브라우저 고유 저장소 활용
- **IndexedDB**: 대용량 데이터 저장
- **localStorage**: 도메인별 영구 저장
- **sessionStorage**: 세션별 임시 저장
- **Cookies**: 만료일 설정 가능

## 🛡️ 암호화 및 보안 방법

### 1. 키 바인딩 프로세스
```
1. 보안키 업로드
2. 컴퓨터 고유 정보 수집 (fingerprint)
3. 보안키 + 고유정보 → 해시 생성
4. 암호화된 바인딩 키 생성 및 저장
```

### 2. 암호화 기술
- **AES-256**: 보안키 데이터 암호화
- **SHA-256**: 고유정보 해싱
- **PBKDF2**: 키 파생 함수
- **Salt**: 무작위 값 추가로 보안 강화

### 3. 검증 프로세스
```
1. 로그인 시도
2. 현재 컴퓨터 고유정보 수집
3. 저장된 암호화 키와 비교
4. 일치하면 접근 허용, 불일치하면 거부
```

## 🚫 복사 방지 메커니즘

### 1. 하드웨어 바인딩
- 고유정보가 다르면 복호화 실패
- 다른 컴퓨터에서는 키가 무용지물

### 2. 타임스탬프 검증
- 첫 등록 시간 기록
- 동시 다중 접속 감지 및 차단

### 3. 사용 패턴 분석
- IP 주소 변화 감지
- 비정상적인 접근 패턴 차단

## ⚡ 구현 가능성

### 장점
- ✅ 100% 순수 JavaScript로 구현 가능
- ✅ 서버 없이 클라이언트만으로 동작
- ✅ 매우 강력한 보안 수준
- ✅ 키 복사 완전 차단

### 단점
- ⚠️ 브라우저 업데이트 시 fingerprint 변경 가능
- ⚠️ 하드웨어 교체 시 재등록 필요
- ⚠️ 구현 복잡도 증가

## 📋 상세 구현 계획

### Phase 1: Fingerprinting 시스템
```javascript
// 컴퓨터 고유 정보 수집 함수
const generateFingerprint = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('CMS Fingerprint', 2, 2);
  
  const fingerprint = {
    canvas: canvas.toDataURL(),
    screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    cores: navigator.hardwareConcurrency,
    memory: navigator.deviceMemory
  };
  
  return btoa(JSON.stringify(fingerprint));
};
```

### Phase 2: 암호화 바인딩 시스템
```javascript
// 보안키를 컴퓨터에 바인딩
const bindSecurityKey = async (securityKeyData, fingerprint) => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(fingerprint + securityKeyData.keyId),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    derivedKey,
    new TextEncoder().encode(JSON.stringify(securityKeyData))
  );
  
  return {
    encrypted: Array.from(new Uint8Array(encrypted)),
    salt: Array.from(salt),
    iv: Array.from(iv),
    fingerprint: await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fingerprint))
  };
};
```

### Phase 3: 검증 시스템
```javascript
// 저장된 바인딩된 키 검증
const verifyBoundKey = async (boundKey, currentFingerprint) => {
  try {
    const fingerprintHash = await crypto.subtle.digest(
      'SHA-256', 
      new TextEncoder().encode(currentFingerprint)
    );
    
    // Fingerprint 일치 확인
    const storedHash = new Uint8Array(boundKey.fingerprint);
    const currentHash = new Uint8Array(fingerprintHash);
    
    if (!storedHash.every((val, i) => val === currentHash[i])) {
      throw new Error('컴퓨터 정보가 일치하지 않습니다');
    }
    
    // 키 복호화 시도
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(currentFingerprint),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new Uint8Array(boundKey.salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(boundKey.iv) },
      derivedKey,
      new Uint8Array(boundKey.encrypted)
    );
    
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch (error) {
    return null; // 검증 실패
  }
};
```

## 🔐 보안 레벨

### Level 1: 기본 파일 인증 (현재)
- 보안키 파일 업로드
- localStorage 저장
- 기본적인 복사 방지

### Level 2: 컴퓨터 바인딩 (계획)
- 하드웨어 fingerprinting
- 암호화된 키 저장
- 완전한 복사 방지

### Level 3: 고급 보안 (미래)
- 행동 패턴 분석
- 시간 기반 토큰
- 다중 인증 요소

## 📝 구현 시 고려사항

### 1. 사용자 경험
- 하드웨어 변경 시 재등록 프로세스
- 브라우저 업데이트 대응
- 명확한 오류 메시지

### 2. 백업 및 복구
- 관리자 마스터 키 시스템
- 긴급 접근 코드
- 키 재발급 프로세스

### 3. 성능 최적화
- Fingerprint 생성 속도
- 암호화/복호화 성능
- 저장 공간 효율성

## 🚀 결론

이 시스템을 구현하면:
- **보안**: 키 복사가 완전 불가능
- **편의성**: 한 번 설정 후 자동 인증
- **안정성**: 암호화된 안전한 저장
- **확장성**: 추가 보안 기능 확장 가능

**추천 구현 순서**: Phase 1 → Phase 2 → Phase 3
**예상 개발 시간**: 2-3주 (테스트 포함)
**보안 등급**: 엔터프라이즈급 보안 수준

---
*작성일: 2024-09-11*
*작성자: Claude Code Assistant*
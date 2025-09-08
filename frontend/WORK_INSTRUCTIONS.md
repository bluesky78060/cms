# 건설 청구서 관리 시스템 - 작업 지시서

## 📋 프로젝트 개요

**프로젝트명**: 건설 청구서 관리 시스템  
**목적**: 건축업자가 건축주에게 작업 완료 후 청구서를 생성하고 관리하는 웹 애플리케이션  
**기술 스택**: React 18, Tailwind CSS, Electron  
**개발 환경**: Node.js 14+, npm  

## 🏗️ 프로젝트 구조

```
frontend/
├── public/
│   ├── index.html          # HTML 템플릿
│   └── electron.js         # Electron 메인 프로세스
├── src/
│   ├── components/         # React 컴포넌트들
│   │   ├── App.js         # 메인 앱 컴포넌트
│   │   ├── Navbar.js      # 네비게이션 바
│   │   ├── Dashboard.js   # 대시보드 화면
│   │   ├── Invoices.js    # 청구서 관리
│   │   ├── Clients.js     # 건축주 관리
│   │   └── WorkItems.js   # 작업 항목 관리
│   ├── App.css           # 전역 스타일
│   └── index.js          # 앱 엔트리 포인트
├── package.json          # 의존성 및 스크립트
├── tailwind.config.js    # Tailwind CSS 설정
├── README.md            # 사용법 가이드
├── DEPLOYMENT.md        # 배포 가이드
└── WORK_INSTRUCTIONS.md # 이 파일
```

## 🔧 개발 환경 설정

### 1. 초기 설정
```bash
# 프로젝트 폴더로 이동
cd /Users/leechanhee/construction-management-system/frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm start
```

### 2. 개발 서버 접속
- 웹: http://localhost:3000
- Electron: `npm run electron-dev`

## 📁 주요 컴포넌트 설명

### App.js
- **위치**: `src/App.js`
- **역할**: 메인 라우터, 페이지 간 네비게이션
- **라우트**:
  - `/` → Dashboard
  - `/invoices` → Invoices
  - `/clients` → Clients
  - `/work-items` → WorkItems

### Dashboard.js
- **위치**: `src/components/Dashboard.js`
- **기능**: 전체 현황 대시보드
- **데이터**: 하드코딩된 통계, 최근 청구서 목록

### Invoices.js
- **위치**: `src/components/Invoices.js`
- **주요 기능**:
  - 청구서 목록 표시
  - 새 청구서 생성
  - PDF 생성 (react-to-print 사용)
  - 청구서 삭제
- **상태 관리**: useState로 로컬 상태

### Clients.js
- **위치**: `src/components/Clients.js`
- **주요 기능**:
  - 건축주 목록 관리
  - 새 건축주 추가
  - 작업장 정보 관리 (여러 작업장 지원)
  - 건축주 상세 정보 보기

### WorkItems.js
- **위치**: `src/components/WorkItems.js`
- **주요 기능**:
  - 작업 항목 관리
  - 건축주별 필터링
  - 작업장 선택 기능
  - 작업 상태 추적

## 🛠️ 수정/편집 가이드

### A. 새로운 기능 추가

#### 1. 새 페이지 추가
```bash
# 1. 새 컴포넌트 파일 생성
touch src/components/NewPage.js

# 2. 컴포넌트 기본 구조 작성
# 3. App.js에 라우트 추가
# 4. Navbar.js에 메뉴 링크 추가
```

#### 2. 새 기능 추가 절차
1. **컴포넌트 파일 수정**
2. **상태 관리 추가** (useState 사용)
3. **UI 컴포넌트 추가** (Tailwind CSS 클래스 사용)
4. **이벤트 핸들러 구현**
5. **테스트 및 확인**

### B. 디자인 수정

#### 1. 색상 변경
- **위치**: Tailwind CSS 클래스 수정
- **예시**: `bg-blue-500` → `bg-green-500`

#### 2. 레이아웃 변경
- **Grid**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- **Flex**: `flex justify-between items-center`
- **Spacing**: `p-6 m-4 gap-4`

### C. 데이터 구조 수정

#### 1. 청구서 데이터 구조
```javascript
{
  id: 'INV-2024-001',
  client: '건축주명',
  project: '프로젝트명',
  workplaceAddress: '작업장 주소',
  amount: 총금액,
  status: '상태',
  date: '발행일',
  dueDate: '지불기한',
  workItems: [작업항목배열]
}
```

#### 2. 건축주 데이터 구조
```javascript
{
  id: 숫자,
  name: '건축주명',
  phone: '전화번호',
  email: '이메일',
  address: '주소',
  workplaces: [
    {
      id: 숫자,
      name: '작업장명',
      address: '작업장 주소',
      description: '설명'
    }
  ],
  projects: ['프로젝트 목록'],
  totalBilled: 총청구액,
  outstanding: 미수금,
  notes: '메모'
}
```

## 🔍 일반적인 수정 작업들

### 1. 텍스트 수정
**파일**: 각 컴포넌트 내 JSX 부분
```javascript
// 예시
<h1 className="text-3xl font-bold">기존 제목</h1>
<h1 className="text-3xl font-bold">새로운 제목</h1>
```

### 2. 버튼 기능 추가
```javascript
// 새 함수 추가
const handleNewFunction = () => {
  // 기능 구현
};

// 버튼에 연결
<button onClick={handleNewFunction}>
  새 기능
</button>
```

### 3. 폼 필드 추가
```javascript
// 상태에 새 필드 추가
const [formData, setFormData] = useState({
  기존필드: '',
  새필드: ''
});

// 입력 핸들러에 새 필드 처리 추가
const handleInputChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));
};

// JSX에 새 입력 필드 추가
<input
  name="새필드"
  value={formData.새필드}
  onChange={handleInputChange}
/>
```

### 4. 테이블 컬럼 추가
```javascript
// 테이블 헤더에 새 컬럼 추가
<th>새 컬럼</th>

// 테이블 바디에 새 데이터 셀 추가
<td>{item.새필드}</td>
```

## 🎨 스타일 수정 가이드

### Tailwind CSS 주요 클래스
- **색상**: `bg-blue-500`, `text-red-600`, `border-gray-300`
- **크기**: `w-full`, `h-64`, `p-4`, `m-2`
- **레이아웃**: `flex`, `grid`, `justify-center`, `items-center`
- **반응형**: `sm:`, `md:`, `lg:`, `xl:`

### 자주 사용되는 클래스 조합
```css
/* 카드 스타일 */
bg-white rounded-lg shadow p-6

/* 버튼 스타일 */
bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded

/* 입력 필드 */
border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500

/* 테이블 */
min-w-full divide-y divide-gray-200
```

## 📦 빌드 및 배포

### 개발 중 테스트
```bash
# 웹 앱 실행
npm start

# Electron 앱 실행
npm run electron-dev

# 프로덕션 빌드 테스트
npm run build
```

### 배포용 빌드
```bash
# 웹 앱 배포용 빌드
npm run build

# Windows 설치파일
npm run dist-win

# Mac 설치파일
npm run dist-mac

# 둘 다 생성
npm run dist-all
```

## 🐛 문제 해결

### 자주 발생하는 문제들

#### 1. 포트 충돌
```bash
# 다른 포트 사용
npm start -- --port 3001
```

#### 2. 의존성 오류
```bash
# 노드 모듈 재설치
rm -rf node_modules package-lock.json
npm install
```

#### 3. 빌드 오류
```bash
# 린트 오류 확인
npm run build

# 오류 메시지에 따라 코드 수정
```

#### 4. Electron 실행 오류
- Node.js 버전 확인 (v14+ 필요)
- 보안 소프트웨어 예외 설정
- 관리자 권한으로 실행

## 📝 코드 컨벤션

### JavaScript
- **함수명**: camelCase (`handleSubmit`)
- **컴포넌트명**: PascalCase (`WorkItems`)
- **상수명**: UPPER_CASE (`API_URL`)

### React
- **Hook 사용**: 함수형 컴포넌트 + useState, useEffect
- **Props**: 구조 분해 할당 사용
- **이벤트 핸들러**: `handle`로 시작

### CSS/Tailwind
- **클래스 순서**: 레이아웃 → 크기 → 색상 → 기타
- **반응형**: mobile-first 접근법

## 🔄 버전 관리

### Git 커밋 메시지 형식
```
feat: 새로운 기능 추가
fix: 버그 수정
style: 디자인 변경
refactor: 코드 리팩토링
docs: 문서 수정
```

### 브랜치 전략
- `main`: 안정 버전
- `develop`: 개발 중인 버전
- `feature/기능명`: 새 기능 개발

## 📞 추가 지원

### 개발 도구
- **VS Code**: 추천 에디터
- **확장 프로그램**: ES7+ React/Redux/React-Native snippets, Tailwind CSS IntelliSense
- **브라우저**: Chrome DevTools

### 참고 문서
- [React 공식 문서](https://reactjs.org/docs)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [Electron 문서](https://www.electronjs.org/docs)

---

## ⚠️ 중요 참고사항

1. **백업**: 수정 전 항상 코드 백업
2. **테스트**: 변경 사항은 반드시 테스트
3. **문서화**: 주요 변경사항 문서 업데이트
4. **의존성**: 새 패키지 설치 시 package.json 확인

이 지시서를 참고하여 프로젝트를 효율적으로 유지보수하고 확장할 수 있습니다.
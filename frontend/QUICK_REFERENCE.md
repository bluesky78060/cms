# 빠른 참조 가이드

## 🚀 즉시 실행하기

### 개발 서버 실행
```bash
cd /Users/leechanhee/construction-management-system/frontend
npm start
```
→ http://localhost:3000

### Electron 데스크톱 앱
```bash
npm run electron-dev
```

## 📝 주요 파일 위치

### 컴포넌트 파일들
- **대시보드**: `src/components/Dashboard.js`
- **청구서**: `src/components/Invoices.js` 
- **건축주**: `src/components/Clients.js`
- **작업항목**: `src/components/WorkItems.js`
- **네비게이션**: `src/components/Navbar.js`

### 설정 파일들
- **메인 앱**: `src/App.js`
- **패키지 정보**: `package.json`
- **Electron**: `public/electron.js`

## 🔧 자주 하는 수정

### 1. 텍스트 변경
```javascript
// 파일: src/components/Dashboard.js 등
<h1 className="text-3xl font-bold">기존 텍스트</h1>
<h1 className="text-3xl font-bold">새 텍스트</h1>
```

### 2. 색상 변경
```javascript
// Tailwind 클래스 변경
className="bg-blue-500"  →  className="bg-red-500"
className="text-green-600"  →  className="text-purple-600"
```

### 3. 새 메뉴 추가
```javascript
// 파일: src/components/Navbar.js
<Link to="/새경로" className="nav-link">새 메뉴</Link>

// 파일: src/App.js
<Route path="/새경로" element={<새컴포넌트 />} />
```

### 4. 새 필드 추가 (예: 청구서에 새 필드)
```javascript
// 1. 상태에 필드 추가
const [newInvoice, setNewInvoice] = useState({
  기존필드: '',
  새필드: ''  // 추가
});

// 2. 폼에 입력 필드 추가
<input
  name="새필드"
  value={newInvoice.새필드}
  onChange={(e) => setNewInvoice({...newInvoice, 새필드: e.target.value})}
/>

// 3. 테이블에 컬럼 추가
<th>새 컬럼</th>
<td>{invoice.새필드}</td>
```

## 🎨 색상 코드

### 주요 색상들
- **Primary**: `bg-blue-500`, `text-blue-600`
- **Success**: `bg-green-500`, `text-green-600` 
- **Warning**: `bg-yellow-500`, `text-yellow-600`
- **Error**: `bg-red-500`, `text-red-600`
- **Gray**: `bg-gray-100`, `text-gray-600`

### 상태별 색상
- **결제완료**: `bg-green-100 text-green-800`
- **발송됨**: `bg-blue-100 text-blue-800`
- **미결제**: `bg-red-100 text-red-800`
- **발송대기**: `bg-yellow-100 text-yellow-800`

## 📋 데이터 구조 요약

### 청구서
```javascript
{
  id: 'INV-2024-001',
  client: '김철수',
  project: '단독주택 신축', 
  workplaceAddress: '서울시 강남구...',
  amount: 8500000,
  status: '발송됨',
  workItems: [...작업항목들]
}
```

### 건축주
```javascript
{
  id: 1,
  name: '김철수',
  workplaces: [
    {id: 1, name: '신축 주택', address: '...'}
  ]
}
```

## 🛠️ 자주 사용하는 명령어

### 개발
```bash
npm start                # 개발 서버
npm run build           # 프로덕션 빌드
npm run electron-dev    # Electron 개발모드
```

### 배포
```bash
npm run dist-win        # Windows 설치파일
npm run dist-mac        # Mac 설치파일
npm run dist-all        # 둘 다 생성
```

### 문제 해결
```bash
rm -rf node_modules package-lock.json
npm install             # 의존성 재설치

npm start -- --port 3001  # 다른 포트 사용
```

## 🐛 자주 발생하는 오류

### 1. 포트 사용중 오류
```
Something is already running on port 3000
```
**해결**: 다른 터미널에서 `npm start` 종료 또는 `npm start -- --port 3001`

### 2. 의존성 오류
```
Module not found
```
**해결**: `npm install` 재실행

### 3. PDF 생성 안됨
**확인사항**: 브라우저 팝업 차단, 콘솔 오류 메시지

### 4. Electron 실행 안됨
**확인사항**: Node.js 버전, 보안 소프트웨어 설정

## 📁 중요 폴더들

```
frontend/
├── src/components/     # 모든 React 컴포넌트
├── public/            # 정적 파일들
├── build/            # 빌드 결과물
├── dist/             # Electron 배포 파일
└── node_modules/     # 의존성 패키지들
```

## 📞 추가 도움

### 문서들
- **README.md**: 기본 사용법
- **WORK_INSTRUCTIONS.md**: 상세 개발 가이드
- **DEPLOYMENT.md**: 배포 방법들
- **PROJECT_SUMMARY.md**: 프로젝트 전체 요약

### 개발자 도구
- **브라우저**: F12 → Console에서 오류 확인
- **VS Code**: 추천 에디터
- **확장**: Tailwind CSS IntelliSense 설치 권장

---

**💡 팁**: 변경사항은 항상 `npm start`로 테스트 후 적용!
# 🚀 Supabase 데이터베이스 설정 가이드

이 가이드는 건설관리시스템을 localStorage에서 Supabase 클라우드 데이터베이스로 마이그레이션하는 방법을 설명합니다.

## 📋 사전 준비

- [x] Supabase 계정 (supabase.com)
- [x] Node.js 및 npm 설치
- [x] Python 3.8+ 설치

## 🔧 1단계: Supabase 프로젝트 설정

### 1.1 Supabase 계정 생성
1. [supabase.com](https://supabase.com)에서 계정 생성
2. **"New Project"** 클릭
3. 프로젝트 정보 입력:
   - **Organization**: 개인 계정 선택
   - **Name**: `construction-management`
   - **Database Password**: **강한 비밀번호 설정** (꼭 기억해 두세요!)
   - **Region**: `Northeast Asia (Seoul)` 선택

### 1.2 연결 정보 확인
1. 프로젝트 대시보드에서 **Settings** → **Database** 이동
2. **Connection string** 섹션에서 **URI** 복사
3. 형태: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

## 🔧 2단계: 백엔드 환경 설정

### 2.1 환경 변수 설정
`backend/.env` 파일을 수정하세요:

```bash
# .env 파일
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
ENVIRONMENT=development
DEBUG=True
CORS_ORIGINS=["http://localhost:3000", "http://localhost:3001"]
```

**⚠️ 중요**: `YOUR_PASSWORD`와 `YOUR_PROJECT_REF`를 실제 값으로 교체하세요!

### 2.2 Python 의존성 설치
```bash
cd backend
pip install -r requirements.txt
```

## 🗄️ 3단계: 데이터베이스 테이블 생성

### 3.1 연결 테스트 및 테이블 생성
```bash
cd backend
python setup_database.py
```

성공하면 다음과 같은 메시지가 표시됩니다:
```
✅ Supabase PostgreSQL 연결 성공!
✅ 데이터베이스 테이블 생성 성공!
```

### 3.2 문제 해결
연결에 실패하는 경우:
1. `.env` 파일의 `DATABASE_URL` 확인
2. Supabase 대시보드에서 연결 정보 재확인
3. 비밀번호에 특수문자가 있다면 URL 인코딩 필요

## 🚀 4단계: 백엔드 서버 시작

```bash
cd backend
python run_server.py
```

서버가 `http://localhost:8000`에서 실행됩니다.

## 🌐 5단계: 프론트엔드 환경 설정

### 5.1 환경 변수 설정
`frontend/.env` 파일을 생성하세요:

```bash
# frontend/.env
REACT_APP_API_URL=http://localhost:8000/api
```

### 5.2 프론트엔드 서버 시작
```bash
cd frontend
npm start
```

## 📁 6단계: 데이터 마이그레이션

### 6.1 마이그레이션 패널 접속
1. 프론트엔드가 실행되면 브라우저에서 마이그레이션 패널 컴포넌트를 임시로 추가
2. 또는 브라우저 콘솔에서 직접 마이그레이션 실행:

```javascript
// 브라우저 콘솔에서 실행
import { migrateLocalStorageToSupabase } from './utils/dataMigration.js';
migrateLocalStorageToSupabase().then(console.log);
```

### 6.2 마이그레이션 과정
1. **API 연결 테스트**: 백엔드 서버 연결 확인
2. **로컬 데이터 확인**: localStorage에서 마이그레이션할 데이터 확인
3. **데이터 백업**: 기존 데이터를 JSON 파일로 백업
4. **마이그레이션 실행**: 
   - 클라이언트 → Supabase clients 테이블
   - 작업장 → Supabase projects 테이블
   - 청구서 → Supabase invoices 테이블

## 🔍 7단계: 마이그레이션 확인

### 7.1 Supabase 대시보드에서 확인
1. Supabase 프로젝트 대시보드
2. **Table Editor** 이동
3. 테이블별 데이터 확인:
   - `clients`: 고객 정보
   - `projects`: 프로젝트 정보
   - `invoices`: 청구서 정보

### 7.2 애플리케이션에서 확인
1. 프론트엔드에서 데이터가 정상 표시되는지 확인
2. CRUD 기능 (생성, 수정, 삭제) 테스트

## ✅ 완료!

이제 건설관리시스템이 Supabase 클라우드 데이터베이스를 사용합니다!

### 장점
- ✅ **영구 저장**: 브라우저를 닫아도 데이터 유지
- ✅ **다중 기기**: 여러 기기에서 동시 접속 가능
- ✅ **실시간 동기화**: 데이터 변경 시 즉시 반영
- ✅ **백업**: 자동 백업 및 복원
- ✅ **확장성**: 사용량 증가에 따른 자동 확장

## 🛠️ 문제 해결

### 일반적인 오류들

#### 1. "연결 거부됨" 오류
- 백엔드 서버가 실행 중인지 확인
- 포트 8000이 다른 프로세스에서 사용 중인지 확인

#### 2. "인증 실패" 오류
- `.env` 파일의 비밀번호 확인
- Supabase 대시보드에서 비밀번호 재설정

#### 3. "테이블이 존재하지 않음" 오류
- `setup_database.py` 스크립트 재실행
- Alembic 마이그레이션 상태 확인

### 지원

문제가 지속되면 다음을 확인하세요:
1. 백엔드 로그: `backend/` 폴더에서 서버 로그 확인
2. 브라우저 콘솔: 프론트엔드 오류 메시지 확인
3. Supabase 로그: Supabase 대시보드의 로그 섹션 확인
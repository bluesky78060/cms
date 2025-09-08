# 건설업 현장 관리 시스템 설치 가이드

## 개발 환경 요구사항

- Python 3.9+
- Node.js 16+
- npm or yarn

## 백엔드 설정

### 1. 가상환경 생성 및 활성화

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux  
source venv/bin/activate
```

### 2. 의존성 설치

```bash
pip install -r requirements.txt
```

### 3. 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 편집하여 데이터베이스 연결 정보 등을 설정:

```env
DATABASE_URL=sqlite:///./construction.db
SECRET_KEY=your-secret-key-here
```

### 4. 데이터베이스 초기화

```bash
# Alembic을 이용한 마이그레이션 (선택사항)
# alembic init alembic
# alembic revision --autogenerate -m "Initial migration"
# alembic upgrade head

# 또는 앱 실행시 자동 생성됨
```

### 5. 개발 서버 실행

```bash
python run_server.py
```

API 서버가 http://localhost:8000 에서 실행됩니다.

## 프론트엔드 설정

### 1. 의존성 설치

```bash
cd frontend
npm install
```

### 2. 환경변수 설정 (선택사항)

`.env.local` 파일 생성:

```env
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

### 3. 개발 서버 실행

```bash
npm start
```

React 앱이 http://localhost:3000 에서 실행됩니다.

## API 문서 확인

백엔드 서버 실행 후 다음 URL에서 API 문서를 확인할 수 있습니다:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 주요 API 엔드포인트

### 기본 CRUD
- `GET /api/clients` - 거래처 목록
- `POST /api/clients` - 거래처 생성
- `GET /api/projects` - 현장 목록
- `POST /api/work-logs` - 작업일지 생성

### 비용 집계 및 청구서
- `GET /api/aggregation/projects/{project_id}/cost-summary` - 프로젝트 비용 집계
- `POST /api/aggregation/projects/{project_id}/generate-invoice` - 청구서 자동 생성

### PDF 내보내기
- `GET /api/export/invoices/{invoice_id}/pdf` - 청구서 PDF 다운로드
- `GET /api/export/test-pdf` - PDF 생성 테스트

### 참조 데이터
- `GET /api/reference/equipment-types` - 건설기계 27종 목록
- `GET /api/reference/trades` - 표준 직종 목록
- `GET /api/reference/work-items` - 표준 작업항목 목록

## 개발 팁

### 1. 데이터베이스 초기화

SQLite 데이터베이스를 새로 만들려면:

```bash
rm construction.db
python run_server.py  # 새 DB 자동 생성
```

### 2. 샘플 데이터 삽입

API를 통해 샘플 데이터를 삽입하거나, 별도의 시드 스크립트를 작성할 수 있습니다.

### 3. 코드 수정시 자동 리로드

- 백엔드: uvicorn의 `reload=True` 옵션으로 자동 리로드
- 프론트엔드: React의 Hot Reload 기능 활용

## 문제 해결

### PDF 생성 오류
WeasyPrint 설치 관련 오류가 발생하면:

```bash
# macOS
brew install pango

# Ubuntu/Debian
sudo apt-get install libpango-1.0-0 libharfbuzz0b libpangoft2-1.0-0

# Windows
# Visual C++ Build Tools 설치 필요
```

### CORS 오류
프론트엔드에서 API 호출시 CORS 오류가 발생하면:

1. 백엔드 `main.py`의 CORS 설정 확인
2. 프론트엔드 API 기본 URL 확인 (`services/api.ts`)

### 포트 충돌
기본 포트 8000, 3000이 사용중이면:

```bash
# 백엔드 포트 변경
uvicorn app.main:app --port 8001

# 프론트엔드 포트 변경  
PORT=3001 npm start
```
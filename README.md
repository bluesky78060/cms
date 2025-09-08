# 🏗️ 건설 청구서 관리 시스템

[![Docker Build](https://github.com/YOUR_USERNAME/construction-management-system/actions/workflows/docker-build.yml/badge.svg)](https://github.com/YOUR_USERNAME/construction-management-system/actions/workflows/docker-build.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

현장 작업 단위 입력부터 청구서/세금계산서 출력까지 통합 관리하는 React 기반 웹 애플리케이션입니다.

## ✨ 주요 기능

- 🏢 **건축주 관리**: 고객 정보 및 작업장 관리
- 📋 **작업 항목 관리**: 일괄 입력, 필터링, 체크박스 선택
- 📄 **청구서 관리**: PDF 생성, 한국어 숫자 변환
- 📊 **Excel 통합**: 템플릿 다운로드, 가져오기/내보내기
- 🐳 **Docker 지원**: 간편한 설치 및 배포
- 🖥️ **Electron 앱**: 데스크톱 애플리케이션 지원

## 🚀 빠른 시작

### Docker로 실행 (권장)

```bash
git clone https://github.com/YOUR_USERNAME/construction-management-system.git
cd construction-management-system
docker-compose up -d
```

웹 브라우저에서 http://localhost:3000 으로 접속

### 개발 환경 설정

```bash
cd frontend
npm install
npm start
```

## 📋 Windows 설치 가이드

Windows 사용자는 [Windows-설치가이드.md](Windows-설치가이드.md)를 참고하세요.

## 시스템 개요

- **목표**: 현장 작업 단위 입력 → 자동 집계 → 청구서/세금계산서 출력 자동화
- **근거**: 건설공사 표준품셈, 표준시장단가, 건설기계관리법(27종) 준수
- **세무**: 전자세금계산서 발급 의무 기준 및 가산세 규정 반영

## 시스템 구조

```
construction-management-system/
├── backend/          # FastAPI 백엔드
│   ├── app/
│   │   ├── models/   # SQLAlchemy 모델
│   │   ├── routers/  # API 라우터
│   │   ├── services/ # 비즈니스 로직
│   │   └── schemas/  # Pydantic 스키마
│   └── tests/
├── frontend/         # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── public/
└── docs/            # 문서
```

## 핵심 기능

1. **작업 입력**
   - 작업일자, 현장위치, 작업명, 수량
   - 인부/장비/자재 투입 내역
   - 사진 첨부 및 증빙자료

2. **자동 집계**
   - 노무비 = Σ(인원 × 시간 × 단가)
   - 장비비 = Σ(시간 × 시간단가) + 이동/설치비
   - 자재비 = Σ(수량 × 단가)

3. **청구서 생성**
   - 공급가액/세액/합계 자동 계산
   - 거래명세서 및 작업내역서 출력
   - 전자세금계산서 연동 준비

## 기술 스택

- **Backend**: FastAPI, PostgreSQL, SQLAlchemy
- **Frontend**: React, TypeScript, Tailwind CSS
- **PDF**: WeasyPrint/Playwright
- **Database**: PostgreSQL

## 데이터 모델

- 거래처(Clients), 현장(Projects), 작업일지(WorkLogs)
- 작업항목(WorkItems), 인부/장비/자재 투입내역
- 청구서(Invoices), 청구라인(InvoiceLines)
- 표준코드(장비 27종, 표준품셈 참조)
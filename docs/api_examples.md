# API 사용 예제

## 1. 거래처 관리

### 거래처 생성

```bash
curl -X POST "http://localhost:8000/api/clients" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "현대건설",
    "representative": "김현대",
    "business_number": "123-45-67890",
    "address": "서울시 종로구",
    "email": "contact@hyundai.co.kr",
    "phone": "02-1234-5678",
    "contact_person": "박담당"
  }'
```

### 거래처 목록 조회

```bash
curl "http://localhost:8000/api/clients"
```

## 2. 현장(프로젝트) 관리

### 현장 생성

```bash
curl -X POST "http://localhost:8000/api/projects" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": 1,
    "project_name": "아파트 신축공사 A동",
    "address": "서울시 강남구 역삼동",
    "contract_amount": 5000000000,
    "vat_mode": "separate",
    "advance_rate": 10.0,
    "defect_rate": 3.0
  }'
```

## 3. 작업일지 입력

### 작업일지 헤더 생성

```bash
curl -X POST "http://localhost:8000/api/work-logs" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "work_date": "2024-03-15",
    "area": "15층",
    "weather": "맑음",
    "process_status": "타일공사 진행중",
    "notes": "특이사항 없음"
  }'
```

## 4. 비용 집계 및 청구서 생성

### 프로젝트 비용 집계 조회

```bash
curl "http://localhost:8000/api/aggregation/projects/1/cost-summary?period_from=2024-03-01&period_to=2024-03-31"
```

응답 예시:
```json
{
  "project_id": 1,
  "period_from": "2024-03-01",
  "period_to": "2024-03-31",
  "cost_summary": {
    "labor_cost": 15000000.00,
    "equipment_cost": 8500000.00,
    "material_cost": 12000000.00,
    "total_supply_amount": 35500000.00
  },
  "work_logs_count": 25,
  "work_items_count": 48
}
```

### 청구서 자동 생성

```bash
curl -X POST "http://localhost:8000/api/aggregation/projects/1/generate-invoice" \
  -H "Content-Type: application/json" \
  -d '{
    "period_from": "2024-03-01",
    "period_to": "2024-03-31", 
    "sequence": 1,
    "vat_rate": 10.0
  }'
```

응답 예시:
```json
{
  "message": "청구서가 성공적으로 생성되었습니다",
  "invoice_id": 1,
  "invoice_number": "INV-2024-001-01",
  "total_amount": 39050000.00,
  "supply_amount": 35500000.00,
  "vat_amount": 3550000.00
}
```

## 5. 원가 계산 API

### 노무비 계산

```bash
curl -X POST "http://localhost:8000/api/aggregation/calculate/labor-cost" \
  -H "Content-Type: application/json" \
  -d '{
    "persons": 3,
    "hours": 8.0,
    "unit_rate": 180000.0,
    "rate_type": "daily"
  }'
```

응답 예시:
```json
{
  "persons": 3,
  "hours": 8.0,
  "unit_rate": 180000.0,
  "rate_type": "daily",
  "total_cost": 4320000.00
}
```

### 장비비 계산

```bash
curl -X POST "http://localhost:8000/api/aggregation/calculate/equipment-cost" \
  -H "Content-Type: application/json" \
  -d '{
    "units": 1,
    "hours": 6.0,
    "hourly_rate": 85000.0,
    "min_hours": 4.0,
    "mobilization_fee": 150000.0
  }'
```

응답 예시:
```json
{
  "units": 1,
  "hours": 6.0,
  "hourly_rate": 85000.0,
  "min_hours": 4.0,
  "mobilization_fee": 150000.0,
  "calculation": {
    "base_cost": 510000.00,
    "mobilization_fee": 150000.00,
    "total_cost": 660000.00,
    "applied_hours": 6.0,
    "min_hours_applied": false
  }
}
```

### 자재비 계산

```bash
curl -X POST "http://localhost:8000/api/aggregation/calculate/material-cost" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 100.5,
    "unit_price": 15000.0,
    "waste_rate": 0.03
  }'
```

### VAT 계산

```bash
curl -X POST "http://localhost:8000/api/aggregation/calculate/vat" \
  -H "Content-Type: application/json" \
  -d '{
    "supply_amount": 35500000.0,
    "vat_rate": 10.0,
    "tax_mode": "taxable"
  }'
```

## 6. PDF 내보내기

### 청구서 PDF 다운로드

```bash
curl "http://localhost:8000/api/export/invoices/1/pdf" -o invoice_1.pdf
```

### 청구서 HTML 미리보기

```bash
curl "http://localhost:8000/api/export/invoices/1/preview" > preview.html
```

### PDF 생성 테스트

```bash
curl "http://localhost:8000/api/export/test-pdf" -o test.pdf
```

## 7. 참조 데이터 조회

### 건설기계 27종 목록

```bash
curl "http://localhost:8000/api/reference/equipment-types"
```

### 표준 직종 목록

```bash
curl "http://localhost:8000/api/reference/trades"
```

### 표준 작업항목 목록

```bash
curl "http://localhost:8000/api/reference/work-items"
```

### 카테고리별 직종 조회

```bash
curl "http://localhost:8000/api/reference/trades/by-category/골조"
```

### 특정 장비 정보 조회

```bash
curl "http://localhost:8000/api/reference/equipment-types/01"
```

## 8. 복합 워크플로우 예제

### 완전한 작업일지 입력 → 청구서 생성 워크플로우

```bash
# 1. 거래처 생성
CLIENT_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/clients" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "테스트건설",
    "representative": "김대표",
    "business_number": "123-45-67890"
  }')

CLIENT_ID=$(echo $CLIENT_RESPONSE | jq -r '.client_id')

# 2. 현장 생성
PROJECT_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/projects" \
  -H "Content-Type: application/json" \
  -d "{
    \"client_id\": $CLIENT_ID,
    \"project_name\": \"테스트 현장\",
    \"contract_amount\": 1000000000
  }")

PROJECT_ID=$(echo $PROJECT_RESPONSE | jq -r '.project_id')

# 3. 작업일지 생성
WORKLOG_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/work-logs" \
  -H "Content-Type: application/json" \
  -d "{
    \"project_id\": $PROJECT_ID,
    \"work_date\": \"2024-03-15\",
    \"area\": \"1층\",
    \"weather\": \"맑음\"
  }")

# 4. 비용 집계 확인
curl "http://localhost:8000/api/aggregation/projects/$PROJECT_ID/cost-summary?period_from=2024-03-01&period_to=2024-03-31"

# 5. 청구서 생성
curl -X POST "http://localhost:8000/api/aggregation/projects/$PROJECT_ID/generate-invoice" \
  -H "Content-Type: application/json" \
  -d '{
    "period_from": "2024-03-01",
    "period_to": "2024-03-31",
    "sequence": 1
  }'
```

이 예제들을 참고하여 시스템의 전체 워크플로우를 테스트하고 이해할 수 있습니다.
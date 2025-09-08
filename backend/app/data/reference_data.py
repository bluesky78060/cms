"""
건설업 표준 참조 데이터
- 건설기계 27종 분류
- 표준 직종 분류
- 기본 작업 코드
"""

# 건설기계 27종 (건설기계관리법 기준)
CONSTRUCTION_EQUIPMENT_TYPES = [
    {
        "code": "01",
        "name": "굴삭기",
        "category": "토공기계",
        "inspection_cycle": 12,  # 개월
        "min_call_hours": 4.0,
        "description": "토사, 암석 등의 굴착작업용"
    },
    {
        "code": "02", 
        "name": "로더",
        "category": "토공기계",
        "inspection_cycle": 12,
        "min_call_hours": 4.0,
        "description": "토사, 골재 등의 적재작업용"
    },
    {
        "code": "03",
        "name": "불도저",
        "category": "토공기계", 
        "inspection_cycle": 12,
        "min_call_hours": 4.0,
        "description": "토사의 밀기, 평균작업용"
    },
    {
        "code": "04",
        "name": "덤프트럭",
        "category": "운반기계",
        "inspection_cycle": 12,
        "min_call_hours": 8.0,
        "description": "토사, 골재 등의 운반작업용"
    },
    {
        "code": "05",
        "name": "타워크레인",
        "category": "양중기계",
        "inspection_cycle": 6,  # 6개월마다 정기검사
        "min_call_hours": 8.0,
        "description": "고층건물 건설용 정착식 크레인"
    },
    {
        "code": "06",
        "name": "트럭크레인",
        "category": "양중기계", 
        "inspection_cycle": 12,
        "min_call_hours": 4.0,
        "description": "이동식 크레인, 중량물 양중작업용"
    },
    {
        "code": "07",
        "name": "콘크리트펌프",
        "category": "콘크리트기계",
        "inspection_cycle": 12,
        "min_call_hours": 4.0,
        "description": "콘크리트 압송작업용"
    },
    {
        "code": "08",
        "name": "콘크리트믹서트럭",
        "category": "콘크리트기계",
        "inspection_cycle": 12, 
        "min_call_hours": 4.0,
        "description": "생콘크리트 운반 및 타설용"
    },
    {
        "code": "09",
        "name": "아스팔트피니셔",
        "category": "도로건설기계",
        "inspection_cycle": 12,
        "min_call_hours": 4.0,
        "description": "아스팔트 포장작업용"
    },
    {
        "code": "10",
        "name": "로드롤러",
        "category": "다짐기계",
        "inspection_cycle": 12,
        "min_call_hours": 4.0,
        "description": "도로, 노반 다짐작업용"
    }
]

# 표준 직종 분류
STANDARD_TRADES = [
    {
        "code": "001",
        "name": "목공",
        "category": "골조",
        "standard_daily_rate": 180000,
        "standard_hourly_rate": 22500,
        "description": "목재 가공, 조립 작업"
    },
    {
        "code": "002",
        "name": "철근공", 
        "category": "골조",
        "standard_daily_rate": 190000,
        "standard_hourly_rate": 23750,
        "description": "철근 가공, 배근 작업"
    },
    {
        "code": "003",
        "name": "형틀목공",
        "category": "골조",
        "standard_daily_rate": 200000,
        "standard_hourly_rate": 25000,
        "description": "콘크리트 거푸집 설치"
    },
    {
        "code": "004",
        "name": "미장공",
        "category": "마감",
        "standard_daily_rate": 170000,
        "standard_hourly_rate": 21250,
        "description": "벽면 미장, 뿜칠 작업"
    },
    {
        "code": "005",
        "name": "타일공",
        "category": "마감",
        "standard_daily_rate": 180000,
        "standard_hourly_rate": 22500,
        "description": "타일 부착 작업"
    },
    {
        "code": "006",
        "name": "도장공",
        "category": "마감",
        "standard_daily_rate": 160000,
        "standard_hourly_rate": 20000,
        "description": "페인트, 도료 도장 작업"
    },
    {
        "code": "007",
        "name": "방수공",
        "category": "마감",
        "standard_daily_rate": 190000,
        "standard_hourly_rate": 23750,
        "description": "방수 시공 작업"
    },
    {
        "code": "008",
        "name": "조적공",
        "category": "골조",
        "standard_daily_rate": 175000,
        "standard_hourly_rate": 21875,
        "description": "벽돌, 블록 쌓기 작업"
    },
    {
        "code": "009",
        "name": "보통인부",
        "category": "일반",
        "standard_daily_rate": 130000,
        "standard_hourly_rate": 16250,
        "description": "일반 단순 노무작업"
    },
    {
        "code": "010",
        "name": "특별인부",
        "category": "일반",
        "standard_daily_rate": 150000,
        "standard_hourly_rate": 18750,
        "description": "숙련된 단순 노무작업"
    }
]

# 기본 작업 코드 (표준품셈 참조)
STANDARD_WORK_ITEMS = [
    {
        "code": "01.01.001",
        "name": "터파기",
        "category": "토공사",
        "unit": "m³",
        "labor_coefficient": 0.8,
        "equipment_coefficient": 0.3,
        "description": "일반토 굴착작업"
    },
    {
        "code": "01.01.002", 
        "name": "되메우기",
        "category": "토공사",
        "unit": "m³",
        "labor_coefficient": 0.6,
        "equipment_coefficient": 0.2,
        "description": "터파기 후 되메우기"
    },
    {
        "code": "02.01.001",
        "name": "철근가공조립",
        "category": "철근콘크리트공사",
        "unit": "ton",
        "labor_coefficient": 15.0,
        "equipment_coefficient": 2.0,
        "description": "철근 가공 및 배근작업"
    },
    {
        "code": "02.02.001",
        "name": "거푸집설치",
        "category": "철근콘크리트공사", 
        "unit": "m²",
        "labor_coefficient": 1.2,
        "equipment_coefficient": 0.1,
        "description": "콘크리트 거푸집 설치"
    },
    {
        "code": "02.03.001",
        "name": "콘크리트타설",
        "category": "철근콘크리트공사",
        "unit": "m³", 
        "labor_coefficient": 2.5,
        "equipment_coefficient": 0.8,
        "description": "레미콘 타설 및 다짐"
    },
    {
        "code": "03.01.001",
        "name": "조적공사",
        "category": "조적공사",
        "unit": "m²",
        "labor_coefficient": 1.8,
        "equipment_coefficient": 0.1,
        "description": "벽돌 또는 블록 쌓기"
    },
    {
        "code": "04.01.001",
        "name": "미장공사",
        "category": "미장공사",
        "unit": "m²",
        "labor_coefficient": 1.2,
        "equipment_coefficient": 0.05,
        "description": "벽면 미장마감"
    },
    {
        "code": "05.01.001",
        "name": "타일공사",
        "category": "타일공사", 
        "unit": "m²",
        "labor_coefficient": 2.0,
        "equipment_coefficient": 0.1,
        "description": "벽면 또는 바닥 타일 부착"
    },
    {
        "code": "06.01.001",
        "name": "방수공사",
        "category": "방수공사",
        "unit": "m²",
        "labor_coefficient": 1.5,
        "equipment_coefficient": 0.2,
        "description": "시트방수 또는 도막방수"
    },
    {
        "code": "07.01.001",
        "name": "도장공사",
        "category": "도장공사",
        "unit": "m²",
        "labor_coefficient": 0.8,
        "equipment_coefficient": 0.05,
        "description": "벽면 또는 천정 도장"
    }
]

# 단위 코드
STANDARD_UNITS = [
    "m²",   # 제곱미터
    "m³",   # 세제곱미터  
    "m",    # 미터
    "ton",  # 톤
    "EA",   # 개
    "식",   # 일식
    "kg",   # 킬로그램
    "L",    # 리터
    "㎡",   # 제곱미터 (한글)
    "㎥",   # 세제곱미터 (한글)
    "매",   # 매
    "개소"  # 개소
]

# 기상 조건
WEATHER_CONDITIONS = [
    "맑음",
    "흐림", 
    "비",
    "눈",
    "안개",
    "바람",
    "폭우",
    "폭설"
]
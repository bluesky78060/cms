from sqlalchemy import Column, Integer, String, Numeric, Boolean, Text
from ..database import Base

class StdItem(Base):
    """표준품셈 참조 데이터"""
    __tablename__ = "std_items"
    
    std_code = Column(String, primary_key=True, index=True)
    category = Column(String, nullable=False, index=True)  # 대분류
    subcategory = Column(String, index=True)               # 중분류
    item_name = Column(String, nullable=False)
    unit = Column(String, nullable=False)
    labor_coefficient = Column(Numeric(8, 4))              # 노무계수
    equipment_coefficient = Column(Numeric(8, 4))          # 장비계수
    description = Column(Text)

class StdEquipment(Base):
    """건설기계 27종 및 장비 마스터"""
    __tablename__ = "std_equipment"
    
    equipment_code = Column(String, primary_key=True, index=True)
    equipment_type = Column(String, nullable=False, index=True)  # 27종 분류
    equipment_name = Column(String, nullable=False)
    standard_spec = Column(String)                               # 표준규격
    inspection_required = Column(Boolean, default=True)         # 정기검사 대상
    insurance_required = Column(Boolean, default=True)          # 보험 가입 대상
    min_call_hours = Column(Numeric(4, 1), default=4.0)        # 최소호출시간
    description = Column(Text)

class TradeType(Base):
    """직종 마스터"""
    __tablename__ = "trade_types"
    
    trade_code = Column(String, primary_key=True, index=True)
    trade_name = Column(String, nullable=False, index=True)
    category = Column(String, index=True)                    # 분류 (골조, 마감 등)
    standard_daily_rate = Column(Numeric(10, 2))            # 표준일당
    standard_hourly_rate = Column(Numeric(8, 2))            # 표준시급
    description = Column(Text)
from sqlalchemy import Column, Integer, String, ForeignKey, Numeric, Enum
from sqlalchemy.orm import relationship
from ..database import Base
import enum

class RateType(str, enum.Enum):
    DAILY = "daily"    # 일당
    HOURLY = "hourly"  # 시급

class LaborEntry(Base):
    __tablename__ = "labor_entries"
    
    entry_id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("work_items.item_id"), nullable=False)
    trade = Column(String, nullable=False)  # 직종 (목공, 철근공, 타일공 등)
    persons = Column(Integer, nullable=False)  # 투입인원
    hours = Column(Numeric(4, 1), nullable=False)  # 시간
    rate_type = Column(Enum(RateType), nullable=False)
    unit_rate = Column(Numeric(10, 2), nullable=False)  # 단가
    total_cost = Column(Numeric(12, 2), nullable=False)  # 총비용
    
    # Relationships
    work_item = relationship("WorkItem", back_populates="labor_entries")
from sqlalchemy import Column, Integer, String, ForeignKey, Numeric, Boolean
from sqlalchemy.orm import relationship
from ..database import Base

class EquipmentEntry(Base):
    __tablename__ = "equipment_entries"
    
    entry_id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("work_items.item_id"), nullable=False)
    equipment_code = Column(String, nullable=False, index=True)  # 장비코드 (27종 매핑)
    equipment_name = Column(String, nullable=False)
    specification = Column(String)  # 규격/톤수/붐길이
    units = Column(Integer, nullable=False, default=1)  # 대수
    hours = Column(Numeric(6, 1), nullable=False)  # 운용시간
    hourly_rate = Column(Numeric(10, 2), nullable=False)  # 시간단가
    min_hours = Column(Numeric(4, 1), default=4.0)  # 최소투입시간
    mobilization_fee = Column(Numeric(10, 2), default=0)  # 이동/설치비
    total_cost = Column(Numeric(12, 2), nullable=False)  # 총비용
    
    # Relationships
    work_item = relationship("WorkItem", back_populates="equipment_entries")
from sqlalchemy import Column, Integer, String, ForeignKey, Numeric, Text
from sqlalchemy.orm import relationship
from ..database import Base

class WorkItem(Base):
    __tablename__ = "work_items"
    
    id = Column(Integer, primary_key=True, index=True)
    work_log_id = Column(Integer, ForeignKey("work_logs.id"), nullable=False)
    task_code = Column(String, nullable=False, index=True)  # 작업코드 (대분류.중분류.세분류)
    task_name = Column(String, nullable=False)
    specification = Column(String)  # 규격/치수
    quantity = Column(Numeric(10, 3), nullable=False)
    unit = Column(String, nullable=False)
    progress_rate = Column(Numeric(5, 2), default=100.00)  # 진행률 %
    notes = Column(Text)
    
    # Relationships
    work_log = relationship("WorkLog", back_populates="work_items")
    labor_entries = relationship("LaborEntry", back_populates="work_item")
    equipment_entries = relationship("EquipmentEntry", back_populates="work_item") 
    material_entries = relationship("MaterialEntry", back_populates="work_item")
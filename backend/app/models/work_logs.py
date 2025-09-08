from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class WorkLog(Base):
    __tablename__ = "work_logs"
    
    work_id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.project_id"), nullable=False)
    work_date = Column(Date, nullable=False, index=True)
    area = Column(String)  # 동/층/구역
    weather = Column(String)
    process_status = Column(String)  # 공정상태
    notes = Column(Text)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="work_logs")
    work_items = relationship("WorkItem", back_populates="work_log")
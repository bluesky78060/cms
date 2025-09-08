from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base
import enum

class VATMode(str, enum.Enum):
    INCLUDED = "included"    # 포함
    SEPARATE = "separate"    # 별도  
    EXEMPT = "exempt"        # 면세

class Project(Base):
    __tablename__ = "projects"
    
    project_id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.client_id"), nullable=False)
    project_name = Column(String, nullable=False, index=True)
    address = Column(String)
    contract_amount = Column(Numeric(15, 2))
    vat_mode = Column(Enum(VATMode), default=VATMode.SEPARATE)
    advance_rate = Column(Numeric(5, 2), default=0.10)  # 선급율 10%
    defect_rate = Column(Numeric(5, 2), default=0.03)   # 하자율 3%
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    client = relationship("Client", back_populates="projects")
    work_logs = relationship("WorkLog", back_populates="project")
    invoices = relationship("Invoice", back_populates="project")
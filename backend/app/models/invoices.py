from sqlalchemy import Column, Integer, String, ForeignKey, Numeric, Date, Enum
from sqlalchemy.orm import relationship
from ..database import Base
import enum

class TaxMode(str, enum.Enum):
    TAXABLE = "taxable"    # 과세
    EXEMPT = "exempt"      # 면세
    ZERO_RATED = "zero"    # 영세율

class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    invoice_number = Column(String, unique=True, index=True)
    issue_date = Column(Date, nullable=False)
    period_from = Column(Date, nullable=False)
    period_to = Column(Date, nullable=False)
    sequence = Column(Integer, default=1)  # 차수 (1차 기성, 2차 기성...)
    tax_mode = Column(Enum(TaxMode), default=TaxMode.TAXABLE)
    vat_rate = Column(Numeric(4, 2), default=10.0)  # VAT 세율 (%)
    
    supply_amount = Column(Numeric(15, 2), nullable=False)  # 공급가액
    vat_amount = Column(Numeric(15, 2), nullable=False)     # 세액
    total_amount = Column(Numeric(15, 2), nullable=False)   # 합계
    
    # Relationships
    project = relationship("Project", back_populates="invoices")
    invoice_lines = relationship("InvoiceLine", back_populates="invoice")
from sqlalchemy import Column, Integer, String, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from ..database import Base

class InvoiceLine(Base):
    __tablename__ = "invoice_lines"
    
    line_id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.invoice_id"), nullable=False)
    line_number = Column(Integer, nullable=False)  # 라인번호
    description = Column(String, nullable=False)   # 항목명
    quantity = Column(Numeric(10, 3))
    unit = Column(String)
    unit_price = Column(Numeric(12, 2))
    supply_amount = Column(Numeric(15, 2), nullable=False)
    vat_amount = Column(Numeric(15, 2), nullable=False)
    total_amount = Column(Numeric(15, 2), nullable=False)
    
    # Relationships
    invoice = relationship("Invoice", back_populates="invoice_lines")
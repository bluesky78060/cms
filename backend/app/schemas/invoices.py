from pydantic import BaseModel
from datetime import date
from typing import Optional, List
from decimal import Decimal
from ..models.invoices import TaxMode

class InvoiceLineBase(BaseModel):
    line_number: int
    description: str
    quantity: Optional[Decimal] = None
    unit: Optional[str] = None
    unit_price: Optional[Decimal] = None
    supply_amount: Decimal
    vat_amount: Decimal
    total_amount: Decimal

class InvoiceBase(BaseModel):
    project_id: int
    invoice_number: str
    issue_date: date
    period_from: date
    period_to: date
    sequence: int = 1
    tax_mode: TaxMode = TaxMode.TAXABLE
    vat_rate: Decimal = Decimal('10.0')
    supply_amount: Decimal
    vat_amount: Decimal
    total_amount: Decimal

class InvoiceCreate(InvoiceBase):
    lines: List[InvoiceLineBase] = []

class InvoiceResponse(InvoiceBase):
    invoice_id: int
    
    class Config:
        from_attributes = True
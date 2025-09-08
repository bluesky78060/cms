from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from decimal import Decimal
from ..models.projects import VATMode

class ProjectBase(BaseModel):
    client_id: int
    project_name: str
    address: Optional[str] = None
    contract_amount: Optional[Decimal] = None
    vat_mode: VATMode = VATMode.SEPARATE
    advance_rate: Decimal = Decimal('0.10')
    defect_rate: Decimal = Decimal('0.03')

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    project_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
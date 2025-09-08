from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List

class WorkItemCreate(BaseModel):
    task_code: Optional[str] = None
    task_name: str
    specification: Optional[str] = None
    quantity: float
    unit: str
    progress_rate: float

class LaborCreate(BaseModel):
    trade: str
    persons: int
    hours: float
    rate_type: str # 'daily' | 'hourly'
    unit_rate: float

class EquipmentCreate(BaseModel):
    equipment_name: str
    specification: Optional[str] = None
    units: int
    hours: float
    hourly_rate: float
    mobilization_fee: float

class MaterialCreate(BaseModel):
    material_name: str
    specification: Optional[str] = None
    quantity: float
    unit: str
    unit_price: float
    supplier: Optional[str] = None

class WorkLogBase(BaseModel):
    project_id: int
    work_date: date
    area: Optional[str] = None
    weather: Optional[str] = None
    process_status: Optional[str] = None
    notes: Optional[str] = None

class WorkLogCreate(WorkLogBase):
    work_items: List[WorkItemCreate] = []
    labor_entries: List[LaborCreate] = []
    equipment_entries: List[EquipmentCreate] = []
    material_entries: List[MaterialCreate] = []

class WorkLogResponse(WorkLogBase):
    work_id: int
    created_at: datetime
    updated_at: datetime
    work_items: List[WorkItemCreate] = [] # Using Create schema for response for simplicity for now
    labor_entries: List[LaborCreate] = []
    equipment_entries: List[EquipmentCreate] = []
    material_entries: List[MaterialCreate] = []
    
    class Config:
        from_attributes = True
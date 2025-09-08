from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional

class WorkLogBase(BaseModel):
    project_id: int
    work_date: date
    area: Optional[str] = None
    weather: Optional[str] = None
    process_status: Optional[str] = None
    notes: Optional[str] = None

class WorkLogCreate(WorkLogBase):
    pass

class WorkLogResponse(WorkLogBase):
    work_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
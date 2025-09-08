from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ClientBase(BaseModel):
    company_name: str
    representative: Optional[str] = None
    business_number: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    contact_person: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class ClientResponse(ClientBase):
    client_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
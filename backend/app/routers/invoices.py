from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Invoice, InvoiceLine
from ..schemas.invoices import InvoiceCreate, InvoiceResponse

router = APIRouter()

@router.post("/", response_model=InvoiceResponse)
def create_invoice(invoice: InvoiceCreate, db: Session = Depends(get_db)):
    # Create invoice
    invoice_data = invoice.dict(exclude={'lines'})
    db_invoice = Invoice(**invoice_data)
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    
    # Create invoice lines
    for line in invoice.lines:
        line_data = line.dict()
        line_data['invoice_id'] = db_invoice.invoice_id
        db_line = InvoiceLine(**line_data)
        db.add(db_line)
    
    db.commit()
    return db_invoice

@router.get("/", response_model=List[InvoiceResponse])
def get_invoices(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    invoices = db.query(Invoice).offset(skip).limit(limit).all()
    return invoices

@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.invoice_id == invoice_id).first()
    if invoice is None:
        raise HTTPException(status_code=404, detail="청구서를 찾을 수 없습니다")
    return invoice
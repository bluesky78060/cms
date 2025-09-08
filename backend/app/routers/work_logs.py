from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import WorkLog
from ..schemas.work_logs import WorkLogCreate, WorkLogResponse

router = APIRouter()

@router.post("/", response_model=WorkLogResponse)
def create_work_log(work_log: WorkLogCreate, db: Session = Depends(get_db)):
    db_work_log = WorkLog(**work_log.dict())
    db.add(db_work_log)
    db.commit()
    db.refresh(db_work_log)
    return db_work_log

@router.get("/", response_model=List[WorkLogResponse])
def get_work_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    work_logs = db.query(WorkLog).offset(skip).limit(limit).all()
    return work_logs

@router.get("/{work_id}", response_model=WorkLogResponse)
def get_work_log(work_id: int, db: Session = Depends(get_db)):
    work_log = db.query(WorkLog).filter(WorkLog.work_id == work_id).first()
    if work_log is None:
        raise HTTPException(status_code=404, detail="작업일지를 찾을 수 없습니다")
    return work_log
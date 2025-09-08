from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import WorkLog, WorkItem, LaborEntry, EquipmentEntry, MaterialEntry
from ..schemas.work_logs import WorkLogCreate, WorkLogResponse, WorkItemCreate, LaborCreate, EquipmentCreate, MaterialCreate

router = APIRouter()

@router.post("/", response_model=WorkLogResponse)
def create_work_log(work_log: WorkLogCreate, db: Session = Depends(get_db)):
    # Extract nested data
    work_items_data = work_log.work_items
    labor_entries_data = work_log.labor_entries
    equipment_entries_data = work_log.equipment_entries
    material_entries_data = work_log.material_entries

    # Create WorkLog instance without nested data first
    db_work_log = WorkLog(
        project_id=work_log.project_id,
        work_date=work_log.work_date,
        area=work_log.area,
        weather=work_log.weather,
        process_status=work_log.process_status,
        notes=work_log.notes
    )
    db.add(db_work_log)
    db.flush() # Flush to get work_id for related items

    # Add WorkItems
    for item_data in work_items_data:
        db_work_item = WorkItem(**item_data.dict(), work_id=db_work_log.work_id)
        db.add(db_work_item)
        db.flush() # Flush to get item_id for related entries

        # Add LaborEntries for this WorkItem
        for labor_data in labor_entries_data: # Assuming labor entries are associated with the first work item for simplicity, or need a way to link them
            total_cost = labor_data.persons * labor_data.hours * labor_data.unit_rate
            db_labor_entry = LaborEntry(**labor_data.dict(), item_id=db_work_item.item_id, total_cost=total_cost)
            db.add(db_labor_entry)

        # Add EquipmentEntries for this WorkItem
        for equipment_data in equipment_entries_data: # Assuming equipment entries are associated with the first work item for simplicity, or need a way to link them
            total_cost = (equipment_data.units * equipment_data.hours * equipment_data.hourly_rate) + equipment_data.mobilization_fee
            db_equipment_entry = EquipmentEntry(**equipment_data.dict(), item_id=db_work_item.item_id, total_cost=total_cost)
            db.add(db_equipment_entry)

        # Add MaterialEntries for this WorkItem
        for material_data in material_entries_data: # Assuming material entries are associated with the first work item for simplicity, or need a way to link them
            total_cost = material_data.quantity * material_data.unit_price
            db_material_entry = MaterialEntry(**material_data.dict(), item_id=db_work_item.item_id, total_cost=total_cost)
            db.add(db_material_entry)

    db.commit()
    db.refresh(db_work_log) # Refresh to load relationships

    # Manually populate nested data for response as relationships are viewonly or not directly loaded
    response_work_items = []
    for db_item in db_work_log.work_items:
        item_dict = db_item.__dict__.copy()
        item_dict["labor_entries"] = [LaborCreate.from_orm(le) for le in db_item.labor_entries]
        item_dict["equipment_entries"] = [EquipmentCreate.from_orm(ee) for ee in db_item.equipment_entries]
        item_dict["material_entries"] = [MaterialCreate.from_orm(me) for me in db_item.material_entries]
        response_work_items.append(WorkItemCreate.from_orm(db_item)) # This will not include nested items

    # For WorkLogResponse, we need to ensure the nested lists are populated.
    # Since we made the relationships viewonly, we might need to load them explicitly or adjust the response model.
    # For now, let's try to refresh and see if it works with from_orm.
    # If not, we might need to construct the response manually or adjust the WorkLogResponse schema.

    # Re-fetch the work log with all relationships loaded for the response
    # This is a common pattern when relationships are not eager loaded or viewonly
    full_work_log = db.query(WorkLog).filter(WorkLog.work_id == db_work_log.work_id).first()
    if full_work_log:
        # Populate nested data for the response
        response_data = WorkLogResponse.from_orm(full_work_log)
        response_data.work_items = [WorkItemCreate.from_orm(item) for item in full_work_log.work_items]
        
        # For each work item, populate its nested entries
        for i, item_response in enumerate(response_data.work_items):
            db_item = full_work_log.work_items[i]
            item_response.labor_entries = [LaborCreate.from_orm(le) for le in db_item.labor_entries]
            item_response.equipment_entries = [EquipmentCreate.from_orm(ee) for ee in db_item.equipment_entries]
            item_response.material_entries = [MaterialCreate.from_orm(me) for me in db_item.material_entries]
        
        return response_data
    
    return WorkLogResponse.from_orm(db_work_log) # Fallback, might not have full nested data

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
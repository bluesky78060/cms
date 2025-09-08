from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from decimal import Decimal
from ..database import get_db
from ..services.invoice_service import InvoiceAggregationService
from ..services.calculation_service import CostCalculationService

router = APIRouter()

@router.get("/projects/{project_id}/cost-summary")
def get_project_cost_summary(
    project_id: int,
    period_from: date = Query(..., description="집계 시작일"),
    period_to: date = Query(..., description="집계 종료일"),
    db: Session = Depends(get_db)
):
    """프로젝트별 비용 집계 조회"""
    try:
        service = InvoiceAggregationService(db)
        aggregation = service.aggregate_work_costs(project_id, period_from, period_to)
        
        return {
            "project_id": project_id,
            "period_from": period_from,
            "period_to": period_to,
            "cost_summary": {
                "labor_cost": float(aggregation['labor_cost']),
                "equipment_cost": float(aggregation['equipment_cost']),
                "material_cost": float(aggregation['material_cost']),
                "total_supply_amount": float(aggregation['total_supply_amount'])
            },
            "work_logs_count": len(aggregation['work_logs']),
            "work_items_count": len(aggregation['work_items'])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"집계 중 오류가 발생했습니다: {str(e)}")

@router.post("/projects/{project_id}/generate-invoice")
def generate_invoice_from_work_logs(
    project_id: int,
    period_from: date,
    period_to: date,
    sequence: int = 1,
    vat_rate: Optional[float] = 10.0,
    db: Session = Depends(get_db)
):
    """작업일지 기반 청구서 자동 생성"""
    try:
        service = InvoiceAggregationService(db)
        invoice = service.create_invoice_from_aggregation(
            project_id=project_id,
            period_from=period_from,
            period_to=period_to,
            sequence=sequence,
            vat_rate=Decimal(str(vat_rate))
        )
        
        return {
            "message": "청구서가 성공적으로 생성되었습니다",
            "invoice_id": invoice.invoice_id,
            "invoice_number": invoice.invoice_number,
            "total_amount": float(invoice.total_amount),
            "supply_amount": float(invoice.supply_amount),
            "vat_amount": float(invoice.vat_amount)
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"청구서 생성 중 오류가 발생했습니다: {str(e)}")

@router.post("/calculate/labor-cost")
def calculate_labor_cost(
    persons: int,
    hours: float,
    unit_rate: float,
    rate_type: str = "daily"
):
    """노무비 계산"""
    try:
        cost = CostCalculationService.calculate_labor_cost(
            persons=persons,
            hours=Decimal(str(hours)),
            unit_rate=Decimal(str(unit_rate)),
            rate_type=rate_type
        )
        
        return {
            "persons": persons,
            "hours": hours,
            "unit_rate": unit_rate,
            "rate_type": rate_type,
            "total_cost": float(cost)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"노무비 계산 오류: {str(e)}")

@router.post("/calculate/equipment-cost")
def calculate_equipment_cost(
    units: int,
    hours: float,
    hourly_rate: float,
    min_hours: float = 4.0,
    mobilization_fee: float = 0.0
):
    """장비비 계산"""
    try:
        result = CostCalculationService.calculate_equipment_cost(
            units=units,
            hours=Decimal(str(hours)),
            hourly_rate=Decimal(str(hourly_rate)),
            min_hours=Decimal(str(min_hours)),
            mobilization_fee=Decimal(str(mobilization_fee))
        )
        
        return {
            "units": units,
            "hours": hours,
            "hourly_rate": hourly_rate,
            "min_hours": min_hours,
            "mobilization_fee": mobilization_fee,
            "calculation": {
                "base_cost": float(result['base_cost']),
                "mobilization_fee": float(result['mobilization_fee']),
                "total_cost": float(result['total_cost']),
                "applied_hours": float(result['applied_hours']),
                "min_hours_applied": result['min_hours_applied']
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"장비비 계산 오류: {str(e)}")

@router.post("/calculate/material-cost")
def calculate_material_cost(
    quantity: float,
    unit_price: float,
    waste_rate: float = 0.03
):
    """자재비 계산"""
    try:
        result = CostCalculationService.calculate_material_cost(
            quantity=Decimal(str(quantity)),
            unit_price=Decimal(str(unit_price)),
            waste_rate=Decimal(str(waste_rate))
        )
        
        return {
            "quantity": quantity,
            "unit_price": unit_price,
            "waste_rate": waste_rate,
            "calculation": {
                "base_cost": float(result['base_cost']),
                "waste_amount": float(result['waste_amount']),
                "total_cost": float(result['total_cost']),
                "waste_rate_percent": float(result['waste_rate'])
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"자재비 계산 오류: {str(e)}")

@router.post("/calculate/vat")
def calculate_vat(
    supply_amount: float,
    vat_rate: float = 10.0,
    tax_mode: str = "taxable"
):
    """부가가치세 계산"""
    try:
        result = CostCalculationService.calculate_vat(
            supply_amount=Decimal(str(supply_amount)),
            vat_rate=Decimal(str(vat_rate)),
            tax_mode=tax_mode
        )
        
        return {
            "input": {
                "supply_amount": supply_amount,
                "vat_rate": vat_rate,
                "tax_mode": tax_mode
            },
            "calculation": {
                "supply_amount": float(result['supply_amount']),
                "vat_amount": float(result['vat_amount']),
                "total_amount": float(result['total_amount']),
                "vat_rate": float(result['vat_rate']),
                "tax_mode": result['tax_mode']
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"VAT 계산 오류: {str(e)}")
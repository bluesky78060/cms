from sqlalchemy.orm import Session
from typing import List, Dict
from datetime import date, datetime
from decimal import Decimal
from ..models import (
    WorkLog, WorkItem, LaborEntry, EquipmentEntry, MaterialEntry,
    Invoice, InvoiceLine, Project
)

class InvoiceAggregationService:
    """작업 데이터를 집계하여 청구서를 생성하는 서비스"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def aggregate_work_costs(self, project_id: int, period_from: date, period_to: date) -> Dict:
        """기간별 작업 비용 집계"""
        
        # 해당 기간의 작업 로그 조회
        work_logs = self.db.query(WorkLog).filter(
            WorkLog.project_id == project_id,
            WorkLog.work_date >= period_from,
            WorkLog.work_date <= period_to
        ).all()
        
        work_log_ids = [log.work_id for log in work_logs]
        
        if not work_log_ids:
            return self._empty_aggregation()
        
        # 작업 항목들 조회
        work_items = self.db.query(WorkItem).filter(
            WorkItem.work_id.in_(work_log_ids)
        ).all()
        
        work_item_ids = [item.item_id for item in work_items]
        
        if not work_item_ids:
            return self._empty_aggregation()
        
        # 비용 집계
        labor_cost = self._aggregate_labor_costs(work_item_ids)
        equipment_cost = self._aggregate_equipment_costs(work_item_ids)
        material_cost = self._aggregate_material_costs(work_item_ids)
        
        total_supply = labor_cost + equipment_cost + material_cost
        
        return {
            'labor_cost': labor_cost,
            'equipment_cost': equipment_cost,
            'material_cost': material_cost,
            'total_supply_amount': total_supply,
            'work_items': work_items,
            'work_logs': work_logs
        }
    
    def _aggregate_labor_costs(self, work_item_ids: List[int]) -> Decimal:
        """노무비 집계"""
        labor_entries = self.db.query(LaborEntry).filter(
            LaborEntry.item_id.in_(work_item_ids)
        ).all()
        
        total = Decimal('0')
        for entry in labor_entries:
            # 총비용 = 인원 × 시간 × 단가
            cost = Decimal(str(entry.persons)) * Decimal(str(entry.hours)) * Decimal(str(entry.unit_rate))
            total += cost
        
        return total
    
    def _aggregate_equipment_costs(self, work_item_ids: List[int]) -> Decimal:
        """장비비 집계"""
        equipment_entries = self.db.query(EquipmentEntry).filter(
            EquipmentEntry.item_id.in_(work_item_ids)
        ).all()
        
        total = Decimal('0')
        for entry in equipment_entries:
            # 최소호출시간 적용
            actual_hours = max(Decimal(str(entry.hours)), Decimal(str(entry.min_hours)))
            
            # 장비비 = (시간 × 시간단가) + 이동/설치비
            cost = (actual_hours * Decimal(str(entry.hourly_rate))) + Decimal(str(entry.mobilization_fee))
            total += cost
        
        return total
    
    def _aggregate_material_costs(self, work_item_ids: List[int]) -> Decimal:
        """자재비 집계"""
        material_entries = self.db.query(MaterialEntry).filter(
            MaterialEntry.item_id.in_(work_item_ids)
        ).all()
        
        total = Decimal('0')
        for entry in material_entries:
            # 자재비 = 수량 × 단가
            cost = Decimal(str(entry.quantity)) * Decimal(str(entry.unit_price))
            total += cost
        
        return total
    
    def create_invoice_from_aggregation(
        self, 
        project_id: int, 
        period_from: date, 
        period_to: date,
        sequence: int = 1,
        vat_rate: Decimal = Decimal('10.0')
    ) -> Invoice:
        """집계 데이터로부터 청구서 생성"""
        
        # 프로젝트 정보 조회
        project = self.db.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            raise ValueError("프로젝트를 찾을 수 없습니다")
        
        # 비용 집계
        aggregation = self.aggregate_work_costs(project_id, period_from, period_to)
        
        supply_amount = aggregation['total_supply_amount']
        vat_amount = supply_amount * (vat_rate / Decimal('100'))
        total_amount = supply_amount + vat_amount
        
        # 청구서 번호 생성
        invoice_number = self._generate_invoice_number(project_id, sequence)
        
        # 청구서 생성
        invoice = Invoice(
            project_id=project_id,
            invoice_number=invoice_number,
            issue_date=date.today(),
            period_from=period_from,
            period_to=period_to,
            sequence=sequence,
            vat_rate=vat_rate,
            supply_amount=supply_amount,
            vat_amount=vat_amount,
            total_amount=total_amount
        )
        
        self.db.add(invoice)
        self.db.commit()
        self.db.refresh(invoice)
        
        # 청구서 라인 생성
        self._create_invoice_lines(invoice.invoice_id, aggregation)
        
        return invoice
    
    def _create_invoice_lines(self, invoice_id: int, aggregation: Dict):
        """청구서 라인 생성"""
        line_number = 1
        
        # 노무비 라인
        if aggregation['labor_cost'] > 0:
            labor_line = InvoiceLine(
                invoice_id=invoice_id,
                line_number=line_number,
                description="노무비",
                supply_amount=aggregation['labor_cost'],
                vat_amount=aggregation['labor_cost'] * Decimal('0.1'),
                total_amount=aggregation['labor_cost'] * Decimal('1.1')
            )
            self.db.add(labor_line)
            line_number += 1
        
        # 장비비 라인
        if aggregation['equipment_cost'] > 0:
            equipment_line = InvoiceLine(
                invoice_id=invoice_id,
                line_number=line_number,
                description="장비비",
                supply_amount=aggregation['equipment_cost'],
                vat_amount=aggregation['equipment_cost'] * Decimal('0.1'),
                total_amount=aggregation['equipment_cost'] * Decimal('1.1')
            )
            self.db.add(equipment_line)
            line_number += 1
        
        # 자재비 라인
        if aggregation['material_cost'] > 0:
            material_line = InvoiceLine(
                invoice_id=invoice_id,
                line_number=line_number,
                description="자재비",
                supply_amount=aggregation['material_cost'],
                vat_amount=aggregation['material_cost'] * Decimal('0.1'),
                total_amount=aggregation['material_cost'] * Decimal('1.1')
            )
            self.db.add(material_line)
        
        self.db.commit()
    
    def _generate_invoice_number(self, project_id: int, sequence: int) -> str:
        """청구서 번호 생성"""
        year = datetime.now().year
        month = datetime.now().month
        return f"INV-{year}-{project_id:03d}-{sequence:02d}"
    
    def _empty_aggregation(self) -> Dict:
        """빈 집계 결과"""
        return {
            'labor_cost': Decimal('0'),
            'equipment_cost': Decimal('0'),
            'material_cost': Decimal('0'),
            'total_supply_amount': Decimal('0'),
            'work_items': [],
            'work_logs': []
        }
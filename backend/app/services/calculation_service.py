from decimal import Decimal
from typing import Dict, List
from ..models import LaborEntry, EquipmentEntry, MaterialEntry, WorkItem

class CostCalculationService:
    """건설업 표준 원가 계산 서비스"""
    
    @staticmethod
    def calculate_labor_cost(
        persons: int, 
        hours: Decimal, 
        unit_rate: Decimal, 
        rate_type: str = "daily"
    ) -> Decimal:
        """
        노무비 계산
        - 일당: 인원 × 일수 × 일당
        - 시급: 인원 × 시간 × 시급
        """
        base_cost = Decimal(str(persons)) * hours * unit_rate
        return base_cost.quantize(Decimal('0.01'))
    
    @staticmethod
    def calculate_equipment_cost(
        units: int,
        hours: Decimal,
        hourly_rate: Decimal,
        min_hours: Decimal = Decimal('4.0'),
        mobilization_fee: Decimal = Decimal('0')
    ) -> Dict[str, Decimal]:
        """
        장비비 계산 (건설기계관리법 기준)
        - 최소 호출 시간 적용
        - 이동/설치비 별도
        """
        # 최소 호출 시간 적용
        actual_hours = max(hours, min_hours)
        
        # 기본 장비비
        base_cost = Decimal(str(units)) * actual_hours * hourly_rate
        
        # 총 장비비 (이동/설치비 포함)
        total_cost = base_cost + mobilization_fee
        
        return {
            'base_cost': base_cost.quantize(Decimal('0.01')),
            'mobilization_fee': mobilization_fee.quantize(Decimal('0.01')),
            'total_cost': total_cost.quantize(Decimal('0.01')),
            'applied_hours': actual_hours,
            'min_hours_applied': actual_hours > hours
        }
    
    @staticmethod
    def calculate_material_cost(
        quantity: Decimal, 
        unit_price: Decimal,
        waste_rate: Decimal = Decimal('0.03')  # 기본 할증율 3%
    ) -> Dict[str, Decimal]:
        """
        자재비 계산
        - 수량 × 단가
        - 할증율 적용 (폐기물/운반 등)
        """
        base_cost = quantity * unit_price
        waste_amount = base_cost * waste_rate
        total_cost = base_cost + waste_amount
        
        return {
            'base_cost': base_cost.quantize(Decimal('0.01')),
            'waste_amount': waste_amount.quantize(Decimal('0.01')),
            'total_cost': total_cost.quantize(Decimal('0.01')),
            'waste_rate': waste_rate * 100  # 백분율로 표시
        }
    
    @staticmethod
    def calculate_vat(
        supply_amount: Decimal, 
        vat_rate: Decimal = Decimal('10.0'),
        tax_mode: str = "taxable"
    ) -> Dict[str, Decimal]:
        """
        부가가치세 계산
        - 과세: 10% VAT
        - 면세: 0% VAT  
        - 영세율: 0% VAT
        """
        if tax_mode == "exempt" or tax_mode == "zero":
            vat_amount = Decimal('0')
        else:
            vat_amount = supply_amount * (vat_rate / Decimal('100'))
        
        total_amount = supply_amount + vat_amount
        
        return {
            'supply_amount': supply_amount.quantize(Decimal('0.01')),
            'vat_amount': vat_amount.quantize(Decimal('0.01')),
            'total_amount': total_amount.quantize(Decimal('0.01')),
            'vat_rate': vat_rate,
            'tax_mode': tax_mode
        }
    
    @staticmethod
    def calculate_progress_payment(
        contract_amount: Decimal,
        progress_rate: Decimal,
        advance_rate: Decimal = Decimal('10.0'),
        defect_rate: Decimal = Decimal('3.0'),
        previous_payments: Decimal = Decimal('0')
    ) -> Dict[str, Decimal]:
        """
        기성 대금 계산
        - 계약금액 × 기성율 - 선급금 - 기지급액 - 하자보수비
        """
        # 누적 기성액
        cumulative_amount = contract_amount * (progress_rate / Decimal('100'))
        
        # 선급금
        advance_amount = contract_amount * (advance_rate / Decimal('100'))
        
        # 하자보수비 (기성액 기준)
        defect_amount = cumulative_amount * (defect_rate / Decimal('100'))
        
        # 당회 기성액
        current_payment = cumulative_amount - advance_amount - previous_payments - defect_amount
        
        return {
            'contract_amount': contract_amount.quantize(Decimal('0.01')),
            'cumulative_amount': cumulative_amount.quantize(Decimal('0.01')),
            'advance_amount': advance_amount.quantize(Decimal('0.01')),
            'defect_amount': defect_amount.quantize(Decimal('0.01')),
            'previous_payments': previous_payments.quantize(Decimal('0.01')),
            'current_payment': max(current_payment, Decimal('0')).quantize(Decimal('0.01')),
            'progress_rate': progress_rate
        }
    
    @staticmethod
    def apply_standard_rates(work_item: WorkItem) -> Dict[str, Decimal]:
        """
        표준품셈 기준 투입계수 적용
        (실제 구현 시 표준품셈 DB 연동 필요)
        """
        # 임시 표준 계수 (실제로는 DB에서 조회)
        standard_rates = {
            'concrete': {
                'labor_coefficient': Decimal('0.8'),  # 인력계수
                'equipment_coefficient': Decimal('0.2')  # 장비계수
            },
            'masonry': {
                'labor_coefficient': Decimal('1.2'),
                'equipment_coefficient': Decimal('0.1')
            }
        }
        
        # 작업 코드에 따른 계수 적용 (예시)
        task_type = work_item.task_code.split('.')[0] if '.' in work_item.task_code else 'default'
        
        coefficients = standard_rates.get(task_type, {
            'labor_coefficient': Decimal('1.0'),
            'equipment_coefficient': Decimal('0.3')
        })
        
        # 수량 기준 소요량 계산
        quantity = Decimal(str(work_item.quantity))
        
        return {
            'required_labor_hours': (quantity * coefficients['labor_coefficient']).quantize(Decimal('0.1')),
            'required_equipment_hours': (quantity * coefficients['equipment_coefficient']).quantize(Decimal('0.1')),
            'labor_coefficient': coefficients['labor_coefficient'],
            'equipment_coefficient': coefficients['equipment_coefficient']
        }
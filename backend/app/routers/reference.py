from fastapi import APIRouter
from typing import List, Dict
from ..data.reference_data import (
    CONSTRUCTION_EQUIPMENT_TYPES,
    STANDARD_TRADES, 
    STANDARD_WORK_ITEMS,
    STANDARD_UNITS,
    WEATHER_CONDITIONS
)

router = APIRouter()

@router.get("/equipment-types", response_model=List[Dict])
def get_equipment_types():
    """건설기계 27종 목록 조회"""
    return CONSTRUCTION_EQUIPMENT_TYPES

@router.get("/trades", response_model=List[Dict])
def get_trades():
    """표준 직종 목록 조회"""
    return STANDARD_TRADES

@router.get("/work-items", response_model=List[Dict])  
def get_work_items():
    """표준 작업항목 목록 조회"""
    return STANDARD_WORK_ITEMS

@router.get("/units", response_model=List[str])
def get_units():
    """표준 단위 목록 조회"""
    return STANDARD_UNITS

@router.get("/weather-conditions", response_model=List[str])
def get_weather_conditions():
    """기상조건 목록 조회"""
    return WEATHER_CONDITIONS

@router.get("/equipment-types/{equipment_code}")
def get_equipment_by_code(equipment_code: str):
    """장비코드로 장비 정보 조회"""
    for equipment in CONSTRUCTION_EQUIPMENT_TYPES:
        if equipment["code"] == equipment_code:
            return equipment
    return {"error": "장비 정보를 찾을 수 없습니다"}

@router.get("/trades/{trade_code}")
def get_trade_by_code(trade_code: str):
    """직종코드로 직종 정보 조회"""
    for trade in STANDARD_TRADES:
        if trade["code"] == trade_code:
            return trade
    return {"error": "직종 정보를 찾을 수 없습니다"}

@router.get("/work-items/by-category/{category}")
def get_work_items_by_category(category: str):
    """카테고리별 작업항목 조회"""
    items = [item for item in STANDARD_WORK_ITEMS if item["category"] == category]
    return items

@router.get("/trades/by-category/{category}")
def get_trades_by_category(category: str):
    """카테고리별 직종 조회"""
    trades = [trade for trade in STANDARD_TRADES if trade["category"] == category]
    return trades

@router.get("/equipment-types/by-category/{category}")
def get_equipment_by_category(category: str):
    """카테고리별 장비 조회"""
    equipment = [eq for eq in CONSTRUCTION_EQUIPMENT_TYPES if eq["category"] == category]
    return equipment

@router.get("/categories/work-items")
def get_work_item_categories():
    """작업항목 카테고리 목록"""
    categories = list(set([item["category"] for item in STANDARD_WORK_ITEMS]))
    return sorted(categories)

@router.get("/categories/trades")
def get_trade_categories():
    """직종 카테고리 목록"""
    categories = list(set([trade["category"] for trade in STANDARD_TRADES]))
    return sorted(categories)

@router.get("/categories/equipment")
def get_equipment_categories():
    """장비 카테고리 목록"""
    categories = list(set([eq["category"] for eq in CONSTRUCTION_EQUIPMENT_TYPES]))
    return sorted(categories)
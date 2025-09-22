from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import Optional
from decimal import Decimal

from sqlalchemy.orm import Session

from ..database import get_db
from ..models.labor_entries import RateType
from ..services.recommendation_service import RecommendationService


router = APIRouter()


class LaborRecommendationResponse(BaseModel):
    recommended_rate: float
    rate_type: str
    sample_size: int
    historical_median: Optional[float] = None
    p25: Optional[float] = None
    p75: Optional[float] = None
    standard_reference: Optional[float] = None
    confidence: float
    notes: list[str]


@router.get("/labor", response_model=LaborRecommendationResponse)
def recommend_labor_rate(
    trade: str = Query(..., description="직종명 예: 목공, 철근공 등"),
    rate_type: RateType = Query(RateType.DAILY, description="단가 유형: daily | hourly"),
    task_code_prefix: Optional[str] = Query(None, description="작업코드 접두 (필터)"),
    project_id: Optional[int] = Query(None, description="프로젝트 ID (필터)"),
    lookback_days: int = Query(180, ge=1, le=3650, description="과거 조회 기간(일)"),
    db: Session = Depends(get_db),
):
    result = RecommendationService.recommend_labor_rate(
        db,
        trade=trade,
        rate_type=rate_type,
        task_code_prefix=task_code_prefix,
        project_id=project_id,
        lookback_days=lookback_days,
    )
    return result.dict()


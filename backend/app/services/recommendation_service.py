from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal
from statistics import median
from typing import Dict, List, Optional, Tuple

from sqlalchemy.orm import Session
from sqlalchemy import select

from ..models.labor_entries import LaborEntry, RateType
from ..models.work_items import WorkItem
from ..models.work_logs import WorkLog
from ..data.reference_data import STANDARD_TRADES


def _find_trade_standard(trade_name: str) -> Optional[dict]:
    """Return standard trade info by name match (exact)."""
    for t in STANDARD_TRADES:
        if t.get("name") == trade_name:
            return t
    return None


def _convert_rate_to(
    unit_rate: Decimal,
    from_type: RateType,
    to_type: RateType,
    assumed_hours_per_day: Decimal,
) -> Decimal:
    if from_type == to_type:
        return unit_rate
    if from_type == RateType.DAILY and to_type == RateType.HOURLY:
        return (unit_rate / assumed_hours_per_day).quantize(Decimal("0.01"))
    if from_type == RateType.HOURLY and to_type == RateType.DAILY:
        return (unit_rate * assumed_hours_per_day).quantize(Decimal("0.01"))
    return unit_rate


class LaborRateRecommendation:
    def __init__(
        self,
        recommended_rate: Decimal,
        rate_type: RateType,
        sample_size: int,
        historical_median: Optional[Decimal],
        p25: Optional[Decimal],
        p75: Optional[Decimal],
        standard_reference: Optional[Decimal],
        confidence: float,
        notes: List[str],
    ) -> None:
        self.recommended_rate = recommended_rate
        self.rate_type = rate_type
        self.sample_size = sample_size
        self.historical_median = historical_median
        self.p25 = p25
        self.p75 = p75
        self.standard_reference = standard_reference
        self.confidence = confidence
        self.notes = notes

    def dict(self) -> Dict:
        return {
            "recommended_rate": float(self.recommended_rate),
            "rate_type": self.rate_type.value,
            "sample_size": self.sample_size,
            "historical_median": float(self.historical_median) if self.historical_median is not None else None,
            "p25": float(self.p25) if self.p25 is not None else None,
            "p75": float(self.p75) if self.p75 is not None else None,
            "standard_reference": float(self.standard_reference) if self.standard_reference is not None else None,
            "confidence": self.confidence,
            "notes": self.notes,
        }


class RecommendationService:
    """Labor cost recommendation using recent history + standards.

    Strategy:
    - Use last N days of LaborEntry for the given trade (and optional task_code filter).
    - Convert rates to requested rate_type with an assumed hours-per-day.
    - Recommend median of history; fall back to standard reference when sparse.
    - Provide IQR (p25/p75) band and confidence score based on sample size.
    """

    DEFAULT_LOOKBACK_DAYS = 180
    ASSUMED_HOURS_PER_DAY = Decimal("8.0")

    @classmethod
    def recommend_labor_rate(
        cls,
        db: Session,
        *,
        trade: str,
        rate_type: RateType,
        task_code_prefix: Optional[str] = None,
        project_id: Optional[int] = None,
        lookback_days: int = DEFAULT_LOOKBACK_DAYS,
    ) -> LaborRateRecommendation:
        notes: List[str] = []

        # Pull historical records
        since = date.today() - timedelta(days=lookback_days)

        stmt = (
            select(LaborEntry)
            .join(WorkItem, LaborEntry.work_item_id == WorkItem.id)
            .join(WorkLog, WorkItem.work_log_id == WorkLog.id)
            .where(LaborEntry.trade == trade)
            .where(WorkLog.work_date >= since)
        )

        if project_id is not None:
            stmt = stmt.where(WorkLog.project_id == project_id)

        if task_code_prefix:
            # simple prefix match
            stmt = stmt.where(WorkItem.task_code.like(f"{task_code_prefix}%"))

        rows: List[LaborEntry] = list(db.execute(stmt).scalars())

        # Convert to requested rate type values
        values: List[Decimal] = []
        for r in rows:
            try:
                val = _convert_rate_to(
                    Decimal(str(r.unit_rate)),
                    r.rate_type,
                    rate_type,
                    cls.ASSUMED_HOURS_PER_DAY,
                )
                values.append(val)
            except Exception:
                continue

        sample_size = len(values)
        historical_median: Optional[Decimal] = None
        p25: Optional[Decimal] = None
        p75: Optional[Decimal] = None

        if sample_size > 0:
            values_sorted = sorted(values)
            historical_median = Decimal(str(median(values_sorted))).quantize(Decimal("0.01"))

            def percentile(sorted_vals: List[Decimal], p: float) -> Decimal:
                if not sorted_vals:
                    return Decimal("0")
                k = (len(sorted_vals) - 1) * p
                f = int(k)
                c = min(f + 1, len(sorted_vals) - 1)
                if f == c:
                    return sorted_vals[int(k)]
                d0 = sorted_vals[f] * (Decimal(c) - Decimal(k))
                d1 = sorted_vals[c] * (Decimal(k) - Decimal(f))
                return (d0 + d1).quantize(Decimal("0.01"))

            p25 = percentile(values_sorted, 0.25)
            p75 = percentile(values_sorted, 0.75)

        # Standard reference
        std_ref_rate: Optional[Decimal] = None
        std = _find_trade_standard(trade)
        if std:
            key = "standard_daily_rate" if rate_type == RateType.DAILY else "standard_hourly_rate"
            std_val = std.get(key)
            if std_val is not None:
                std_ref_rate = Decimal(str(std_val)).quantize(Decimal("0.01"))
        else:
            notes.append("표준 직종 표에 해당 직종이 없어 표준값 미제공")

        # Recommend
        if sample_size >= 5 and historical_median is not None:
            recommended = historical_median
            notes.append(f"최근 {lookback_days}일 내 {sample_size}건 이력의 중앙값 사용")
        elif sample_size > 0 and historical_median is not None and std_ref_rate is not None:
            # blend 70% history, 30% standard when data is sparse
            recommended = (historical_median * Decimal("0.7") + std_ref_rate * Decimal("0.3")).quantize(Decimal("0.01"))
            notes.append("이력 부족: 중앙값과 표준값 가중 평균(0.7/0.3)")
        elif historical_median is not None:
            recommended = historical_median
            notes.append("이력 부족: 중앙값 사용")
        elif std_ref_rate is not None:
            recommended = std_ref_rate
            notes.append("이력 없음: 표준 단가 제시")
        else:
            # Absolute fallback
            recommended = Decimal("0.00")
            notes.append("제안 불가: 이력/표준값 없음")

        # Confidence
        if sample_size >= 20:
            confidence = 0.9
        elif sample_size >= 10:
            confidence = 0.75
        elif sample_size >= 5:
            confidence = 0.6
        elif sample_size >= 1:
            confidence = 0.45
        else:
            confidence = 0.2

        return LaborRateRecommendation(
            recommended_rate=recommended,
            rate_type=rate_type,
            sample_size=sample_size,
            historical_median=historical_median,
            p25=p25,
            p75=p75,
            standard_reference=std_ref_rate,
            confidence=confidence,
            notes=notes,
        )


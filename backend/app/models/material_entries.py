from sqlalchemy import Column, Integer, String, ForeignKey, Numeric, Enum
from sqlalchemy.orm import relationship
from ..database import Base
import enum

class StockType(str, enum.Enum):
    STOCK = "stock"       # 재고
    PURCHASE = "purchase" # 구매

class MaterialEntry(Base):
    __tablename__ = "material_entries"
    
    entry_id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("work_items.item_id"), nullable=False)
    material_code = Column(String, index=True)  # 표준품명/KS 코드
    material_name = Column(String, nullable=False)
    specification = Column(String)  # 규격
    quantity = Column(Numeric(10, 3), nullable=False)
    unit = Column(String, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    total_cost = Column(Numeric(12, 2), nullable=False)
    stock_type = Column(Enum(StockType), default=StockType.PURCHASE)
    supplier = Column(String)  # 공급처
    
    # Relationships
    work_item = relationship("WorkItem", back_populates="material_entries")
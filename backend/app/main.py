from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import clients, projects, work_logs, invoices
from .routers import recommendations
from .database import engine

# 테이블은 이미 Supabase에서 생성되었으므로 create_all 제거

app = FastAPI(
    title="건설업 현장 관리 시스템",
    description="현장 작업 단위 입력부터 청구서/세금계산서 출력까지 통합 관리",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 오리진 허용 (개발용)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

"""
Note: some legacy routers are disabled below. The recommendations router is enabled
to support labor-rate suggestions without affecting other endpoints.
"""

# app.include_router(clients.router, prefix="/api/clients", tags=["clients"])
# app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
# app.include_router(work_logs.router, prefix="/api/work-logs", tags=["work-logs"])
# app.include_router(invoices.router, prefix="/api/invoices", tags=["invoices"])

# Enable the new recommendation endpoints
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["recommendations"])

# Import additional routers (temporarily disabled due to missing dependencies)
# from .routers import aggregation, pdf_export, reference
# app.include_router(aggregation.router, prefix="/api/aggregation", tags=["aggregation"])
# app.include_router(pdf_export.router, prefix="/api/export", tags=["export"])
# app.include_router(reference.router, prefix="/api/reference", tags=["reference"])

@app.get("/")
async def root():
    return {"message": "건설업 현장 관리 시스템 API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/test")
async def test_api():
    return {"message": "API 연결 성공!", "status": "ok"}

@app.get("/api/clients")
async def get_clients_simple():
    return {"clients": [], "message": "클라이언트 API 테스트 성공"}

@app.post("/api/clients")
async def create_client_simple(client_data: dict):
    """간단한 클라이언트 생성 API (마이그레이션용)"""
    try:
        # 기본 ID 생성 (타임스탬프 기반)
        import time
        client_id = int(time.time() * 1000)
        
        response_data = {
            "id": client_id,
            "company_name": client_data.get("company_name"),
            "message": "클라이언트 생성 성공 (임시)"
        }
        
        print(f"📝 클라이언트 생성: {client_data.get('company_name')}")
        return response_data
    except Exception as e:
        return {"error": str(e)}

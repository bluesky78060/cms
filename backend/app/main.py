from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import clients, projects, work_logs, invoices
from .database import engine
from . import models

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="건설업 현장 관리 시스템",
    description="현장 작업 단위 입력부터 청구서/세금계산서 출력까지 통합 관리",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(clients.router, prefix="/api/clients", tags=["clients"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(work_logs.router, prefix="/api/work-logs", tags=["work-logs"])
app.include_router(invoices.router, prefix="/api/invoices", tags=["invoices"])

# Import additional routers
from .routers import aggregation, pdf_export, reference
app.include_router(aggregation.router, prefix="/api/aggregation", tags=["aggregation"])
app.include_router(pdf_export.router, prefix="/api/export", tags=["export"])
app.include_router(reference.router, prefix="/api/reference", tags=["reference"])

@app.get("/")
async def root():
    return {"message": "건설업 현장 관리 시스템 API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
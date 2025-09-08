from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from ..database import get_db
from ..services.pdf_service import PDFGenerationService

router = APIRouter()

@router.get("/invoices/{invoice_id}/pdf")
def download_invoice_pdf(invoice_id: int, db: Session = Depends(get_db)):
    """청구서 PDF 다운로드"""
    try:
        pdf_service = PDFGenerationService(db)
        pdf_bytes = pdf_service.generate_invoice_pdf(invoice_id)
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=invoice_{invoice_id}.pdf"
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF 생성 중 오류가 발생했습니다: {str(e)}")

@router.get("/invoices/{invoice_id}/detailed-report/pdf")
def download_detailed_report_pdf(invoice_id: int, db: Session = Depends(get_db)):
    """상세 작업내역서 PDF 다운로드"""
    try:
        pdf_service = PDFGenerationService(db)
        pdf_bytes = pdf_service.generate_detailed_report_pdf(invoice_id)
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=detailed_report_{invoice_id}.pdf"
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF 생성 중 오류가 발생했습니다: {str(e)}")

@router.get("/invoices/{invoice_id}/preview")
def preview_invoice_html(invoice_id: int, db: Session = Depends(get_db)):
    """청구서 HTML 미리보기"""
    try:
        pdf_service = PDFGenerationService(db)
        invoice_data = pdf_service._get_invoice_data(invoice_id)
        
        if not invoice_data:
            raise HTTPException(status_code=404, detail="청구서를 찾을 수 없습니다")
        
        html_content = pdf_service._generate_invoice_html(invoice_data)
        css_content = pdf_service._get_invoice_css()
        
        full_html = f"""
        <style>
        {css_content}
        </style>
        {html_content}
        """
        
        return Response(content=full_html, media_type="text/html")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"미리보기 생성 중 오류가 발생했습니다: {str(e)}")

@router.get("/test-pdf")
def test_pdf_generation():
    """PDF 생성 테스트 엔드포인트"""
    try:
        from weasyprint import HTML
        
        test_html = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #333; }
            </style>
        </head>
        <body>
            <h1>PDF 생성 테스트</h1>
            <p>이것은 PDF 생성 테스트 문서입니다.</p>
            <p>한글 텍스트가 올바르게 표시되는지 확인합니다.</p>
        </body>
        </html>
        """
        
        html_doc = HTML(string=test_html)
        pdf_bytes = html_doc.write_pdf()
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=test.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF 테스트 중 오류: {str(e)}")
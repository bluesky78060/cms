from weasyprint import HTML, CSS
from typing import Dict, List, Optional
from datetime import date
from decimal import Decimal
from sqlalchemy.orm import Session
from ..models import Invoice, InvoiceLine, Project, Client
import tempfile
import os

class PDFGenerationService:
    """청구서/거래명세서 PDF 생성 서비스"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def generate_invoice_pdf(self, invoice_id: int) -> bytes:
        """청구서 PDF 생성"""
        invoice_data = self._get_invoice_data(invoice_id)
        if not invoice_data:
            raise ValueError("청구서를 찾을 수 없습니다")
        
        html_content = self._generate_invoice_html(invoice_data)
        css_content = self._get_invoice_css()
        
        # PDF 생성
        html_doc = HTML(string=html_content)
        css_doc = CSS(string=css_content)
        
        return html_doc.write_pdf(stylesheets=[css_doc])
    
    def generate_detailed_report_pdf(self, invoice_id: int) -> bytes:
        """상세 작업내역서 PDF 생성"""
        invoice_data = self._get_invoice_data(invoice_id)
        work_details = self._get_work_details(invoice_data['project_id'])
        
        html_content = self._generate_detailed_report_html(invoice_data, work_details)
        css_content = self._get_report_css()
        
        html_doc = HTML(string=html_content)
        css_doc = CSS(string=css_content)
        
        return html_doc.write_pdf(stylesheets=[css_doc])
    
    def _get_invoice_data(self, invoice_id: int) -> Optional[Dict]:
        """청구서 데이터 조회"""
        invoice = self.db.query(Invoice).filter(Invoice.invoice_id == invoice_id).first()
        if not invoice:
            return None
        
        project = self.db.query(Project).filter(Project.project_id == invoice.project_id).first()
        client = self.db.query(Client).filter(Client.client_id == project.client_id).first()
        lines = self.db.query(InvoiceLine).filter(InvoiceLine.invoice_id == invoice_id).all()
        
        return {
            'invoice': invoice,
            'project': project,
            'client': client,
            'lines': lines
        }
    
    def _get_work_details(self, project_id: int) -> Dict:
        """작업 상세 내역 조회 (작업일지, 투입내역 등)"""
        # 이 부분은 실제 데이터 조회 로직 구현 필요
        return {
            'work_logs': [],
            'labor_entries': [],
            'equipment_entries': [],
            'material_entries': []
        }
    
    def _generate_invoice_html(self, data: Dict) -> str:
        """청구서 HTML 생성"""
        invoice = data['invoice']
        project = data['project']
        client = data['client']
        lines = data['lines']
        
        # 한국 원화 포맷팅
        def format_won(amount):
            if amount is None:
                return "₩0"
            return f"₩{int(amount):,}"
        
        html = f"""
        <!DOCTYPE html>
        <html lang="ko">
        <head>
            <meta charset="UTF-8">
            <title>청구서 - {invoice.invoice_number}</title>
        </head>
        <body>
            <div class="invoice-header">
                <h1>세금계산서 겸 청구서</h1>
                <div class="invoice-info">
                    <table>
                        <tr>
                            <td><strong>청구서 번호:</strong></td>
                            <td>{invoice.invoice_number}</td>
                            <td><strong>발행일자:</strong></td>
                            <td>{invoice.issue_date}</td>
                        </tr>
                        <tr>
                            <td><strong>청구기간:</strong></td>
                            <td colspan="3">{invoice.period_from} ~ {invoice.period_to} ({invoice.sequence}차 기성)</td>
                        </tr>
                    </table>
                </div>
            </div>
            
            <div class="parties">
                <div class="supplier">
                    <h3>공급자</h3>
                    <div class="company-info">
                        <p><strong>[귀사명]</strong></p>
                        <p>사업자등록번호: [사업자번호]</p>
                        <p>주소: [주소]</p>
                        <p>대표자: [대표자명]</p>
                    </div>
                </div>
                
                <div class="buyer">
                    <h3>공급받는자</h3>
                    <div class="company-info">
                        <p><strong>{client.company_name}</strong></p>
                        <p>사업자등록번호: {client.business_number or ''}</p>
                        <p>주소: {client.address or ''}</p>
                        <p>대표자: {client.representative or ''}</p>
                    </div>
                </div>
            </div>
            
            <div class="project-info">
                <h3>공사개요</h3>
                <table>
                    <tr>
                        <td><strong>공사명:</strong></td>
                        <td>{project.project_name}</td>
                    </tr>
                    <tr>
                        <td><strong>공사위치:</strong></td>
                        <td>{project.address or ''}</td>
                    </tr>
                    <tr>
                        <td><strong>계약금액:</strong></td>
                        <td>{format_won(project.contract_amount)}</td>
                    </tr>
                </table>
            </div>
            
            <div class="invoice-details">
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>항목</th>
                            <th>공급가액</th>
                            <th>세액</th>
                            <th>합계</th>
                        </tr>
                    </thead>
                    <tbody>
        """
        
        # 청구서 라인 추가
        for line in lines:
            html += f"""
                        <tr>
                            <td>{line.description}</td>
                            <td class="amount">{format_won(line.supply_amount)}</td>
                            <td class="amount">{format_won(line.vat_amount)}</td>
                            <td class="amount">{format_won(line.total_amount)}</td>
                        </tr>
            """
        
        html += f"""
                    </tbody>
                    <tfoot>
                        <tr class="total-row">
                            <td><strong>합계</strong></td>
                            <td class="amount"><strong>{format_won(invoice.supply_amount)}</strong></td>
                            <td class="amount"><strong>{format_won(invoice.vat_amount)}</strong></td>
                            <td class="amount"><strong>{format_won(invoice.total_amount)}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <div class="payment-info">
                <h3>입금 정보</h3>
                <p>계좌번호: [은행명] [계좌번호]</p>
                <p>예금주: [예금주명]</p>
                <p>입금기한: [입금기한]</p>
            </div>
            
            <div class="notes">
                <h3>특기사항</h3>
                <p>• 본 청구서는 전자세금계산서 발행 기준에 따라 작성되었습니다.</p>
                <p>• 기재된 공급가액과 세액을 확인하시기 바랍니다.</p>
                <p>• 문의사항이 있으시면 담당자에게 연락하시기 바랍니다.</p>
            </div>
            
            <div class="footer">
                <p class="generated-info">
                    본 청구서는 건설업 현장 관리 시스템에서 자동 생성되었습니다.<br>
                    생성일시: {date.today()}
                </p>
            </div>
        </body>
        </html>
        """
        
        return html
    
    def _get_invoice_css(self) -> str:
        """청구서 CSS 스타일"""
        return """
        @page {
            size: A4;
            margin: 2cm;
        }
        
        body {
            font-family: 'Malgun Gothic', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
        }
        
        .invoice-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
        }
        
        .invoice-header h1 {
            font-size: 24px;
            font-weight: bold;
            margin: 0 0 15px 0;
        }
        
        .invoice-info table {
            width: 100%;
            font-size: 11px;
        }
        
        .invoice-info td {
            padding: 3px 8px;
        }
        
        .parties {
            display: flex;
            justify-content: space-between;
            margin-bottom: 25px;
        }
        
        .supplier, .buyer {
            width: 48%;
            border: 1px solid #ccc;
            padding: 15px;
        }
        
        .supplier h3, .buyer h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            background: #f5f5f5;
            padding: 5px;
            text-align: center;
        }
        
        .company-info p {
            margin: 5px 0;
            font-size: 11px;
        }
        
        .project-info {
            margin-bottom: 25px;
        }
        
        .project-info h3 {
            background: #f5f5f5;
            padding: 8px;
            margin: 0 0 10px 0;
            font-size: 14px;
        }
        
        .project-info table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .project-info td {
            padding: 8px;
            border: 1px solid #ddd;
        }
        
        .project-info td:first-child {
            background: #f9f9f9;
            width: 120px;
            font-weight: bold;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }
        
        .items-table th, .items-table td {
            border: 1px solid #333;
            padding: 12px 8px;
            text-align: left;
        }
        
        .items-table th {
            background: #f5f5f5;
            font-weight: bold;
            text-align: center;
        }
        
        .items-table .amount {
            text-align: right;
            font-weight: bold;
        }
        
        .total-row {
            background: #f0f0f0;
        }
        
        .total-row td {
            border-top: 2px solid #333;
        }
        
        .payment-info {
            margin-bottom: 20px;
            border: 1px solid #ccc;
            padding: 15px;
        }
        
        .payment-info h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
        }
        
        .notes {
            margin-bottom: 20px;
        }
        
        .notes h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
        }
        
        .notes p {
            margin: 5px 0;
            font-size: 11px;
        }
        
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 15px;
        }
        """
    
    def _generate_detailed_report_html(self, invoice_data: Dict, work_details: Dict) -> str:
        """상세 작업내역서 HTML 생성"""
        # 상세 작업내역서 HTML 생성 로직
        return """
        <!DOCTYPE html>
        <html lang="ko">
        <head>
            <meta charset="UTF-8">
            <title>작업내역서</title>
        </head>
        <body>
            <h1>작업내역서 (상세)</h1>
            <p>작업일지 기반 상세 내역이 표시됩니다.</p>
        </body>
        </html>
        """
    
    def _get_report_css(self) -> str:
        """작업내역서 CSS 스타일"""
        return self._get_invoice_css()  # 기본적으로 같은 스타일 사용
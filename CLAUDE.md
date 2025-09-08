# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (React + Electron)
```bash
cd frontend
npm start                    # Start development server (port 3000)
npm run build               # Production build
npm test                    # Run tests
npm run electron-dev        # Run Electron desktop app in development
npm run dist-mac           # Build macOS desktop application
npm run dist-win           # Build Windows desktop application
```

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python run_server.py       # Start development server (port 8000)
uvicorn app.main:app --reload --port 8000  # Alternative start command
```

### Database (PostgreSQL)
```bash
# Create database and user (first time setup)
sudo -u postgres createdb construction_db
sudo -u postgres createuser -P construction_user

# Run migrations
cd backend
alembic upgrade head
```

## Architecture Overview

This is a **dual-architecture system** with both a **React SPA frontend** for web deployment and **Electron desktop application** capabilities.

### Current State vs. Planned Architecture

**Currently Implemented:**
- **Frontend-Only React Application**: Fully functional standalone React app with in-memory state management
- **Excel Integration**: Complete Excel import/export functionality using `xlsx` library
- **PDF Generation**: Client-side PDF generation using `jspdf` and browser printing
- **Electron Desktop App**: Desktop application packaging ready

**Planned (Backend exists but not integrated):**
- **FastAPI Backend**: Complete RESTful API with database integration
- **PostgreSQL Database**: Production-ready data persistence
- **WeasyPrint PDF**: Server-side PDF generation

### Data Management

**Current Implementation:**
- **AppContext (React Context API)**: All data stored in `frontend/src/contexts/AppContext.js`
- **In-Memory State**: No persistence between sessions
- **Excel as Data Source**: Primary method for bulk data import/export

**Key Data Entities:**
- `companyInfo`: Construction company details (single object)
- `clients`: Client/project owner information with nested `workplaces`
- `workItems`: Individual work tasks with client/project relationships
- `invoices`: Billing documents with nested `workItems` arrays

### Component Architecture

**Core Components:**
- `Clients.js`: Client management with Excel import/export, workplace management
- `WorkItems.js`: Task management with filtering, bulk operations, Excel integration
- `Invoices.js`: Invoice generation with PDF export, Korean number formatting

**Shared Utilities:**
- `excelUtils.js`: Complete Excel operations (import/export/templates) for all entities
- `numberToKorean.js`: Currency formatting for Korean invoices

### Key Features

**Excel Integration Pattern:**
All major components follow this pattern:
```javascript
import { exportToExcel, importFromExcel, createTemplate } from '../utils/excelUtils';

// Export current data
const handleExportToExcel = () => exportToExcel.entityName(data);

// Import from Excel file
const handleImportFromExcel = async (e) => {
  const file = e.target.files[0];
  const imported = await importFromExcel.entityName(file);
  // Merge with existing data
};

// Download template
const handleDownloadTemplate = () => createTemplate.entityName();
```

**Korean Localization:**
- Currency amounts displayed in Korean text format using `numberToKorean()`
- All UI text and column headers in Korean
- Invoice templates formatted for Korean business practices

**PDF Generation:**
- Client-side PDF generation using `jspdf` and browser printing
- Korean font support via Google Fonts
- Invoice templates with company branding and legal formatting

### Bulk Operations

**Work Items Bulk Input:**
- Modal-based interface for adding multiple work items under single client/project
- Dynamic form arrays with add/remove capabilities
- Validation ensures all items share same client/project context

**Checkbox Selection:**
- Multi-select functionality for generating invoices from selected completed work items
- Validation ensures selected items belong to same client

### State Management Patterns

**Context Provider Pattern:**
```javascript
// AppContext provides all data and methods
const { clients, setClients, workItems, setWorkItems, invoices, setInvoices } = useApp();

// Helper functions for cross-entity operations
getCompletedWorkItemsByClient(clientId)
addWorkItemToInvoice(workItem)
```

**Form State Management:**
- Local state for form inputs with controlled components
- Separate state management for editing vs. creating
- Modal state management for complex multi-step forms

### Development Notes

**Excel File Structure:**
- Templates use Korean column headers matching UI terminology
- Import functions handle ID assignment and data validation
- Column width optimization for Korean text readability

**PDF Generation Workflow:**
1. Set `printInvoice` state to trigger PDF render
2. Hidden component renders print-optimized layout
3. Browser print dialog opens with styled content
4. Auto-cleanup prevents UI state issues

**Desktop App Packaging:**
- Electron configuration supports both macOS and Windows
- App icon and metadata configured for Korean market
- Build process includes React production build

### Backend Integration (When Needed)

The backend follows FastAPI patterns with:
- **SQLAlchemy models** in `backend/app/models/`
- **Pydantic schemas** in `backend/app/schemas/`
- **API routers** in `backend/app/routers/`
- **Business services** in `backend/app/services/`

**Database Models:**
- `clients`, `projects` (workplaces), `work_logs` (work items)
- `invoices`, `invoice_lines` with proper relationships
- Reference data for standard construction pricing

To integrate backend:
1. Replace AppContext state with API calls using `axios`
2. Implement authentication/authorization
3. Switch PDF generation to server-side using WeasyPrint
4. Add real-time data synchronization

### Testing Strategy

**Frontend Testing:**
- Jest/React Testing Library for components
- Excel utility function testing with sample data
- PDF generation testing with headless browser

**Backend Testing:**
- FastAPI test client for API endpoints
- Database integration testing with test fixtures
- PDF generation service testing

### Performance Considerations

**Current Optimizations:**
- React Context memo optimization for large datasets
- Excel processing with streaming for large files
- PDF generation with optimized rendering

**Scalability Paths:**
- Database integration for data persistence
- Server-side Excel processing for large datasets
- Caching strategies for frequently accessed data
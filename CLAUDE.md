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
- **localStorage Persistence**: Data persisted in browser's localStorage
- **Data Migration System**: Complete migration infrastructure from localStorage to Supabase
- **Backup/Restore System**: JSON-based data backup and restoration capabilities
- **Excel as Data Source**: Primary method for bulk data import/export

**Data Storage Evolution:**
1. **Phase 1 (Current)**: localStorage with in-browser persistence
2. **Phase 2 (Available)**: Supabase cloud database with migration tools
3. **Phase 3 (Planned)**: Full cloud-native with real-time sync

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
- `dataMigration.js`: localStorage to Supabase migration functionality
- `dataRestore.js`: JSON backup file restoration utilities
- `phoneFormatter.js`: Korean phone number formatting

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

**Data Migration & Backup System:**
- **MigrationPanel Component**: UI for data backup, restore, and migration operations
- **Three-stage process**: 📁 데이터 백업 → 📂 데이터 복원 → 🚀 마이그레이션 시작
- **JSON Backup**: Complete data export to timestamped JSON files
- **File-based Restore**: Upload and restore from backup JSON files
- **Supabase Migration**: Direct migration from localStorage to cloud database
- **Safety Features**: Confirmation dialogs, detailed logging, error handling

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

**Deployment Configuration:**
- **GitHub Pages**: Primary deployment via GitHub Actions workflow (`.github/workflows/deploy.yml`)
- **Repository Name**: Short URL using `cms` repository name → `https://username.github.io/cms`
- **SPA Routing**: GitHub Pages SPA routing with `404.html` and routing script in `index.html`
- **React Router**: Uses `basename="/cms"` for GitHub Pages subpath routing
- **Node.js 18**: Specified version for consistent builds with `--legacy-peer-deps` flag
- **Build Command**: `npm install && npm run build` for dependency resolution
- **ESLint**: Strict mode enabled, treats warnings as errors in CI
- **Netlify**: Legacy configuration maintained in `netlify.toml` for reference

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

**Supabase Integration:**
- **Environment Configuration**: Database connection via `backend/.env`
- **Transaction Pooler**: Uses Supabase pooler for connection management
- **Migration Scripts**: Available in `backend/setup_database.py`
- **API Layer**: Simple endpoints in `backend/app/main.py` for migration testing

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

## Data Migration & Backup Patterns

### Migration System Architecture

**Three-Tier Approach:**
1. **Local Storage (localStorage)**: Browser-based persistence with JSON serialization
2. **Backup System**: File-based JSON export/import for data portability
3. **Cloud Database (Supabase)**: PostgreSQL with migration utilities

**Migration Flow:**
```javascript
// 1. Extract from localStorage
const localData = extractLocalStorageData();

// 2. Transform to API format
const apiData = transformClientData(localData.CLIENTS);

// 3. Send to backend
await fetch('/api/clients', { method: 'POST', body: JSON.stringify(apiData) });
```

### Backup/Restore Patterns

**Backup Creation:**
```javascript
// Automatic timestamped backup
const backup = {
  timestamp: new Date().toISOString(),
  data: extractLocalStorageData()
};
downloadAsJSON(backup, `localStorage-backup-${dateStamp}.json`);
```

**Restore Process:**
```javascript
// File upload → Parse → Validate → Restore → Reload
const restoreFromBackup = async (backupFile) => {
  const data = JSON.parse(await backupFile.text());
  Object.keys(STORAGE_KEYS).forEach(key => {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data[key]));
  });
  window.location.reload();
};
```

### ESLint Configuration Considerations

**Strict Mode:** The application runs ESLint in strict mode where warnings become errors during CI builds. Key patterns:

- **Remove unused imports** immediately to prevent build failures
- **Avoid unused variables** in utility functions
- **Export only used functions** from utility modules
- **Clean imports** when refactoring migration utilities

### Development Workflow for Data Features

**Adding New Migration Features:**
1. **Update localStorage schema** in `dataMigration.js` constants
2. **Add transformation functions** for new data types
3. **Test backup/restore** with sample data
4. **Update MigrationPanel UI** for new functionality
5. **Verify GitHub Pages deployment** passes ESLint checks

### GitHub Pages Deployment Workflow

**Automatic Deployment:**
- Triggers on push to `main` branch via GitHub Actions
- Builds React app with correct `basename="/cms"` configuration
- Deploys to `https://username.github.io/cms` automatically
- SPA routing handled by `404.html` redirect mechanism

**Manual Deployment:**
- Can be triggered via GitHub Actions "workflow_dispatch" event
- All builds use Node.js 18 with `--legacy-peer-deps` for compatibility

**Repository Name Changes:**
- When changing repository name, update:
  1. `homepage` field in `frontend/package.json`
  2. `basename` prop in `frontend/src/App.js` React Router
  3. Rebuild and deploy for changes to take effect

### User Interface Enhancements

**Dashboard Features:**
- **Backup Reminder**: Elegant notice in top-right corner encouraging daily data backup
- **Statistics Cards**: Real-time display of monthly invoices, unpaid amounts, completed work, and client count
- **Recent Invoices Table**: Shows latest 5 invoices with status indicators

**Data Protection:**
- Prominent backup reminder with gradient styling and 💾 icon
- Three-tier data management: localStorage → JSON backup → Cloud database migration
- Color-coded status indicators throughout the interface for better UX
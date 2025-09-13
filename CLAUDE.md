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
- **Hybrid Storage Architecture**: Local file system (Electron) + localStorage (Web) with automatic environment detection
- **Local File Storage**: OS-native folder-based data persistence in `~/Documents/CMS-Data/`
- **AppContext (React Context API)**: All data stored in `frontend/src/contexts/AppContext.js`
- **localStorage Fallback**: Browser localStorage for web environments and backup storage
- **Data Migration System**: localStorage → Local Files → Supabase migration chain
- **Backup/Restore System**: File-based JSON backup with timestamped archives
- **Excel as Data Source**: Primary method for bulk data import/export

**Data Storage Evolution:**
1. **Phase 1**: localStorage with in-browser persistence (legacy)
2. **Phase 2 (Current)**: Hybrid local file + localStorage system with automatic migration
3. **Phase 3 (Available)**: Supabase cloud database with migration tools
4. **Phase 4 (Planned)**: Full cloud-native with real-time sync

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

### Critical Implementation Details

**Data Persistence Race Condition Fix:**
- `isDataLoaded` flag prevents save effects from running before initial load
- Save useEffect hooks only execute after `isDataLoaded` is true
- Prevents empty arrays from overwriting loaded localStorage data

**Multi-User Data Loading:**
```javascript
// Load sequence in AppContext.js
useEffect(() => {
  if (isLoggedIn && currentUser) {
    // 1. Load all user data from localStorage
    setCompanyInfo(loadFromStorage(storageKeys.COMPANY_INFO, defaultCompanyInfo));
    setClients(loadFromStorage(storageKeys.CLIENTS, defaultClients));
    // ... other data
    setIsDataLoaded(true); // 2. Mark as loaded
  } else {
    setIsDataLoaded(false); // 3. Reset on logout
  }
}, [isLoggedIn, currentUser]);

// Save effects only run after data is loaded
useEffect(() => {
  if (isLoggedIn && currentUser && isDataLoaded) {
    saveToStorage(storageKeys.CLIENTS, clients);
  }
}, [clients, isLoggedIn, isDataLoaded, currentUser]);
```

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

**Common ESLint Issues:**
- **Unnecessary escape characters**: Fix regex patterns like `CMS-[A-Z가-힣0-9\\-]+` → `CMS-[A-Z가-힣0-9\-]+`
- **Missing dependencies in useEffect**: Add functions to dependency array or wrap in useCallback
- **Unused variables in destructuring**: Remove unused variables from context destructuring
- **Hot reloading issues**: Multiple npm processes can cause compilation errors - kill all processes and restart

**Debugging Development Server Issues:**
```bash
# Kill all npm processes
pkill -f "npm start"

# Check port usage
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Clean restart
cd frontend && npm start
# or for alternate port
cd frontend && PORT=3001 npm start
```

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

## Security Architecture

### Multi-User System with File-Based Authentication

**Authentication Flow:**
1. **Security Key Authentication**: File-based `.cmskey` authentication system
2. **User Selection**: Simple username-based user identification
3. **Data Isolation**: Per-user localStorage namespacing

**Security Key System:**
- **File Format**: `.cmskey` files containing JSON with validation fields
- **Key Structure**: `keyId`, `issuedTo`, `issuedDate`, `expiryDate`, `signature`, `permissions`
- **Validation**: Whitelist-based key ID validation with expiry checking
- **Persistence**: Automatic key storage and validation on subsequent visits

**User Data Isolation:**
```javascript
// User-specific localStorage keys pattern
USER_{username}_{dataType}
// Examples:
USER_하늘건설_CLIENTS
USER_하늘건설_WORK_ITEMS  
USER_하늘건설_INVOICES
```

**Components:**
- `SecurityKeyAuth.js`: File upload/drag-drop authentication interface
- `UserContext.js`: User session management and data isolation
- `Login.js`: Simple username selection after security validation

### Default Configuration

**Units:** `['식', 'm', '㎡', 'kg', '톤', '개', '회', '일']`
**Categories:** `['토목공사', '구조공사', '철거공사', '마감공사', '설비공사', '기타']`

**Data Loading Logic:**
- Empty arrays in localStorage are replaced with default values
- User-specific defaults applied on first login
- Automatic category updates when new defaults are added

### Browser Event-Based Security Validation

**Real-time Security Monitoring:**
- **Window Focus Events**: Re-validates security keys when browser window gains focus
- **Visibility Change**: Validates keys when user switches back to the tab
- **Storage Events**: Monitors cross-tab security key changes and auto-logs out
- **Before Unload**: Optional cleanup on browser close (currently disabled)

**Implementation in App.js:**
```javascript
// Browser event listeners for security validation
const handleWindowFocus = async () => {
  const isValid = await validateStoredSecurityKey();
  if (!isValid && isSecurityVerified) {
    window.location.reload(); // Force re-authentication
  }
};

// Event registration
window.addEventListener('focus', handleWindowFocus);
document.addEventListener('visibilitychange', handleVisibilityChange);
window.addEventListener('storage', handleStorageChange);
```

### Logout System Enhancements

**Dual Logout Options:**
- **🔒 Light Logout (lightLogout)**: Preserves security key cache, logs out user only
- **🚪 Complete Logout (logout)**: Clears all authentication data including security keys

**Dropdown Navigation:**
- Dropdown menu in navigation bar with visual icons and descriptions
- Clear confirmation dialogs explaining the difference between logout types
- Outside-click handling to close dropdown automatically

**UserContext Functions:**
```javascript
// Light logout - preserves security key
const lightLogout = () => {
  setCurrentUser(null);
  localStorage.removeItem('CURRENT_USER');
};

// Complete logout - clears everything
const logout = () => {
  setCurrentUser(null);
  localStorage.removeItem('CURRENT_USER');
  localStorage.removeItem('SECURITY_KEY_VERIFIED');
  localStorage.removeItem('VERIFIED_KEY_DATA');
  window.location.reload();
};
```

### Advanced Security Planning

**Current Security Level**: Browser event-based file authentication with real-time validation
**Planned Enhancement**: Hardware fingerprinting for device binding
- Computer-specific key binding using browser fingerprinting
- Encrypted key storage with device signatures  
- Copy protection through hardware validation
- Implementation plan available in `ADVANCED_SECURITY_PLAN.md`

## Local File Storage System

### Architecture Overview

**Hybrid Storage Strategy**: The application now uses a sophisticated dual-storage system that automatically detects the environment and chooses the optimal storage method:

- **Electron Environment**: Local file system storage with localStorage backup
- **Web Browser Environment**: localStorage-only with migration capabilities
- **Seamless Migration**: Automatic data migration from localStorage to local files

### Directory Structure and Bootstrap System

**Automatic Folder Creation** with intelligent fallback chain:

```
📁 Primary: ~/Documents/CMS-Data/
├── 📁 users/                    # User-specific data files
│   ├── {username}_{datatype}.json
│   ├── admin_CLIENTS.json
│   ├── admin_WORK_ITEMS.json
│   └── user1_COMPANY_INFO.json
├── 📁 projects/                 # Future project files
├── 📁 invoices/                 # Generated invoice documents  
├── 📁 backups/                  # Automatic timestamped backups
│   ├── backup_admin_2025-09-12T10-30-45.json
│   └── backup_all_2025-09-12T11-15-20.json
├── 📁 security-keys/            # Security key management
└── .cms-init.json              # Initialization marker
```

**Platform-Specific Fallback Chain:**

**macOS:**
1. `~/Documents/CMS-Data/` (primary)
2. `~/Library/Application Support/CMS/CMS-Data/` (system standard)
3. `~/Desktop/CMS-Data/` (visible fallback)
4. `/tmp/CMS/CMS-Data/` (last resort)

**Windows:**
1. `%USERPROFILE%\Documents\CMS-Data\` (primary)
2. `%LOCALAPPDATA%\CMS\CMS-Data\` (system standard)
3. `%USERPROFILE%\Desktop\CMS-Data\` (visible fallback)
4. `%TEMP%\CMS\CMS-Data\` (last resort)

**Linux:**
1. `~/Documents/CMS-Data/` (primary)
2. `~/.local/share/CMS/CMS-Data/` (XDG standard)
3. `~/Desktop/CMS-Data/` (visible fallback)
4. `/tmp/CMS/CMS-Data/` (last resort)

### Core Implementation Files

**Bootstrap Module** (`frontend/src/utils/bootstrapDataDir.js`):
- Intelligent directory resolution with permission testing
- First-run detection and initialization
- Disk space validation
- Error handling with user-friendly messages

**File Storage Utility** (`frontend/src/utils/localFileStorage.js`):
- User-data isolation with metadata tracking
- Automatic backup generation
- localStorage migration capabilities
- Atomic file operations with error recovery

**Electron Integration** (`frontend/public/electron.js`):
- IPC handlers for main-renderer communication
- Data path resolution and sharing
- App initialization with bootstrap integration
- Error dialogs for initialization failures

### Data Persistence Patterns

**File Storage Format**:
```javascript
// Individual user data files: {username}_{dataType}.json
{
  "username": "admin",
  "dataType": "CLIENTS", 
  "data": [...],           // Actual application data
  "lastUpdated": "2025-09-12T10:30:45.123Z",
  "version": "1.0.0"       // Schema version for migrations
}
```

**Hybrid Storage Logic** in AppContext:
```javascript
// Priority: Local files → localStorage fallback
const loadFromStorage = async (currentUser, dataType, defaultValue) => {
  // Try file storage first (Electron)
  if (fileStorage && currentUser) {
    const data = await fileStorage.getUserData(currentUser, dataType, null);
    if (data !== null) return data;
  }
  
  // Fallback to localStorage
  const stored = localStorage.getItem(getUserStorageKey(currentUser, dataType));
  return stored ? JSON.parse(stored) : defaultValue;
};

// Dual save: Files + localStorage backup
const saveToStorage = async (currentUser, dataType, data) => {
  // Save to file storage (Electron)
  if (fileStorage && currentUser) {
    await fileStorage.setUserData(currentUser, dataType, data);
  }
  
  // Always backup to localStorage
  localStorage.setItem(getUserStorageKey(currentUser, dataType), JSON.stringify(data));
};
```

### Migration and Backup System

**Automatic Migration**:
- localStorage → Local Files: One-click migration via UI
- Preserves all user data with validation
- Post-migration data refresh for immediate availability

**Backup Capabilities**:
- **User-specific backups**: Single user's complete data
- **System-wide backups**: All users and configuration
- **Timestamped files**: Automatic naming with ISO timestamps
- **Metadata inclusion**: Creation time, version, and data integrity info

**Backup File Format**:
```javascript
{
  "createdAt": "2025-09-12T10:30:45.123Z",
  "type": "user|all",
  "data": {
    "username": {
      "CLIENTS": [...],
      "WORK_ITEMS": [...],
      // ... other data types
    }
  }
}
```

### Environment Detection and Initialization

**AppContext Integration**:
```javascript
// Environment-aware initialization
const initFileStorage = async () => {
  if (isElectron()) {
    const { ipcRenderer } = window.require('electron');
    const dataPath = await ipcRenderer.invoke('get-data-path');
    // Initialize file storage...
  }
  return false; // Web environment
};
```

**Electron IPC Handlers**:
```javascript
// Main process handlers
ipcMain.handle('get-data-path', () => globalDataPath);
ipcMain.handle('get-system-info', () => ({
  platform: process.platform,
  arch: process.arch,
  version: process.version
}));
```

### User Interface Integration

**StorageInfo Component** provides:
- Environment detection display (Desktop App vs Web Browser)
- File storage availability status
- Current data path visualization
- One-click migration button
- Backup creation interface
- Cross-platform compatibility indicators

**Dashboard Integration**:
- Storage system status in main dashboard
- Migration prompts for localStorage users
- Backup reminders with visual indicators
- Real-time storage health monitoring

### Cross-Platform Considerations

**Current Limitations**:
- Each OS stores data in platform-specific locations
- No automatic cross-platform synchronization
- Manual USB/cloud folder copying required for device switching

**Future Enhancement Paths**:
- Cloud service integration (iCloud, OneDrive, Google Drive)
- USB drive auto-detection and preference
- Network share support for office environments
- Manual folder selection for custom locations

### Development and Debugging

**File Storage Development**:
```bash
# Monitor data directory during development
# macOS/Linux:
tail -f ~/Documents/CMS-Data/.cms-init.json
ls -la ~/Documents/CMS-Data/users/

# Windows:
dir "%USERPROFILE%\Documents\CMS-Data\users\"
```

**Common Issues**:
- **Permission errors**: Fallback chain handles most cases automatically
- **Disk space**: Built-in space checking with user warnings  
- **File locking**: Atomic operations prevent corruption
- **Path resolution**: OS-specific path handling in bootstrap module

**Testing Storage Systems**:
- Test localStorage → file migration with sample data
- Verify backup/restore functionality across user accounts
- Cross-platform path resolution testing
- Permission handling in restricted environments
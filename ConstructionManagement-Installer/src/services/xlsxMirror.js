// Automatic XLSX mirror of core app data (read-only export for humans)
import * as XLSX from 'xlsx';
import { browserFs } from './browserFs';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

let timer = null;
let lastPayload = null;

function toArrayBuffer(workbook) {
  // Generate an ArrayBuffer for writing via Electron or File System Access
  const array = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return array; // ArrayBuffer
}

function normalizeArray(arr) {
  return Array.isArray(arr) ? arr : [];
}

export function buildWorkbook(snapshot) {
  const {
    companyInfo = {},
    clients = [],
    workItems = [],
    invoices = [],
    estimates = [],
    units = [],
    categories = [],
  } = snapshot || {};

  const wb = XLSX.utils.book_new();

  // Company (single row)
  const companyRows = [companyInfo];
  const wsCompany = XLSX.utils.json_to_sheet(companyRows);
  XLSX.utils.book_append_sheet(wb, wsCompany, 'Company');

  // Core entities
  const wsClients = XLSX.utils.json_to_sheet(normalizeArray(clients));
  XLSX.utils.book_append_sheet(wb, wsClients, 'Clients');

  const wsWorkItems = XLSX.utils.json_to_sheet(normalizeArray(workItems));
  XLSX.utils.book_append_sheet(wb, wsWorkItems, 'WorkItems');

  const wsInvoices = XLSX.utils.json_to_sheet(normalizeArray(invoices));
  XLSX.utils.book_append_sheet(wb, wsInvoices, 'Invoices');

  const wsEstimates = XLSX.utils.json_to_sheet(normalizeArray(estimates));
  XLSX.utils.book_append_sheet(wb, wsEstimates, 'Estimates');

  // Lookups
  const wsUnits = XLSX.utils.json_to_sheet(normalizeArray(units).map(v => ({ unit: v })));
  XLSX.utils.book_append_sheet(wb, wsUnits, 'Units');

  const wsCategories = XLSX.utils.json_to_sheet(normalizeArray(categories).map(v => ({ category: v })));
  XLSX.utils.book_append_sheet(wb, wsCategories, 'Categories');

  return wb;
}

async function writeViaElectron(ab) {
  if (typeof window === 'undefined') return false;
  const api = window.cms;
  if (!api || typeof api.writeXlsx !== 'function') return false;
  try {
    // Send as Uint8Array for efficient IPC transfer
    const uint = new Uint8Array(ab);
    await api.writeXlsx(uint, 'latest.xlsx');
    return true;
  } catch (e) {
    return false;
  }
}

async function writeViaBrowserFs(ab) {
  try {
    if (!browserFs.isSupported()) return false;
    const dir = await browserFs.getSavedDirectoryHandle();
    if (!dir) return false;
    const fileHandle = await dir.getFileHandle('latest.xlsx', { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(new Blob([ab], { type: XLSX_MIME }));
    await writable.close();
    return true;
  } catch (e) {
    return false;
  }
}

export async function mirrorNow(snapshot) {
  try {
    const wb = buildWorkbook(snapshot);
    const ab = toArrayBuffer(wb);
    // Prefer Electron path; fallback to browser directory if previously granted
    const okElectron = await writeViaElectron(ab);
    if (okElectron) return true;
    const okBrowser = await writeViaBrowserFs(ab);
    return okBrowser;
  } catch (e) {
    return false;
  }
}

export function scheduleMirror(snapshot, delayMs = 1000) {
  lastPayload = snapshot;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    mirrorNow(lastPayload);
  }, delayMs);
}


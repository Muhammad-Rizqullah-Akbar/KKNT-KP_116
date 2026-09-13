/**
 * SheetJS CDN Loader - Secure alternative to xlsx npm package
 * 
 * Problem: xlsx npm package has known vulnerabilities:
 * - GHSA-4r6h-8v6p-xvw6: Prototype Pollution (no fix from npm)
 * - GHSA-5pgg-2g8v-p4x9: ReDoS (no fix from npm)
 * 
 * Solution: Load SheetJS from official CDN (cdn.sheetjs.com) which provides
 * patched versions that are maintained separately.
 * 
 * @see https://cdn.sheetjs.com/
 * @see https://github.com/advisories/GHSA-4r6h-8v6p-xvw6
 */

'use client';

// Global XLSX instance (loaded once)
let xlsxModule: any = null;

/**
 * Load SheetJS from CDN and cache it
 */
async function loadXLSX(): Promise<any> {
  if (xlsxModule) return xlsxModule;
  
  if (typeof window === 'undefined') {
    throw new Error('SheetJS can only be loaded in browser environment');
  }
  
  // Check if already loaded via script tag
  if ((window as any).XLSX) {
    xlsxModule = (window as any).XLSX;
    return xlsxModule;
  }
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js';
    script.onload = () => {
      xlsxModule = (window as any).XLSX;
      resolve(xlsxModule);
    };
    script.onerror = () => {
      reject(new Error('Failed to load SheetJS from CDN'));
    };
    document.head.appendChild(script);
  });
}

/**
 * Create a new workbook object
 */
export async function book_new(): Promise<any> {
  const XLSX = await loadXLSX();
  return XLSX.utils.book_new();
}

/**
 * Append a sheet to workbook
 */
export async function book_append_sheet(workbook: any, worksheet: any, name: string): Promise<void> {
  const XLSX = await loadXLSX();
  XLSX.utils.book_append_sheet(workbook, worksheet, name);
}

/**
 * Convert array of objects to worksheet
 */
export async function json_to_sheet(data: any[]): Promise<any> {
  const XLSX = await loadXLSX();
  return XLSX.utils.json_to_sheet(data);
}

/**
 * Convert array of arrays to worksheet
 */
export async function aoa_to_sheet(data: any[][]): Promise<any> {
  const XLSX = await loadXLSX();
  return XLSX.utils.aoa_to_sheet(data);
}

/**
 * Write workbook to file and trigger download
 */
export async function write_file(workbook: any, filename: string): Promise<void> {
  const XLSX = await loadXLSX();
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob(
    [excelBuffer],
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
  );
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Write workbook to array buffer (for more control)
 */
export async function write(workbook: any, options: any): Promise<ArrayBuffer> {
  const XLSX = await loadXLSX();
  return XLSX.write(workbook, options);
}

// ============================================
// Convenience functions for common operations
// ============================================

/**
 * Export data to Excel file with single sheet
 */
export async function exportToExcel(
  data: Record<string, any>[],
  filename: string,
  sheetName: string = 'Sheet1'
): Promise<void> {
  const wb = await book_new();
  const ws = await json_to_sheet(data);
  await book_append_sheet(wb, ws, sheetName);
  await write_file(wb, filename);
}

/**
 * Export data to Excel with multiple sheets
 */
export async function exportMultiSheetExcel(
  sheets: Array<{ name: string; data: Record<string, any>[] }>,
  filename: string
): Promise<void> {
  const wb = await book_new();
  
  for (const sheet of sheets) {
    const ws = await json_to_sheet(sheet.data);
    await book_append_sheet(wb, ws, sheet.name);
  }
  
  await write_file(wb, filename);
}

// ============================================
// Backward compatibility wrapper
// ============================================

/**
 * Create a compatibility layer that mimics xlsx API
 * Use this for easier migration of existing code
 */
export async function createXLSXCompat(): Promise<any> {
  const XLSX = await loadXLSX();
  
  return {
    utils: {
      book_new: () => XLSX.utils.book_new(),
      book_append_sheet: (wb: any, ws: any, name: string) => XLSX.utils.book_append_sheet(wb, ws, name),
      json_to_sheet: (data: any[]) => XLSX.utils.json_to_sheet(data),
      aoa_to_sheet: (data: any[][]) => XLSX.utils.aoa_to_sheet(data),
    },
    write: (wb: any, opts: any) => XLSX.write(wb, opts),
    writeFile: async (wb: any, filename: string) => {
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob(
        [excelBuffer],
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
  };
}

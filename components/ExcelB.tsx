import React, { useState, useRef, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

type ExcelBProps = {
  excelAProducts: any;
  onBranchCode?: (branch: string | null) => void;
  existingBranchCode?: string | null;
  clearTrigger?: number;
  onData?: (data: { headers: string[], rows: any[][] }) => void;
  currentUser?: any;
  hasProductData?: boolean;
};

const ExcelB: React.FC<ExcelBProps> = ({ excelAProducts, onBranchCode, existingBranchCode, clearTrigger, onData, currentUser, hasProductData = true }) => {
  const { toast } = useToast();
  const [excelBHeaders, setExcelBHeaders] = useState<string[]>([]);
  const [excelBRows, setExcelBRows] = useState<any[][]>([]);
  const [branchCode, setBranchCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    setExcelBHeaders([]);
    setExcelBRows([]);
    setError(null);
    setBranchCode(null);
    setFileName(null);
    if (onBranchCode) onBranchCode(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    if (clearTrigger && clearTrigger > 0) {
      handleClear();
    }
  }, [clearTrigger]);

  const handleFileUpload = async (file: File | null) => {
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const allRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      if (allRows.length === 0) throw new Error('The file is empty or could not be read.');

      // Find the header row (look for 'barcode' column)
      const headerRowIndex = allRows.findIndex(row =>
        row.some(cell => typeof cell === 'string' && cell.trim().toLowerCase() === 'barcode')
      );
      if (headerRowIndex === -1) {
        setError('Barcode column not detected.');
        setExcelBHeaders([]);
        setExcelBRows([]);
        setBranchCode(null);
        return;
      }
      const realHeaders = allRows[headerRowIndex].map(h => String(h ?? '').trim());

      // Detect branch code from the row after the header
      const branchRow = allRows[headerRowIndex + 1] ?? [];
      const detectedBranch = branchRow.find(cell => typeof cell === 'string' && cell.trim());

      const branch = detectedBranch ? String(detectedBranch).trim() : null;
      console.log('ExcelB: detected branch:', branch, 'existingBranchCode:', existingBranchCode);
      // If existingBranchCode is set and does not match, block upload
      if (existingBranchCode && branch && branch !== existingBranchCode) {
        const msg = `Branch mismatch: File 2 (${branch}) does not match File 3 (${existingBranchCode})`;
        setExcelBHeaders([]);
        setExcelBRows([]);
        setBranchCode(null);
        setError(msg);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (onBranchCode) onBranchCode(null);
        toast({
          variant: "destructive",
          title: "Branch mismatch",
          description: msg,
        });
        return;
      }
      // Check if branch matches user's assigned branch
      const userStoreInfo = currentUser?.storeId && currentUser?.branch ? `${currentUser.storeId} ${currentUser.branch}` : null;
      if (userStoreInfo && branch && branch !== userStoreInfo) {
        const msg = `You are not assigned to this branch. Your assigned branch is ${userStoreInfo}, but the file is for ${branch}.`;
        setExcelBHeaders([]);
        setExcelBRows([]);
        setBranchCode(null);
        setError(msg);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (onBranchCode) onBranchCode(null);
        toast({
          variant: "destructive",
          title: "Branch assignment error",
          description: msg,
        });
        return;
      }
      setBranchCode(branch);
      if (onBranchCode) onBranchCode(branch);

      // Only keep rows after the header that look like data rows (first cell is a number or numeric string)
      const cleanedRows = allRows
        .slice(headerRowIndex + 1)
        .filter(row => {
          const firstCell = row[0];
          return (
            typeof firstCell === 'number' ||
            (typeof firstCell === 'string' && /^\d+$/.test(firstCell.trim()))
          );
        })
        .map(row => {
          const padded = [...row];
          while (padded.length < realHeaders.length) padded.push('');
          return padded;
        });

      // Merge sale_status from ExcelA by barcode
      const barcodeIdxB = realHeaders.findIndex(h => h.trim().toLowerCase() === 'barcode');
      let saleStatusIdxA = -1;
      let barcodeIdxA = -1;
      if (Array.isArray(excelAProducts) && excelAProducts.length > 0) {
        const excelAHeaders = Object.keys(excelAProducts[0]);
        barcodeIdxA = excelAHeaders.findIndex(h => h.trim().toLowerCase() === 'barcode');
        saleStatusIdxA = excelAHeaders.findIndex(h => h.trim().toLowerCase() === 'sale_status');
      }

      // Build a lookup for barcode -> sale_status from ExcelA
      const barcodeToSaleStatus: Record<string, string> = {};
      if (barcodeIdxA !== -1 && saleStatusIdxA !== -1) {
        for (const prod of excelAProducts) {
          const barcode = String(prod[Object.keys(prod)[barcodeIdxA]] ?? '').trim().toLowerCase();
          const saleStatus = String(prod[Object.keys(prod)[saleStatusIdxA]] ?? '');
          if (barcode) barcodeToSaleStatus[barcode] = saleStatus;
        }
      }

      // Add sale_status to each row in ExcelB
      const mergedHeaders = [...realHeaders, 'sale_status'];
      const mergedRows = cleanedRows.map(row => {
        let saleStatus = '';
        if (barcodeIdxB !== -1) {
          const barcode = String(row[barcodeIdxB] ?? '').trim().toLowerCase();
          saleStatus = barcodeToSaleStatus[barcode] ?? 'Not Found';
        }
        return [...row, saleStatus];
      });

      setExcelBHeaders(mergedHeaders);
      setExcelBRows(mergedRows);
      setFileName(file.name);
      setError(null);
      if (onData) onData({ headers: mergedHeaders, rows: mergedRows });
      
      // Reset file input to allow re-uploading the same file
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError('Failed to parse file.');
      setBranchCode(null);
      if (onBranchCode) onBranchCode(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileUpload(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-7xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-2 text-left">
        Upload Item Sales Report{branchCode ? ` - ${branchCode}` : ''} <span className="text-red-500">*</span>
      </h2>
      <p className="text-gray-600 mb-6 text-left">Upload your ExcelB file (.xlsx, .xls, .csv) to compare sales with product data.</p>
      {fileName && (
        <div className="mb-4 text-left">
          File Uploaded:{" "}
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-sm ${
            excelBRows.some(row => row[excelBHeaders.length - 1] === 'Not Found')
              ? 'bg-red-100 text-red-800'
              : 'bg-green-100 text-green-800'
          }`}>
            📄 {fileName}
            <button
              onClick={handleClear}
              className="ml-2 hover:bg-red-200 rounded-full p-1 transition-colors"
              title="Clear uploaded file"
            >
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        </div>
      )}
      <div
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 mb-4 transition ${
          hasProductData
            ? 'border-blue-400 bg-blue-50 hover:bg-blue-100 cursor-pointer'
            : 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-50'
        }`}
        onClick={hasProductData ? () => fileInputRef.current?.click() : undefined}
        onDrop={hasProductData ? handleDrop : undefined}
        onDragOver={hasProductData ? handleDragOver : undefined}
        style={{ minHeight: '120px' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />
        <span className={`font-semibold text-lg mb-2 ${hasProductData ? 'text-blue-700' : 'text-gray-500'}`}>
          {hasProductData ? 'Drag & drop your file here' : 'Product data required to upload files'}
        </span>
        <span className={`text-sm ${hasProductData ? 'text-gray-500' : 'text-gray-400'}`}>
          {hasProductData ? 'or click to select a file' : 'Please wait for admin to upload product data'}
        </span>
      </div>
      {error && <div className="text-red-600 font-medium mb-4 text-center">{error}</div>}
      {excelBRows.length > 0 && (
        <div className="overflow-x-auto mt-6 border rounded-lg bg-gray-50 max-h-[32rem]" style={{maxHeight:'32rem', minWidth:'100%'}}>
          <table className="min-w-[72rem] w-full text-sm text-left">
            <thead>
              <tr>
                {excelBHeaders.map((header, idx) => (
                  <th key={idx} className="px-4 py-2 border-b font-bold bg-gray-100 text-base">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {excelBRows.map((row, idx) => (
                <tr key={idx}>
                  {excelBHeaders.map((_, colIdx) => (
                    <td key={colIdx} className="px-4 py-2 border-b text-base">{row[colIdx] ?? '-'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExcelB;

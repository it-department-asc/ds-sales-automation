import React, { useState, useRef, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

type ExcelBProps = {
  excelAProducts: any;
  onBranchCode?: (branch: string | null) => void;
  existingBranchCode?: string | null;
  clearTrigger?: number;
};

const ExcelB: React.FC<ExcelBProps> = ({ excelAProducts, onBranchCode, existingBranchCode, clearTrigger }) => {
  const { toast } = useToast();
  const [excelBHeaders, setExcelBHeaders] = useState<string[]>([]);
  const [excelBRows, setExcelBRows] = useState<any[][]>([]);
  const [branchCode, setBranchCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    setExcelBHeaders([]);
    setExcelBRows([]);
    setError(null);
    setBranchCode(null);
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
          saleStatus = barcodeToSaleStatus[barcode] ?? '';
        }
        return [...row, saleStatus];
      });

      setExcelBHeaders(mergedHeaders);
      setExcelBRows(mergedRows);
      setError(null);
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
      <h2 className="text-2xl font-bold mb-2 text-center">
        Upload Item Sales Report{branchCode ? ` - ${branchCode}` : ''}
      </h2>
      <p className="text-gray-600 mb-6 text-center">Upload your ExcelB file (.xlsx, .xls, .csv) to compare sales with product data.</p>
      <div
        className="flex flex-col items-center justify-center border-2 border-dashed border-blue-400 rounded-lg p-6 mb-4 cursor-pointer bg-blue-50 hover:bg-blue-100 transition"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{ minHeight: '120px' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />
        <span className="text-blue-700 font-semibold text-lg mb-2">Drag & drop your file here</span>
        <span className="text-gray-500 text-sm">or click to select a file</span>
      </div>
      <div className="flex justify-center mb-4">
        <button
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded shadow disabled:opacity-50"
          onClick={handleClear}
          disabled={excelBRows.length === 0 && !error}
        >
          Clear Uploaded File
        </button>
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

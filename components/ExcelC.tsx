

"use client";

import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

type ExcelCProps = {
  onBranchCode?: (branch: string | null) => void;
  existingBranchCode?: string | null;
  clearTrigger?: number;
  onData?: (data: { headers: string[], rows: any[][] }) => void;
  currentUser?: any;
  hasProductData?: boolean;
};

const ExcelC: React.FC<ExcelCProps> = ({ onBranchCode, existingBranchCode, clearTrigger, onData, currentUser, hasProductData = true }) => {
  const { toast } = useToast();
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[][]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [branchCode, setBranchCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    setHeaders([]);
    setRows([]);
    setFileName(null);
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

      // Find the header row: look for 'terminal' or 'site' in first cell
      let headerRowIndex = allRows.findIndex(row =>
        row.some(cell => typeof cell === 'string' && cell.trim().toLowerCase() === 'terminal')
      );
      if (headerRowIndex === -1) {
        headerRowIndex = allRows.findIndex(row =>
          typeof row[0] === 'string' && row[0].trim().toLowerCase() === 'site'
        );
      }
      if (headerRowIndex === -1) {
        setError('Header row not found in file.');
        setHeaders([]);
        setRows([]);
        setBranchCode(null);
        return;
      }
      const realHeaders = allRows[headerRowIndex].map(h => String(h ?? '').trim());
      const isNewFormat = typeof allRows[headerRowIndex]?.[0] === 'string' && allRows[headerRowIndex][0].trim().toLowerCase() === 'site';

      // Detect branch code
      let detectedBranch: string | null = null;
      // New format: 'site' header, branch code in next row
      if (isNewFormat) {
        const nextRow = allRows[headerRowIndex + 1];
        if (nextRow && typeof nextRow[0] === 'string') {
          detectedBranch = nextRow[0].trim();
        }
      }
      // Old format: look for 'Site: XXXX' row
      if (!detectedBranch) {
        const siteRow = allRows.find(row =>
          typeof row[0] === 'string' && row[0].toLowerCase().startsWith('site:')
        );
        if (siteRow) {
          detectedBranch = String(siteRow[0]).replace(/site:/i, '').trim();
        }
      }

      const branch = detectedBranch || null;
      console.log('ExcelC: detected branch:', branch, 'existingBranchCode:', existingBranchCode);
      // Check if branch matches user's assigned branch
      const userStoreInfo = currentUser?.storeId && currentUser?.branch ? `${currentUser.storeId} ${currentUser.branch}` : null;
      if (userStoreInfo && branch && branch !== userStoreInfo) {
        const msg = `You are not assigned to this branch. Your assigned branch is ${userStoreInfo}, but the file is for ${branch}.`;
        setHeaders([]);
        setRows([]);
        setFileName(null);
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
      // If existingBranchCode is set and does not match, block upload
      if (existingBranchCode && branch && branch !== existingBranchCode) {
        const msg = `Branch mismatch: File 3 (${branch}) does not match File 2 (${existingBranchCode})`;
        setHeaders([]);
        setRows([]);
        setFileName(null);
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

      // Clean data rows: skip summary/branch rows
      const cleanedRows = allRows
        .slice(headerRowIndex + 1)
        .filter(row => {
          const firstCell = String(row[0] ?? '').toLowerCase();
          if (!firstCell) return false;
          if (!isNewFormat) {
            if (firstCell.startsWith('site:')) return false;
            if (firstCell.startsWith('terminal total')) return false;
          }
          if (firstCell.startsWith('grand total')) return false;
          return true;
        })
        .map(row => {
          const padded = [...row];
          while (padded.length < realHeaders.length) padded.push('');
          return padded;
        });

      setHeaders(realHeaders);
      setRows(cleanedRows);
      setFileName(file.name);
      setError(null);
      if (onData) onData({ headers: realHeaders, rows: cleanedRows });
      
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
        Upload Post Collection Report {branchCode ? ` - ${branchCode}` : ''} <span className="text-red-500">*</span>
      </h2>
      <p className="text-gray-600 mb-6 text-left">Upload your ExcelC file (.xlsx, .xls, .csv) to compare sales with product data.</p>
      {fileName && (
        <div className="mb-4 text-left">
          File Uploaded:{" "}
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-sm bg-green-100 text-green-800">
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
      {headers.length > 0 && rows.length > 0 && (
        <div className="overflow-x-auto mt-6 border rounded-lg bg-gray-50 max-h-[32rem]" style={{maxHeight:'32rem', minWidth:'100%'}}>
          <table className="min-w-[72rem] w-full text-sm text-left">
            <thead>
              <tr>
                {headers.map((header, idx) => (
                  <th key={idx} className="px-4 py-2 border-b font-bold bg-gray-100 text-base">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  {headers.map((_, colIdx) => (
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

export default ExcelC;



"use client";

import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

type ExcelCProps = {
  onBranchCode?: (branch: string | null) => void;
  existingBranchCode?: string | null;
  clearTrigger?: number;
  onData?: (data: { headers: string[], rows: any[][], period?: string }) => void;
  currentUser?: any;
  hasProductData?: boolean;
  existingPeriod?: string | null;
};

const ExcelC: React.FC<ExcelCProps> = ({ onBranchCode, existingBranchCode, clearTrigger, onData, currentUser, hasProductData = true, existingPeriod }) => {
  const { toast } = useToast();
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[][]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [branchCode, setBranchCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsePeriod = (period: string): Date | null => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const monthMap: { [key: string]: number } = {};
    monthNames.forEach((month, index) => {
      monthMap[month] = index;
    });
    const match = period.match(/^(\w+)\s+(\d+),\s+(\d{4})$/);
    if (match) {
      const [, monthName, day, year] = match;
      const month = monthMap[monthName];
      if (month !== undefined) {
        return new Date(parseInt(year), month, parseInt(day));
      }
    }
    return null;
  };

  const handleClear = () => {
    setHeaders([]);
    setRows([]);
    setFileName(null);
    setError(null);
    setBranchCode(null);
    setPeriod(null);
    if (onBranchCode) onBranchCode(null);
    if (onData) onData({ headers: [], rows: [], period: undefined });
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

      // Extract period from the file
      let extractedPeriod: string | null = null;

      // First pass: look for YYYY-MM-DD format anywhere in the file
      for (const row of allRows) {
        const rowText = row.map(cell => String(cell ?? '').trim()).join(' ');
        const dateMatch = rowText.match(/^(\d{4}-\d{2}-\d{2})$/) || rowText.match(/^\s*(\d{4}-\d{2}-\d{2})\s*$/);
        if (dateMatch) {
          const dateStr = dateMatch[1];
          // Format the date as "Month DD, YYYY"
          const date = new Date(dateStr + 'T00:00:00');
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
          extractedPeriod = `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
          break;
        }
      }

      // Second pass: if no YYYY-MM-DD found, look for descriptive text
      if (!extractedPeriod) {
        for (const row of allRows) {
          const rowText = row.map(cell => String(cell ?? '').trim()).join(' ');
          const periodMatch = rowText.match(/From (.+?) 12:00 AM to (.+?) 11:59 PM/);
          if (periodMatch) {
            extractedPeriod = periodMatch[1].trim();
            break;
          }
        }
      }
      // Normalize the extracted period to pad the day
      if (extractedPeriod) {
        const match = extractedPeriod.match(/^(\w+)\s+(\d+),\s+(\d{4})$/);
        if (match) {
          const [, monthName, day, year] = match;
          const paddedDay = day.padStart(2, '0');
          extractedPeriod = `${monthName} ${paddedDay}, ${year}`;
        }
      }
      setPeriod(extractedPeriod);

      // Check if period is today's date or in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

      let periodDate: Date | null = null;
      if (extractedPeriod) {
        // Parse the extracted period back to a date
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];
        const monthMap: { [key: string]: number } = {};
        monthNames.forEach((month, index) => {
          monthMap[month] = index;
        });

        const periodMatch = extractedPeriod.match(/^(\w+)\s+(\d+),\s+(\d{4})$/);
        if (periodMatch) {
          const [, monthName, day, year] = periodMatch;
          const month = monthMap[monthName];
          if (month !== undefined) {
            periodDate = new Date(parseInt(year), month, parseInt(day));
            periodDate.setHours(0, 0, 0, 0); // Reset time to start of day
          }
        }
      }

      if (periodDate && periodDate >= today) {
        const dateType = periodDate.getTime() === today.getTime() ? 'today' : 'future';
        handleClear();
        setError(`Cannot upload files for ${dateType} dates. Please upload files for previous dates only.`);
        setHeaders([]);
        setRows([]);
        setBranchCode(null);
        setPeriod(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        toast({
          variant: "destructive",
          title: "Invalid Date",
          description: `Cannot upload files for ${dateType} dates. Please upload files for previous dates only.`,
        });
        return;
      }

      // Check if period matches existing period from other file
      const existingDate = existingPeriod ? parsePeriod(existingPeriod) : null;
      const extractedDate = extractedPeriod ? parsePeriod(extractedPeriod) : null;
      if (existingDate && extractedDate && existingDate.getTime() !== extractedDate.getTime()) {
        handleClear();
        setError(`Period mismatch: This file is for "${extractedPeriod}" but the other file is for "${existingPeriod}". Please ensure both files are for the same date period.`);
        setHeaders([]);
        setRows([]);
        setBranchCode(null);
        setPeriod(null); // Clear period on mismatch
        if (fileInputRef.current) fileInputRef.current.value = '';
        toast({
          variant: "destructive",
          title: "Period Mismatch",
          description: `Post Collection Report period "${extractedPeriod}" does not match Item Sales Report period "${existingPeriod}". Please upload files for the same date.`,
        });
        return;
      }
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
        setPeriod(null); // Clear period on error
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
      // Check if branch matches user's assigned branch
      const userStoreInfo = currentUser?.storeId && currentUser?.branch ? `${currentUser.storeId} ${currentUser.branch}` : null;
      if (userStoreInfo && branch && branch !== userStoreInfo) {
        const msg = `You are not assigned to this branch. Your assigned branch is ${userStoreInfo}, but the file is for ${branch}.`;
        setHeaders([]);
        setRows([]);
        setFileName(null);
        setBranchCode(null);
        setPeriod(null); // Clear period on mismatch
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
        setPeriod(null); // Clear period on mismatch
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
      if (onData) onData({ headers: realHeaders, rows: cleanedRows, period: extractedPeriod || undefined });

      // Reset file input to allow re-uploading the same file
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError('Failed to parse file.');
      setBranchCode(null);
      setPeriod(null); // Clear period on error
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
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-8xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-2 text-left">
        Upload Post Collection Report {branchCode ? ` - ${branchCode}` : ''}{rows.length > 0 && period ? ` (${period})` : ''} <span className="text-red-500">*</span>
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
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 mb-4 transition ${hasProductData
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
        <div className="mt-6">
          {/* Mobile scroll indicator */}
          <div className="block sm:hidden mb-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700 text-center">
              ← Swipe to scroll horizontally →
            </p>
          </div>
          <div className="overflow-x-auto border rounded-lg bg-gray-50 max-h-[32rem]" style={{ maxHeight: '32rem' }}>
            <table className="min-w-[72rem] w-full text-xs sm:text-sm text-left">
              <thead>
                <tr>
                  {headers.map((header, idx) => (
                    <th key={idx} className="px-2 sm:px-4 py-2 border-b font-bold bg-gray-100 text-xs sm:text-base sticky top-0 z-10">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {headers.map((_, colIdx) => (
                      <td key={colIdx} className="px-2 sm:px-4 py-2 border-b text-xs sm:text-base break-words max-w-[120px] sm:max-w-none">{row[colIdx] ?? '-'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelC;

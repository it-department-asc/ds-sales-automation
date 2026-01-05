import React, { useState, useEffect } from 'react';
import ExcelB from './ExcelB';
import ExcelC from './ExcelC';
import { Average } from 'next/font/google';

type ExcelBranchCompareProps = {
  excelAProducts: any;
  onExcelBData?: (data: { headers: string[], rows: any[][], period?: string }) => void;
  onExcelCData?: (data: { headers: string[], rows: any[][], period?: string }) => void;
  onBranchCode?: (branch: string | null) => void;
  onClear?: () => void;
  clearTrigger?: number;
  currentUser?: any;
};

const ExcelBranchCompare: React.FC<ExcelBranchCompareProps> = ({
  excelAProducts,
  onExcelBData,
  onExcelCData,
  onBranchCode,
  onClear,
  clearTrigger: externalClearTrigger,
  currentUser,
}) => {
  const [branchCode, setBranchCode] = useState<string | null>(null);
  const [clearTrigger, setClearTrigger] = useState<number>(0);
  const [excelBPeriod, setExcelBPeriod] = useState<string | null>(null);
  const [excelCPeriod, setExcelCPeriod] = useState<string | null>(null);

  const handleBranchCode = (branch: string | null) => {
    setBranchCode(branch);
    if (onBranchCode) onBranchCode(branch);
  };

  const handleExcelBData = (data: { headers: string[], rows: any[][], period?: string }) => {
    setExcelBPeriod(data.period || null);
    if (onExcelBData) onExcelBData(data);
  };

  const handleExcelCData = (data: { headers: string[], rows: any[][], period?: string }) => {
    setExcelCPeriod(data.period || null);
    if (onExcelCData) onExcelCData(data);
  };

  const handleClear = () => {
    setBranchCode(null);
    setExcelBPeriod(null);
    setExcelCPeriod(null);
    setClearTrigger(prev => prev + 1);
    if (onBranchCode) onBranchCode(null);
    if (onClear) onClear();
  };

  useEffect(() => {
    if (externalClearTrigger && externalClearTrigger > 0) {
      handleClear();
    }
  }, [externalClearTrigger]);

  const hasProductData = Array.isArray(excelAProducts) && excelAProducts.length > 0;

  return (
    <div>
      <ExcelB
        excelAProducts={excelAProducts}
        onBranchCode={handleBranchCode}
        existingBranchCode={branchCode}
        clearTrigger={clearTrigger}
        onData={handleExcelBData}
        currentUser={currentUser}
        hasProductData={hasProductData}
        existingPeriod={excelCPeriod}
        hiddenColumns={['Landed Cost', 'Unit Cost', 'Total Cost', 'Average Cost', 'Average Price', 'Gross Price']}
      />
      <ExcelC
        onBranchCode={handleBranchCode}
        existingBranchCode={branchCode}
        clearTrigger={clearTrigger}
        onData={handleExcelCData}
        currentUser={currentUser}
        hasProductData={hasProductData}
        existingPeriod={excelBPeriod}
      />
      {branchCode && (
        <div className="mt-4 text-center">
          <button
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded shadow"
            onClick={handleClear}
          >
            Clear All Uploaded Files
          </button>
        </div>
      )}
    </div>
  );
};

export { ExcelBranchCompare };

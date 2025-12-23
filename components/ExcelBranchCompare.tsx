import React, { useState } from 'react';
import ExcelB from './ExcelB';
import ExcelC from './ExcelC';

type ExcelBranchCompareProps = {
  excelAProducts: any;
  onExcelBData?: (data: { headers: string[], rows: any[][] }) => void;
  onExcelCData?: (data: { headers: string[], rows: any[][] }) => void;
  onBranchCode?: (branch: string | null) => void;
  currentUser?: any;
};

const ExcelBranchCompare: React.FC<ExcelBranchCompareProps> = ({
  excelAProducts,
  onExcelBData,
  onExcelCData,
  onBranchCode,
  currentUser,
}) => {
  const [branchCode, setBranchCode] = useState<string | null>(null);
  const [clearTrigger, setClearTrigger] = useState<number>(0);

  const handleBranchCode = (branch: string | null) => {
    setBranchCode(branch);
    if (onBranchCode) onBranchCode(branch);
  };

  const handleClear = () => {
    setBranchCode(null);
    setClearTrigger(prev => prev + 1);
    if (onBranchCode) onBranchCode(null);
  };

  return (
    <div>
      <ExcelB
        excelAProducts={excelAProducts}
        onBranchCode={handleBranchCode}
        existingBranchCode={branchCode}
        clearTrigger={clearTrigger}
        onData={onExcelBData}
        currentUser={currentUser}
      />
      <ExcelC
        onBranchCode={handleBranchCode}
        existingBranchCode={branchCode}
        clearTrigger={clearTrigger}
        onData={onExcelCData}
        currentUser={currentUser}
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

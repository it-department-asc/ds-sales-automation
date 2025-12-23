"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import ExcelB from "./ExcelB";
import ExcelC from "./ExcelC";

/**
 * Component to compare branchCode between ExcelB and ExcelC uploads.
 * Shows a toast error if branchCodes do not match, regardless of upload order.
 */
export function ExcelBranchCompare({ excelAProducts }: { excelAProducts: any[] }) {
  const { toast } = useToast();
  const [excelB, setExcelB] = useState<{
    branchCode: string | null;
    data: any;
    fileName: string | null;
  }>({ branchCode: null, data: null, fileName: null });
  const [excelC, setExcelC] = useState<{
    branchCode: string | null;
    data: any;
    fileName: string | null;
  }>({ branchCode: null, data: null, fileName: null });
  const [clearTriggerB, setClearTriggerB] = useState(0);
  const [clearTriggerC, setClearTriggerC] = useState(0);


  // Handler to receive branchCode from ExcelB
  const handleExcelBBranch = useCallback((branch: string | null) => {
    console.log('ExcelBranchCompare: ExcelB branch:', branch, 'ExcelC branch:', excelC.branchCode);
    if (excelC.branchCode && branch && branch !== excelC.branchCode) {
      const msg = `Branch mismatch: ExcelB (${branch}) does not match ExcelC (${excelC.branchCode})`;
      toast({
        variant: "destructive",
        title: "Branch mismatch",
        description: msg,
      });
      setClearTriggerB(prev => prev + 1);
      return;
    }
    setExcelB(prev => ({ ...prev, branchCode: branch }));
  }, [excelC.branchCode, toast]);

  // Handler to receive branchCode from ExcelC
  const handleExcelCBranch = useCallback((branch: string | null) => {
    console.log('ExcelBranchCompare: ExcelC branch:', branch, 'ExcelB branch:', excelB.branchCode);
    if (excelB.branchCode && branch && branch !== excelB.branchCode) {
      const msg = `Branch mismatch: ExcelC (${branch}) does not match ExcelB (${excelB.branchCode})`;
      toast({
        variant: "destructive",
        title: "Branch mismatch",
        description: msg,
      });
      setClearTriggerC(prev => prev + 1);
      return;
    }
    setExcelC(prev => ({ ...prev, branchCode: branch }));
  }, [excelB.branchCode, toast]);

  return (
    <div className="space-y-8">
      <ExcelB
        excelAProducts={excelAProducts}
        onBranchCode={handleExcelBBranch}
        existingBranchCode={excelC.branchCode}
        clearTrigger={clearTriggerB}
      />
      <ExcelC
        onBranchCode={handleExcelCBranch}
        existingBranchCode={excelB.branchCode}
        clearTrigger={clearTriggerC}
      />
    </div>
  );
}

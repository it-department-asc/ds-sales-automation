"use client";

import { ResponsiveDialog } from "@/app/components/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, Download } from "lucide-react";

interface ValidationErrorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unmatchedItems: Array<{
    barcode?: string;
    itemName?: string;
    stockNo?: string;
    rowIndex: number;
  }>;
}

export const ValidationErrorModal = ({
  open,
  onOpenChange,
  unmatchedItems
}: ValidationErrorModalProps) => {
  const downloadUnmatchedReport = () => {
    if (unmatchedItems.length === 0) return;

    // Create CSV content
    const headers = ['Row Number', 'Stock No', 'Barcode', 'Item Name', 'Status'];
    const csvContent = [
      headers.join(','),
      ...unmatchedItems.map(item => [
        (item.rowIndex + 1).toString(),
        item.stockNo || '',
        item.barcode || '',
        item.itemName || '',
        'Not Found'
      ].map(field => `"${field.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `unmatched-items-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  return (
    <ResponsiveDialog
      title="Validation Error - Unmatched Items"
      description="Some items in your sales report could not be matched with the product data. Please review and correct the barcodes."
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-medium text-destructive">Action Required</p>
            <p className="text-sm text-muted-foreground">
              {unmatchedItems.length} item{unmatchedItems.length !== 1 ? 's' : ''} could not be found in the product database.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Unmatched Items:</h4>
          <div className="max-h-60 overflow-y-auto border rounded-lg">
            <div className="divide-y">
              {unmatchedItems.map((item, index) => (
                <div key={index} className="p-3 bg-muted/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {item.stockNo ? `Stock No: ${item.stockNo}` : `Row ${item.rowIndex + 1}`}
                      </p>
                      {item.barcode && (
                        <p className="text-sm text-muted-foreground">
                          Barcode: {item.barcode}
                        </p>
                      )}
                      {item.itemName && (
                        <p className="text-sm text-muted-foreground">
                          Item: {item.itemName}
                        </p>
                      )}
                    </div>
                    <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">
                      Not Found
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">How to Fix:</h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Check that barcodes are entered correctly</li>
            <li>• Ensure the admin has uploaded the latest product file</li>
            <li>• Contact your administrator if you believe the product should exist</li>
          </ul>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={downloadUnmatchedReport}
            disabled={unmatchedItems.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
};
import * as XLSX from 'xlsx';
import { Button } from "../../../components/ui/button";
import { Download } from "lucide-react";

interface SalesSummary {
    _id: string;
    userId: string;
    storeId?: string;
    branch?: string;
    region?: string;
    province?: string;
    city?: string;
    lessor?: string;
    mallName?: string;
    cashCheck?: string | number;
    charge?: string | number;
    gc?: string | number;
    creditNote?: string | number;
    totalPayments?: string | number;
    regularQty: number;
    regularAmt: number | string;
    nonRegularQty: number;
    nonRegularAmt: number | string;
    totalQtySold: number;
    totalAmt: number | string;
    transactionCount?: number;
    headCount?: number;
    period?: string;
    branchCode?: string;
    amountsMatch?: boolean;
    createdAt: number;
}

interface ExcelExportProps {
    data: SalesSummary[] | undefined;
    disabled?: boolean;
}

export function ExcelExport({ data, disabled }: ExcelExportProps) {
    const handleExport = () => {
        if (!data || data.length === 0) {
            alert('No sales summary data available to generate report.');
            return;
        }

        // Group data by period
        const groupedByPeriod = data.reduce((acc, summary) => {
            const period = summary.period || 'No Period';
            if (!acc[period]) {
                acc[period] = [];
            }
            acc[period].push(summary);
            return acc;
        }, {} as Record<string, SalesSummary[]>);

        // Create workbook
        const wb = XLSX.utils.book_new();

        // Process each period
        Object.entries(groupedByPeriod).forEach(([period, summaries]) => {
            // Prepare data in the specified column order
            const reportData = summaries.map(summary => ({
                'Store ID': summary.storeId || '',
                'Branch': summary.branch || '',
                'Region': summary.region || '',
                'Province': summary.province || '',
                'City': summary.city || '',
                'Lessor': summary.lessor || '',
                'Mall Name': summary.mallName || '',
                'Cash/Check': summary.cashCheck || '',
                'Charge': summary.charge || '',
                'GC': summary.gc || '',
                'Credit Note': summary.creditNote || '',
                'Total Payments': summary.totalPayments || '',
                'Regular Qty': summary.regularQty,
                'Regular Amt': summary.regularAmt,
                'Non-Regular Qty': summary.nonRegularQty,
                'Non-Regular Amt': summary.nonRegularAmt,
                'Total Qty Sold': summary.totalQtySold,
                'Total Amt': summary.totalAmt,
                'Transaction Count': summary.transactionCount || '',
                'Head Count': summary.headCount || '',
            }));

            // Calculate total sums for the period
            const totalSums = summaries.reduce((acc, summary) => {
                const cleanNumber = (value: any) => parseFloat((value?.toString() || '0').replace(/,/g, '')) || 0;
                acc.cashCheck += cleanNumber(summary.cashCheck);
                acc.charge += cleanNumber(summary.charge);
                acc.gc += cleanNumber(summary.gc);
                acc.creditNote += cleanNumber(summary.creditNote);
                acc.totalPayments += cleanNumber(summary.totalPayments);
                acc.regularQty += summary.regularQty || 0;
                acc.regularAmt += cleanNumber(summary.regularAmt);
                acc.nonRegularQty += summary.nonRegularQty || 0;
                acc.nonRegularAmt += cleanNumber(summary.nonRegularAmt);
                acc.totalQtySold += summary.totalQtySold || 0;
                acc.totalAmt += cleanNumber(summary.totalAmt);
                acc.transactionCount += summary.transactionCount || 0;
                acc.headCount += summary.headCount || 0;
                return acc;
            }, {
                cashCheck: 0,
                charge: 0,
                gc: 0,
                creditNote: 0,
                totalPayments: 0,
                regularQty: 0,
                regularAmt: 0,
                nonRegularQty: 0,
                nonRegularAmt: 0,
                totalQtySold: 0,
                totalAmt: 0,
                transactionCount: 0,
                headCount: 0,
            });

            // Create subtotal row
            const formatNumber = (num: number) => num.toLocaleString('en-US');
            const subtotalRow = {
                'Store ID': '',
                'Branch': 'SUBTOTAL -  ALBERTO STAND ALONE',
                'Cash/Check': formatNumber(totalSums.cashCheck),
                'Charge': formatNumber(totalSums.charge),
                'GC': formatNumber(totalSums.gc),
                'Credit Note': formatNumber(totalSums.creditNote),
                'Total Payments': formatNumber(totalSums.totalPayments),
                'Regular Qty': formatNumber(totalSums.regularQty),
                'Regular Amt': formatNumber(totalSums.regularAmt),
                'Non-Regular Qty': formatNumber(totalSums.nonRegularQty),
                'Non-Regular Amt': formatNumber(totalSums.nonRegularAmt),
                'Total Qty Sold': formatNumber(totalSums.totalQtySold),
                'Total Amt': formatNumber(totalSums.totalAmt),
                'Transaction Count': formatNumber(totalSums.transactionCount),
                'Head Count': formatNumber(totalSums.headCount),
            };

            // Add subtotal row to report data
            const fullReportData = [...reportData, subtotalRow];

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(fullReportData);

            // Auto-size columns
            const colWidths = [
                { wch: 12 }, // Store ID
                { wch: 15 }, // Branch
                { wch: 12 }, // Region
                { wch: 15 }, // Province
                { wch: 15 }, // City
                { wch: 15 }, // Lessor
                { wch: 20 }, // Mall Name
                { wch: 12 }, // Cash/Check
                { wch: 10 }, // Charge
                { wch: 8 },  // GC
                { wch: 12 }, // Credit Note
                { wch: 15 }, // Total Payments
                { wch: 12 }, // Regular Qty
                { wch: 12 }, // Regular Amt
                { wch: 15 }, // Non-Regular Qty
                { wch: 15 }, // Non-Regular Amt
                { wch: 15 }, // Total Qty Sold
                { wch: 12 }, // Total Amt
                { wch: 18 }, // Transaction Count
                { wch: 12 }, // Head Count
            ];
            ws['!cols'] = colWidths;

            // Generate sheet name from period
            let sheetName = 'No_Period';
            if (period !== 'No Period') {
                try {
                    // Parse the period date and extract day
                    const periodDate = new Date(period);
                    if (!isNaN(periodDate.getTime())) {
                        const day = periodDate.getDate().toString().padStart(2, '0');
                        sheetName = day;
                    } else {
                        // If parsing fails, use a sanitized version of the period string
                        sheetName = period.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 31);
                    }
                } catch (error) {
                    // Fallback to sanitized period string
                    sheetName = period.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 31);
                }
            }

            // Ensure sheet name is unique and valid
            let uniqueSheetName = sheetName;
            let counter = 1;
            while (wb.SheetNames.includes(uniqueSheetName)) {
                uniqueSheetName = `${sheetName.substring(0, 28)}_${counter}`;
                counter++;
            }

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, uniqueSheetName);
        });

        // Generate filename with current date
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
        const filename = `sales_report_${dateStr}.xlsx`;

        // Save file
        XLSX.writeFile(wb, filename);
    };

    return (
        <Button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
        >
            <Download className="h-4 w-4 mr-2" />
            Export Excel
        </Button>
    );
}
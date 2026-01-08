import * as XLSX from 'xlsx';
import { Button } from "../../../components/ui/button";
import { Download } from "lucide-react";
import { UserSalesSummary } from "@/lib/firestore/types";

interface ExcelExportProps {
    data: UserSalesSummary[] | undefined;
    disabled?: boolean;
    selectedPeriod?: string;
    selectedPeriodDate?: Date | null;
}

export function ExcelExport({ data, disabled, selectedPeriod, selectedPeriodDate }: ExcelExportProps) {
    // Compare periods by local year/month/day to avoid timezone parsing issues.
    const parseToLocalYMD = (period?: string): { y: number; m: number; d: number } | null => {
        if (!period) return null;
        // If period is YYYY-MM-DD, parse parts directly to local date
        const isoMatch = period.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (isoMatch) {
            const y = parseInt(isoMatch[1], 10);
            const m = parseInt(isoMatch[2], 10) - 1;
            const d = parseInt(isoMatch[3], 10);
            return { y, m, d };
        }

        // Try Date parse for other formats (e.g., "January 04, 2026")
        const dt = new Date(period);
        if (!isNaN(dt.getTime())) {
            return { y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate() };
        }

        // Try to match "Month DD, YYYY"
        const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const mMap: Record<string, number> = {};
        monthNames.forEach((mn, i) => mMap[mn.toLowerCase()] = i);
        const match = period.match(/^(\w+)\s+(\d{1,2}),\s*(\d{4})$/);
        if (match) {
            const [, monthName, dayStr, yearStr] = match;
            const month = mMap[monthName.toLowerCase()];
            if (month !== undefined) {
                const y = parseInt(yearStr, 10);
                const d = parseInt(dayStr, 10);
                return { y, m: month, d };
            }
        }

        return null;
    };

    const isSameYMD = (a?: string, b?: string) => {
        const pa = parseToLocalYMD(a);
        const pb = parseToLocalYMD(b);
        if (!pa || !pb) return false;
        return pa.y === pb.y && pa.m === pb.m && pa.d === pb.d;
    };

    const isSameYMDWithDate = (a?: string, date?: Date | null) => {
        if (!date) return false;
        const pa = parseToLocalYMD(a);
        if (!pa) return false;
        return pa.y === date.getFullYear() && pa.m === date.getMonth() && pa.d === date.getDate();
    };

    const hasData = !!(data && data.length > 0);
    const buttonDisabled = !!disabled || !selectedPeriodDate || !hasData;

    const handleExport = () => {
        // Use the filtered `data` passed from parent (report page) so date range selection is respected
        const filteredData = data ?? [];

        if (!filteredData || filteredData.length === 0) {
            alert('No sales summary data available to generate report for the selected period.');
            return;
        }

        // Group data by period
        const groupedByPeriod = filteredData.reduce((acc, summary) => {
            const period = summary.period || 'No Period';
            if (!acc[period]) {
                acc[period] = [];
            }
            acc[period].push(summary);
            return acc;
        }, {} as Record<string, UserSalesSummary[]>);

        // Create workbook
        const wb = XLSX.utils.book_new();

        // Process each period, sorted by date ascending
        Object.entries(groupedByPeriod)
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .forEach(([period, summaries]) => {
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
            // Format currency with 2 decimal places, integers without decimals
            const formatCurrency = (num: number) => num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const formatInteger = (num: number) => num.toLocaleString('en-US');
            const subtotalRow = {
                'Store ID': '',
                'Branch': 'SUBTOTAL -  ALBERTO STAND ALONE',
                'Region': '',
                'Province': '',
                'City': '',
                'Lessor': '',
                'Mall Name': '',
                'Cash/Check': formatCurrency(totalSums.cashCheck),
                'Charge': formatCurrency(totalSums.charge),
                'GC': formatCurrency(totalSums.gc),
                'Credit Note': formatCurrency(totalSums.creditNote),
                'Total Payments': formatCurrency(totalSums.totalPayments),
                'Regular Qty': formatInteger(totalSums.regularQty),
                'Regular Amt': formatCurrency(totalSums.regularAmt),
                'Non-Regular Qty': formatInteger(totalSums.nonRegularQty),
                'Non-Regular Amt': formatCurrency(totalSums.nonRegularAmt),
                'Total Qty Sold': formatInteger(totalSums.totalQtySold),
                'Total Amt': formatCurrency(totalSums.totalAmt),
                'Transaction Count': formatInteger(totalSums.transactionCount),
                'Head Count': formatInteger(totalSums.headCount),
            };

            // Add subtotal row to report data
            const fullReportData = [...reportData, subtotalRow];

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(fullReportData);

            // Auto-size columns
            const colWidths = [
                { wch: 12 }, // Store ID
                { wch: 35 }, // Branch (wider for SUBTOTAL text)
                { wch: 12 }, // Region
                { wch: 15 }, // Province
                { wch: 15 }, // City
                { wch: 15 }, // Lessor
                { wch: 20 }, // Mall Name
                { wch: 15 }, // Cash/Check
                { wch: 12 }, // Charge
                { wch: 12 },  // GC
                { wch: 15 }, // Credit Note
                { wch: 18 }, // Total Payments
                { wch: 15 }, // Regular Qty
                { wch: 15 }, // Regular Amt
                { wch: 18 }, // Non-Regular Qty
                { wch: 18 }, // Non-Regular Amt
                { wch: 18 }, // Total Qty Sold
                { wch: 15 }, // Total Amt
                { wch: 18 }, // Transaction Count
                { wch: 15 }, // Head Count
            ];
            ws['!cols'] = colWidths;

            // Set right alignment for numeric columns (columns H onwards = index 7+)
            const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
            for (let R = range.s.r; R <= range.e.r; R++) {
                for (let C = 7; C <= range.e.c; C++) { // Start from column H (Cash/Check)
                    const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                    if (ws[cellRef]) {
                        if (!ws[cellRef].s) ws[cellRef].s = {};
                        ws[cellRef].s.alignment = { horizontal: 'right' };
                    }
                }
            }

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

        // Generate filename with current date and optionally include selected month
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
        let monthTag = '';
        if (selectedPeriod) {
            // Try to parse selectedPeriod into a date first
            let monthLabel = '';
            const parsed = new Date(selectedPeriod);
            if (!isNaN(parsed.getTime())) {
                monthLabel = parsed.toLocaleString('en-US', { month: 'long', year: 'numeric' }).replace(/\s+/g, '_');
            } else {
                // fallback: try to extract month name from string or sanitize
                const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
                const found = monthNames.find(m => selectedPeriod!.toLowerCase().includes(m.toLowerCase()));
                if (found) monthLabel = `${found}_${(new Date()).getFullYear()}`;
                else monthLabel = selectedPeriod.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 32);
            }
            monthTag = `_${monthLabel}`;
        }

        const filename = `sales_report${monthTag}_${dateStr}.xlsx`;

        // Ensure workbook has sheets before saving
        if (!wb.SheetNames || wb.SheetNames.length === 0) {
            alert('No worksheet was generated for the selected data. Export cancelled.');
            return;
        }

        // Save file
        XLSX.writeFile(wb, filename);
    };

    return (
        <Button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={buttonDisabled}
            aria-disabled={buttonDisabled}
            title={buttonDisabled ? (selectedPeriod ? 'No data for selected period' : 'Select a period first') : 'Export Excel'}
        >
            <Download className="h-4 w-4 mr-2" />
            Export Excel
        </Button>
    );
}
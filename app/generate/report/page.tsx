"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser, useAllSalesSummaries, useSalesSummaryMutations } from "@/hooks/use-firebase";
import { Loading } from "../../../components/ui/loading";
import { AccessDenied } from "../../../components/ui/access-denied";
import { Button } from "../../../components/ui/button";
import { Trash2, Filter, Calendar, Store, X, CheckCircle, FileX, ArrowUp, ArrowDown, RefreshCw } from "lucide-react";
import { useConfirm } from "../../../hooks/use-confirm";
import { SuccessErrorModal } from "../../../components/SuccessErrorModal";
import { Pagination } from "../components/Pagination";
import { ExcelExport } from "../components/ExcelExport";
import DatePicker from "react-datepicker";
// @ts-ignore
import "react-datepicker/dist/react-datepicker.css";

export default function ReportPage() {
    const { currentUser, loading: userLoading } = useCurrentUser();
    const { summaries: allSalesSummaries, refetch: refetchSummaries } = useAllSalesSummaries();
    const { deleteSalesSummary } = useSalesSummaryMutations();
    const [localSummaries, setLocalSummaries] = useState<any[] | null>(null);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [selectedFrom, setSelectedFrom] = useState<Date | null>(null);
    const [selectedTo, setSelectedTo] = useState<Date | null>(null);
    const [selectedBranch, setSelectedBranch] = useState<string>("all");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [notificationModalOpen, setNotificationModalOpen] = useState<boolean>(false);
    const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
    const [notificationTitle, setNotificationTitle] = useState<string>('');
    const [notificationMessage, setNotificationMessage] = useState<string>('');

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize] = useState<number>(20); // Fixed page size, can be made configurable later

    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Default to latest period first

    const [ConfirmationDialog, confirm] = useConfirm("Delete Sales Summary", "Are you sure you want to delete this sales summary? This action cannot be undone.");
    const router = useRouter();

    // keep a local copy so we can optimistically update the UI
    // Only sync when allSalesSummaries changes (not localSummaries) to preserve optimistic updates
    useEffect(() => {
        if (allSalesSummaries) {
            setLocalSummaries(allSalesSummaries);
            setLastSyncTime(new Date());
        }
    }, [allSalesSummaries]);

    // Manual refresh handler
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refetchSummaries();
        } finally {
            setIsRefreshing(false);
        }
    };

    // Reset to page 1 when filters or sort change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedFrom, selectedTo, selectedBranch, selectedStatus, sortOrder]);

    // Get unique branch codes for filtering
    const availableBranches = useMemo(() => {
        const source = localSummaries ?? allSalesSummaries;
        if (!source) return [];
        const branches = source
            .map(summary => summary.branchCode)
            .filter(Boolean)
            .filter((branch, index, arr) => arr.indexOf(branch) === index)
            .sort();
        return branches;
    }, [allSalesSummaries]);

    // Filter data based on selected period and branch
    const filteredData = useMemo(() => {
        let data = localSummaries ?? allSalesSummaries ?? [];

        // Always apply date filters if set
        data = data.filter(summary => {
            if (!summary.period) return true;
            const periodDate = new Date(summary.period);
            if (isNaN(periodDate.getTime())) return true;

            if (selectedFrom && !selectedTo) {
                // Show only the selected date
                const fromDate = new Date(selectedFrom.getFullYear(), selectedFrom.getMonth(), selectedFrom.getDate());
                const nextDay = new Date(fromDate.getTime() + 24 * 60 * 60 * 1000);
                return periodDate >= fromDate && periodDate < nextDay;
            } else if (selectedTo && !selectedFrom) {
                // Show up to the selected date
                const toDate = new Date(selectedTo.getFullYear(), selectedTo.getMonth(), selectedTo.getDate(), 23, 59, 59, 999);
                return periodDate <= toDate;
            } else if (selectedFrom && selectedTo) {
                // Show within the range
                const fromDate = new Date(selectedFrom.getFullYear(), selectedFrom.getMonth(), selectedFrom.getDate());
                const toDate = new Date(selectedTo.getFullYear(), selectedTo.getMonth(), selectedTo.getDate(), 23, 59, 59, 999);
                return periodDate >= fromDate && periodDate <= toDate;
            } else {
                return true;
            }
        });

        // Filter by branch
        if (selectedBranch !== "all") {
            data = data.filter(summary => summary.branchCode === selectedBranch);
        }

        // Filter by status
        if (selectedStatus !== "all") {
            const isMatched = selectedStatus === "matched";
            data = data.filter(summary => summary.amountsMatch === isMatched);
        }

        // Sort by period date (latest first by default, or as selected)
        data = data.sort((a, b) => {
            if (!a.period || !b.period) {
                // If no period, sort by creation time
                return sortOrder === 'desc' 
                    ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            }
            const dateA = new Date(a.period);
            const dateB = new Date(b.period);
            return sortOrder === 'desc' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
        });

        return data;
    }, [localSummaries, allSalesSummaries, selectedFrom, selectedTo, selectedBranch, selectedStatus, sortOrder]);

    // Pagination
    const totalRecords = filteredData.length;
    const totalPages = Math.ceil(totalRecords / pageSize);
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredData.slice(startIndex, startIndex + pageSize);
    }, [filteredData, currentPage, pageSize]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleClearFilters = () => {
        setSelectedFrom(null);
        setSelectedTo(null);
        setSelectedBranch("all");
        setSelectedStatus("all");
        setCurrentPage(1);
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm();
        if (confirmed) {
            try {
                await deleteSalesSummary(id);
                // remove locally so UI updates immediately
                try {
                    setLocalSummaries(prev => prev ? prev.filter(s => s.id !== id) : prev);
                } catch (_) {}
                try { router.refresh(); } catch (_) {}
                setNotificationType('success');
                setNotificationTitle('Success!');
                setNotificationMessage('Sales summary deleted successfully!');
                setNotificationModalOpen(true);
            } catch (error) {
                setNotificationType('error');
                setNotificationTitle('Error');
                setNotificationMessage('Failed to delete sales summary. Please try again.');
                setNotificationModalOpen(true);
            }
        }
    };

    if (userLoading || currentUser === undefined || currentUser === null) {
        return <Loading />;
    }

    if (currentUser.role !== "admin") {
        return <AccessDenied />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <div className="container mx-auto p-6 max-w-8xl">
                <div className="mb-8">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <h1 className="text-3xl font-bold text-center">Sales Summaries Report</h1>
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                            title="Refresh data"
                        >
                            <RefreshCw className={`h-5 w-5 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    <p className="text-gray-600 text-center">
                        View and manage all user sales summaries
                        {lastSyncTime && (
                            <span className="text-gray-400 text-sm ml-2">
                                • Last synced: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </p>
                </div>

                {/* Filter Section */}
                <div className="bg-white shadow-md rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <Filter className="h-5 w-5 text-gray-500" />
                            <h2 className="text-lg font-semibold">Filters</h2>
                        </div>
                        <ExcelExport
                            data={filteredData}
                            disabled={!filteredData || filteredData.length === 0}
                        />
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <label className="text-sm font-medium">Period From:</label>
                            <DatePicker
                                selected={selectedFrom}
                                onChange={(date: Date | null) => setSelectedFrom(date)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholderText="Select start date"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Period To:</label>
                            <DatePicker
                                selected={selectedTo}
                                onChange={(date: Date | null) => setSelectedTo(date)}
                                minDate={selectedFrom || undefined}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholderText="Select end date"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-gray-500" />
                            <label className="text-sm font-medium">Branch:</label>
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Branches</option>
                                {availableBranches.map((branch) => (
                                    <option key={branch} value={branch}>
                                        {branch}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-gray-500" />
                            <label className="text-sm font-medium">Status:</label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Status</option>
                                <option value="matched">Matched</option>
                                <option value="mismatched">Mismatched</option>
                            </select>
                        </div>
                        <Button
                            onClick={handleClearFilters}
                            variant="outline"
                            className="flex items-center gap-2 px-3 py-2 h-auto text-gray-600 hover:text-gray-800 border-gray-300"
                            disabled={!selectedFrom && !selectedTo && selectedBranch === "all" && selectedStatus === "all"}
                        >
                            <X className="h-4 w-4" />
                            Clear Filters
                        </Button>
                    </div>
                    <div className="mt-4 text-sm text-gray-600">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
                        {(selectedFrom || selectedTo || selectedBranch !== "all" || selectedStatus !== "all") && (
                            <span className="ml-2">
                                (filtered by {selectedFrom && `from: ${selectedFrom.toLocaleDateString()}`}
                                {(selectedFrom && selectedTo) || (selectedFrom && selectedBranch !== "all") || (selectedFrom && selectedStatus !== "all") ? ", " : ""}
                                {selectedTo && `to: ${selectedTo.toLocaleDateString()}`}
                                {(selectedTo && selectedBranch !== "all") || (selectedTo && selectedStatus !== "all") ? ", " : ""}
                                {selectedBranch !== "all" && `branch: ${selectedBranch}`}
                                {(selectedBranch !== "all" && selectedStatus !== "all") ? ", " : ""}
                                {selectedStatus !== "all" && `status: ${selectedStatus}`})
                            </span>
                        )}
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    {/* Mobile scroll indicator */}
                    <div className="block sm:hidden px-4 py-2 bg-blue-50 border-b border-blue-200">
                        <p className="text-xs text-blue-700 text-center">
                            ← Swipe to scroll horizontally →
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Branch
                                    </th>
                                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="flex items-center gap-1">
                                            Period
                                            <button
                                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                                className="p-0.5 rounded text-gray-400 hover:text-gray-600"
                                                title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                                            >
                                                {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </th>
                                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Payments
                                    </th>
                                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                                        Regular Sales
                                    </th>
                                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                                        Non-Regular Sales
                                    </th>
                                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total Sales
                                    </th>
                                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                                        Transaction Count
                                    </th>
                                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                                        Head Count
                                    </th>
                                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Updated
                                    </th>
                                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-15 sm:right-20 bg-gray-200 border-l border-gray-200 z-10">
                                        Status
                                    </th>
                                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-200 border-gray-200">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedData.map((summary, index) => (
                                    <tr key={summary.id} className="hover:bg-gray-50 even:bg-gray-50 group">
                                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {summary.branchCode.split(' ')[0]}<br />{summary.branchCode.split(' ')[1] || ''}
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                                            {summary.period || 'N/A'}
                                        </td>
                                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                Cash/Check: ₱{summary.cashCheck || '0.00'}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Charge: ₱{summary.charge || '0.00'}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                GC: ₱{summary.gc || '0.00'}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Credit Note: ₱{summary.creditNote || '0.00'}
                                            </div>
                                            <div className="text-sm font-medium text-gray-900">
                                                Total: ₱{summary.totalPayments || '0.00'}
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                                            <div className="text-sm text-gray-900">
                                                Qty: {summary.regularQty}
                                            </div>
                                            <div className="text-sm font-medium text-gray-900">
                                                Amt: ₱{summary.regularAmt}
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                                            <div className="text-sm text-gray-900">
                                                Qty: {summary.nonRegularQty}
                                            </div>
                                            <div className="text-sm font-medium text-gray-900">
                                                Amt: ₱{summary.nonRegularAmt}
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                                            <div className="block sm:hidden text-xs text-gray-900">
                                                Regular: {summary.regularQty}
                                            </div>
                                            <div className="block sm:hidden text-xs text-gray-900">
                                                Regular Amt: ₱{summary.regularAmt}
                                            </div>
                                            <div className="block sm:hidden text-xs text-gray-900">
                                                Non-Regular: {summary.nonRegularQty}
                                            </div>
                                            <div className="block sm:hidden text-xs text-gray-900">
                                                Non-Regular Amt: ₱{summary.nonRegularAmt}
                                            </div>
                                            <div className="text-xs sm:text-sm text-gray-500">
                                                Qty: {summary.totalQtySold}
                                            </div>
                                            <div className="text-sm font-medium text-gray-900">
                                                Total Amt: ₱{summary.totalAmt}
                                            </div>
                                        </td>

                                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                                            {summary.transactionCount || 'N/A'}
                                        </td>
                                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                                            {summary.headCount || 'N/A'}
                                        </td>
                                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                                            {summary.updatedAt ? (
                                                <>
                                                    {new Date(summary.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                    <br />
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(summary.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </>
                                            ) : 'N/A'}
                                        </td>
                                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                                            <>
                                                {new Date(summary.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                <br />
                                                <span className="text-xs text-gray-500">
                                                    {new Date(summary.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </>
                                        </td>
                                        <td className={`px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap sticky right-15 sm:right-20 border-gray-200 z-10 group-hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                            {(() => {
                                                const paymentsStr = (summary.totalPayments || '0').toString().replace(/,/g, '');
                                                const salesStr = (summary.totalAmt || '0').toString().replace(/,/g, '');
                                                const payments = parseFloat(paymentsStr) || 0;
                                                const sales = parseFloat(salesStr) || 0;
                                                const diff = payments - sales;
                                                const isMatched = Math.abs(diff) < 0.01;
                                                return (
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${isMatched
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}
                                                        title={isMatched ? 'Payments match sales amount' : `Payments ${diff > 0 ? 'exceed' : 'are less than'} sales by ₱${Math.abs(diff).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}>
                                                        {isMatched ? 'Matched' : (() => {
                                                            const isOver = diff > 0;
                                                            return `${isOver ? 'Over' : 'Under'}: ₱${Math.abs(diff).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                                        })()}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className={`px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm font-medium sticky right-0 border-gray-200 z-10 group-hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                            <Button
                                                onClick={() => handleDelete(summary.id!)}
                                                variant="destructive"
                                                size="sm"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {paginatedData.length === 0 && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileX className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500">No sales summaries found for the selected period.</p>
                        </div>
                    )}
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />

                <ConfirmationDialog />
                <SuccessErrorModal
                    open={notificationModalOpen}
                    onOpenChange={setNotificationModalOpen}
                    type={notificationType}
                    title={notificationTitle}
                    message={notificationMessage}
                />
            </div>
        </div>
    );
}

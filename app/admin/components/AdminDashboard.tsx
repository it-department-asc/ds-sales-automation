'use client';

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useMemo } from "react";
import { UserActionsMenu } from "./UserActionsMenu";
import { EditUserModal } from "./EditUserModal";
import { TableFilters } from "./TableFilters";
import { TextHighlight } from "./TextHighlight";
import { EmptyState } from "./EmptyState";
import { Id } from "../../../convex/_generated/dataModel";
import { Users, Download } from "lucide-react";
import * as XLSX from 'xlsx';

export function AdminDashboard() {
    const allUsers = useQuery(api.users.getAllUsers);
    const allSalesSummaries = useQuery(api.userSalesSummaries.getAllSalesSummaries);
    const [editingUserId, setEditingUserId] = useState<Id<"users"> | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Filtered users based on search and filters
    const filteredUsers = useMemo(() => {
        if (!allUsers) return [];

        return allUsers.filter(user => {
            // Search filter
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm ||
                user.firstName?.toLowerCase().includes(searchLower) ||
                user.lastName?.toLowerCase().includes(searchLower) ||
                user.email?.toLowerCase().includes(searchLower) ||
                user.storeId?.toLowerCase().includes(searchLower) ||
                user.branch?.toLowerCase().includes(searchLower) ||
                user.region?.toLowerCase().includes(searchLower) ||
                user.province?.toLowerCase().includes(searchLower) ||
                user.city?.toLowerCase().includes(searchLower) ||
                user.lessor?.toLowerCase().includes(searchLower) ||
                user.mallName?.toLowerCase().includes(searchLower);

            // Role filter
            const matchesRole = !roleFilter || user.role === roleFilter;

            // Status filter
            const matchesStatus = !statusFilter || user.status === statusFilter;

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [allUsers, searchTerm, roleFilter, statusFilter]);

    const handleEdit = (userId: Id<"users">) => {
        setEditingUserId(userId);
    };

    const handleClose = () => {
        setEditingUserId(null);
    };

    const handleSuccess = () => {
        // Optional: refresh data or show toast notification
        console.log('User updated successfully');
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setRoleFilter('');
        setStatusFilter('');
    };

    const handleGenerateReport = () => {
        if (!allSalesSummaries || allSalesSummaries.length === 0) {
            alert('No sales summary data available to generate report.');
            return;
        }

        // Prepare data in the specified column order
        const reportData = allSalesSummaries.map(summary => ({
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
        }));

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(reportData);

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
        ];
        ws['!cols'] = colWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');

        // Generate filename with current date
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
        const filename = `sales_report_${dateStr}.xlsx`;

        // Save file
        XLSX.writeFile(wb, filename);
    };

    return (
        <div className="mt-4 md:mt-8 w-full relative">
            <div className="mb-4">
                <div className="flex flex-col sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center justify-between sm:block">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                All Users
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                Manage user accounts and permissions
                            </p>
                        </div>
                        {/* Mobile count badge */}
                        <div className="sm:hidden flex items-center space-x-2">
                            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                                {filteredUsers?.length || 0}
                            </span>
                            <button
                                onClick={handleGenerateReport}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!allSalesSummaries || allSalesSummaries.length === 0}
                            >
                                <Download className="h-3 w-3 mr-1" />
                                Report
                            </button>
                        </div>
                    </div>
                    {/* Desktop count */}  
                    <div className="hidden sm:block">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 text-sm">
                                <span className="text-gray-500">Total:</span>
                                <span className="font-semibold text-gray-900">{filteredUsers?.length || 0}</span>
                                <span className="text-gray-500">users</span>
                                {filteredUsers?.length !== allUsers?.length && (
                                    <span className="text-gray-400 text-xs">
                                        (filtered from {allUsers?.length || 0})
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={handleGenerateReport}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!allSalesSummaries || allSalesSummaries.length === 0}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Generate Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <TableFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                roleFilter={roleFilter}
                onRoleFilterChange={setRoleFilter}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                onClearFilters={handleClearFilters}
            />

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 sm:px-8 py-2 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-4 sm:px-8 py-2 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-4 sm:px-8 py-2 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-4 sm:px-8 py-2 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 sm:px-8 py-2 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Store ID</th>
                                <th className="px-4 sm:px-8 py-2 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Branch</th>
                                <th className="px-4 sm:px-8 py-2 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Region</th>
                                <th className="px-4 sm:px-8 py-2 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Province</th>
                                <th className="px-4 sm:px-8 py-2 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">City</th>
                                <th className="px-4 sm:px-8 py-2 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Lessor</th>
                                <th className="px-4 sm:px-8 py-2 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Mall Name</th>
                                <th className="px-4 sm:px-8 py-2 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 border-l border-gray-200">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers?.length === 0 ? (
                                <tr>
                                    <td colSpan={12} className="px-4 sm:px-8 py-2 sm:py-4">
                                        <EmptyState
                                            type={allUsers?.length === 0 ? 'no-users' : 'no-results'}
                                            searchTerm={searchTerm}
                                            onClearFilters={handleClearFilters}
                                        />
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers?.map((user) => (
                                <tr key={user._id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleEdit(user._id)}>
                                    <td className="px-4 sm:px-8 py-2 sm:py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                <span className="text-sm font-medium text-gray-600">
                                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                                </span>
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-gray-900">
                                                    <TextHighlight
                                                        text={`${user.firstName || ''} ${user.lastName || ''}`.trim()}
                                                        searchTerm={searchTerm}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 sm:px-8 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                                        <TextHighlight text={user.email || ''} searchTerm={searchTerm} />
                                    </td>
                                    <td className="px-4 sm:px-8 py-2 sm:py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin'
                                            ? 'bg-purple-100 text-purple-800'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-4 sm:px-8 py-2 sm:py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'active'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-4 sm:px-8 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                                        <TextHighlight text={user.storeId || '-'} searchTerm={searchTerm} />
                                    </td>
                                    <td className="px-4 sm:px-8 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                                        <TextHighlight text={user.branch || '-'} searchTerm={searchTerm} />
                                    </td>
                                    <td className="px-4 sm:px-8 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                                        <TextHighlight text={user.region || '-'} searchTerm={searchTerm} />
                                    </td>
                                    <td className="px-4 sm:px-8 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                                        <TextHighlight text={user.province || '-'} searchTerm={searchTerm} />
                                    </td>
                                    <td className="px-4 sm:px-8 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                                        <TextHighlight text={user.city || '-'} searchTerm={searchTerm} />
                                    </td>
                                    <td className="px-4 sm:px-8 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                                        <TextHighlight text={user.lessor || '-'} searchTerm={searchTerm} />
                                    </td>
                                    <td className="px-4 sm:px-8 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                                        <TextHighlight text={user.mallName || '-'} searchTerm={searchTerm} />
                                    </td>
                                    <td className="px-4 sm:px-8 py-2 sm:py-4 whitespace-nowrap text-sm sticky right-0 bg-white border-l border-gray-200" onClick={(e) => e.stopPropagation()}>
                                        <UserActionsMenu
                                            user={{ ...user, status: user.status || "active" }}
                                            onEdit={() => handleEdit(user._id)}
                                        />
                                    </td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            <EditUserModal
                userId={editingUserId}
                onClose={handleClose}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
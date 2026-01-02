'use client';

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useMemo } from "react";
import { UserActionsMenu } from "./UserActionsMenu";
import { EditUserModal } from "./EditUserModal";
import { TableFilters } from "./TableFilters";
import { TextHighlight } from "./TextHighlight";
import { EmptyState } from "./EmptyState";
import { useToast } from "@/hooks/use-toast";
import { Id } from "../../../convex/_generated/dataModel";
import { Users, ChevronLeft, ChevronRight } from "lucide-react";

export function AdminDashboard() {
    const allUsers = useQuery(api.users.getAllUsers);
    const allSalesSummaries = useQuery(api.userSalesSummaries.getAllSalesSummaries);
    const [editingUserId, setEditingUserId] = useState<Id<"users"> | null>(null);
    const { toast } = useToast();

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [salesSummaryFilter, setSalesSummaryFilter] = useState('');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Create mapping of user IDs to their latest sales summary
    const userSalesSummaryMap = useMemo(() => {
        if (!allSalesSummaries) return new Map();

        const map = new Map();
        allSalesSummaries.forEach(summary => {
            const existing = map.get(summary.userId);
            if (!existing || new Date(summary.createdAt) > new Date(existing.createdAt)) {
                map.set(summary.userId, summary);
            }
        });
        return map;
    }, [allSalesSummaries]);

    // Helper function to get current Philippine date (YYYY-MM-DD)
    const getPhilippineDate = () => {
        const now = new Date();
        // Philippine time is UTC+8
        const philippineTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
        return philippineTime.toISOString().split('T')[0]; // YYYY-MM-DD format
    };

    // Helper function to check if a date is today in Philippine time
    const isTodayPhilippineTime = (date: Date) => {
        const datePhilippine = new Date(date.getTime() + (8 * 60 * 60 * 1000));
        const todayPhilippine = getPhilippineDate();
        return datePhilippine.toISOString().split('T')[0] === todayPhilippine;
    };

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

            // Sales summary filter
            const userSummary = userSalesSummaryMap.get(user._id);
            const hasSubmittedToday = userSummary && isTodayPhilippineTime(new Date(userSummary.createdAt));
            const matchesSalesSummaryFilter = !salesSummaryFilter ||
                (salesSummaryFilter === 'submitted' && hasSubmittedToday) ||
                (salesSummaryFilter === 'not-submitted' && !hasSubmittedToday);

            return matchesSearch && matchesRole && matchesStatus && matchesSalesSummaryFilter;
        });
    }, [allUsers, searchTerm, roleFilter, statusFilter, salesSummaryFilter, userSalesSummaryMap]);

    // Pagination logic
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredUsers.slice(startIndex, endIndex);
    }, [filteredUsers, currentPage, itemsPerPage]);

    // Reset to first page when filters change
    useMemo(() => {
        setCurrentPage(1);
    }, [searchTerm, roleFilter, statusFilter, salesSummaryFilter]);

    const handleEdit = (userId: Id<"users">) => {
        setEditingUserId(userId);
    };

    const handleClose = () => {
        setEditingUserId(null);
    };

    const handleSuccess = () => {
        // Show success toast notification
        toast({
            title: "✅ User updated successfully",
            description: "The user information has been saved.",
            className: "border-green-200 bg-green-50 text-green-900"
        });
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setRoleFilter('');
        setStatusFilter('');
        setSalesSummaryFilter('');
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
                        </div>
                    </div>
                    {/* Desktop count */}
                    <div className="hidden sm:block">
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
                salesSummaryFilter={salesSummaryFilter}
                onSalesSummaryFilterChange={setSalesSummaryFilter}
                onClearFilters={handleClearFilters}
            />

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="px-4 sm:px-8 py-2 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-4 sm:px-8 py-2 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-4 sm:px-8 py-2 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-4 sm:px-8 py-2 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 sm:px-8 py-2 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Summary</th>
                                <th className="px-4 sm:px-8 py-2 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Store ID</th>
                                <th className="px-4 sm:px-8 py-2 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Branch</th>
                                <th className="px-4 sm:px-8 py-2 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Region</th>
                                <th className="px-4 sm:px-8 py-2 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Province</th>
                                <th className="px-4 sm:px-8 py-2 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">City</th>
                                <th className="px-4 sm:px-8 py-2 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Lessor</th>
                                <th className="px-4 sm:px-8 py-2 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Mall Name</th>
                                <th className="px-4 sm:px-8 py-2 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-200 border-l border-gray-200">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers?.length === 0 ? (
                                <tr>
                                    <td colSpan={13} className="px-4 sm:px-8 py-2 sm:py-4">
                                        <EmptyState
                                            type={allUsers?.length === 0 ? 'no-users' : 'no-results'}
                                            searchTerm={searchTerm}
                                            onClearFilters={handleClearFilters}
                                        />
                                    </td>
                                </tr>
                            ) : (
                                paginatedUsers?.map((user, index) => (
                                    <tr key={user._id} className="hover:bg-gray-50 even:bg-gray-50 transition-colors cursor-pointer group" onClick={() => handleEdit(user._id)}>
                                        <td className="px-4 sm:px-8 py-2 sm:py-4 whitespace-nowrap text-left">
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
                                        <td className="px-4 sm:px-8 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500 text-left">
                                            <TextHighlight text={user.email || ''} searchTerm={searchTerm} />
                                        </td>
                                        <td className="px-4 sm:px-8 py-2 sm:py-4 whitespace-nowrap text-left">
                                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin'
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-4 sm:px-8 py-2 sm:py-4 whitespace-nowrap text-left">
                                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-4 sm:px-8 py-2 sm:py-4 whitespace-nowrap text-left">
                                            {(() => {
                                                const userSummary = userSalesSummaryMap.get(user._id);
                                                const hasSubmittedToday = userSummary && isTodayPhilippineTime(new Date(userSummary.createdAt));

                                                if (hasSubmittedToday) {
                                                    const uploadDate = new Date(userSummary.createdAt);
                                                    const formattedDate = uploadDate.toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    });
                                                    return (
                                                        <div className="flex flex-col">
                                                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 w-fit">
                                                                Submitted
                                                            </span>
                                                            <span className="text-xs text-gray-500 mt-1">
                                                                {formattedDate}
                                                            </span>
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                            Not Submitted
                                                        </span>
                                                    );
                                                }
                                            })()}
                                        </td>
                                        <td className="px-4 sm:px-8 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell text-left">
                                            <TextHighlight text={user.storeId || '-'} searchTerm={searchTerm} />
                                        </td>
                                        <td className="px-4 sm:px-8 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell text-left">
                                            <TextHighlight text={user.branch || '-'} searchTerm={searchTerm} />
                                        </td>
                                        <td className="px-4 sm:px-8 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell text-left">
                                            <TextHighlight text={user.region || '-'} searchTerm={searchTerm} />
                                        </td>
                                        <td className="px-4 sm:px-8 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell text-left">
                                            <TextHighlight text={user.province || '-'} searchTerm={searchTerm} />
                                        </td>
                                        <td className="px-4 sm:px-8 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell text-left">
                                            <TextHighlight text={user.city || '-'} searchTerm={searchTerm} />
                                        </td>
                                        <td className="px-4 sm:px-8 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell text-left">
                                            <TextHighlight text={user.lessor || '-'} searchTerm={searchTerm} />
                                        </td>
                                        <td className="px-4 sm:px-8 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell text-left">
                                            <TextHighlight text={user.mallName || '-'} searchTerm={searchTerm} />
                                        </td>
                                        <td className={`px-4 sm:px-8 py-2 sm:py-4 whitespace-nowrap text-sm sticky right-0 border-l border-gray-200 text-left ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} group-hover:bg-gray-50`} onClick={(e) => e.stopPropagation()}>
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

            {/* Pagination */}
            {filteredUsers.length > itemsPerPage && (
                <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                        </button>

                        <div className="flex items-center space-x-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(page => {
                                    const distance = Math.abs(page - currentPage);
                                    return distance === 0 || distance === 1 || page === 1 || page === totalPages;
                                })
                                .map((page, idx, arr) => (
                                    <div key={page} className="flex items-center">
                                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                                            <span className="px-2 text-gray-400">...</span>
                                        )}
                                        <button
                                            onClick={() => setCurrentPage(page)}
                                            className={`px-3 py-2 text-sm font-medium rounded-md ${currentPage === page
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    </div>
                                ))}
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            <EditUserModal
                userId={editingUserId}
                onClose={handleClose}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
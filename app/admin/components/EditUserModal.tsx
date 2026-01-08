'use client';

import { useSalesSummariesByUserId, useUserMutations } from "@/hooks/use-firebase";
import { useState, useEffect } from "react";
import { UserSubmissionCalendar } from "./UserSubmissionCalendar";
import { useConfirm } from "../../../hooks/use-confirm";
import { X, Loader2, CheckCircle, User, Calendar } from "lucide-react";

interface EditUserModalProps {
  userId: string | null;
  user: any | null;
  onClose: () => void;
  onSuccess?: () => void;
  onUserUpdated?: (userId: string, updates: Partial<any>) => void;
}

export function EditUserModal({ userId, user, onClose, onSuccess, onUserUpdated }: EditUserModalProps) {
  const { summaries: userSalesSummaries } = useSalesSummariesByUserId(userId || undefined);
  const { updateUser } = useUserMutations();
  const [ConfirmationDialog, confirm] = useConfirm(
    "Confirm Changes",
    "Are you sure you want to save these changes to the user?"
  );

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<typeof formData | null>(null);
  const [formData, setFormData] = useState({
    role: "user" as "user" | "admin",
    status: "active" as "active" | "blocked",
    storeId: "",
    branch: "",
    region: "",
    province: "",
    city: "",
    lessor: "",
    mallName: ""
  });

  // Initialize form when user data loads
  useEffect(() => {
    if (user) {
      const userData = {
        role: user.role || "user",
        status: user.status || "active",
        storeId: user.storeId || "",
        branch: user.branch || "",
        region: user.region || "",
        province: user.province || "",
        city: user.city || "",
        lessor: user.lessor || "",
        mallName: user.mallName || ""
      };
      setFormData(userData);
      setInitialData(userData);
    }
  }, [user]);

  // Check if form data has changed from initial values
  const hasChanges = initialData && Object.keys(formData).some(key =>
    formData[key as keyof typeof formData] !== initialData[key as keyof typeof initialData]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !user) return;

    const confirmed = await confirm();
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const updates = {
        role: formData.role,
        status: formData.status,
        storeId: formData.storeId,
        branch: formData.branch,
        region: formData.region,
        province: formData.province,
        city: formData.city,
        lessor: formData.lessor,
        mallName: formData.mallName
      };
      await updateUser(userId, updates);

      // Optimistic update
      onUserUpdated?.(userId, updates);

      onClose();
      onSuccess?.();
    } catch (error) {
      console.error("Failed to update user:", error);
      // You could add error state here
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-6xl transform rounded-2xl bg-white p-6 shadow-2xl transition-all">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5" />
                Edit User{user ? ` - ${user.firstName}` : ''}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Update user information and permissions
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
              disabled={isSubmitting}
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {!user ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - User Details */}
                <div className="space-y-6">
                  {/* Role & Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-offset-0 outline-none transition appearance-none bg-white"
                        disabled={isSubmitting}
                      >
                        <option value="user">User</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-offset-0 outline-none transition appearance-none bg-white"
                        disabled={isSubmitting}
                      >
                        <option value="active">Active</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </div>
                  </div>

                  {/* Store Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Store ID
                      </label>
                      <input
                        type="text"
                        name="storeId"
                        value={formData.storeId}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-offset-0 outline-none transition"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Branch
                      </label>
                      <input
                        type="text"
                        name="branch"
                        value={formData.branch}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-offset-0 outline-none transition"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Region
                        </label>
                        <input
                          type="text"
                          name="region"
                          value={formData.region}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-offset-0 outline-none transition"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Province
                        </label>
                        <input
                          type="text"
                          name="province"
                          value={formData.province}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-offset-0 outline-none transition"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-offset-0 outline-none transition"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Lessor
                        </label>
                        <input
                          type="text"
                          name="lessor"
                          value={formData.lessor}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-offset-0 outline-none transition"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mall Name
                      </label>
                      <input
                        type="text"
                        name="mallName"
                        value={formData.mallName}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-offset-0 outline-none transition"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column - Sales Summary Periods */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Sales Summary Periods ({userSalesSummaries?.length || 0} {(userSalesSummaries?.length || 0) === 1 ? 'Total' : 'Totals'})
                    </label>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
                      {userSalesSummaries && userSalesSummaries.length > 0 ? (
                        <div className="space-y-4">
                          <UserSubmissionCalendar 
                            userSalesSummaries={userSalesSummaries || []} 
                            currentMonth={currentMonth}
                            onMonthChange={setCurrentMonth}
                          />

                          {/* Legend & Stats Container */}
                          <div className="grid grid-cols-2 sm:grid-cols-2 sm:flex sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 md:gap-6 bg-white rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm sm:shadow-md">

                            {/* Submission Dates */}
                            <div className="flex items-center justify-start gap-2 sm:gap-3 order-1">
                              <div className="flex-shrink-0">
                                <div className="relative w-5 h-5 rounded-lg shadow-sm flex items-center justify-center" style={{ backgroundColor: '#059669' }}>
                                  <span className="text-white text-xs font-bold">✓</span>
                                </div>
                              </div>
                              <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                                Submission Dates
                              </span>
                            </div>

                            {/* Today */}
                            <div className="flex items-center justify-start gap-2 sm:gap-3 order-2">
                              <div className="flex-shrink-0">
                                <div className="relative w-5 h-5 bg-blue-500 rounded-lg shadow-sm flex items-center justify-center border border-blue-300">
                                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                </div>
                              </div>
                              <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                                Today
                              </span>
                            </div>

                            {/* Divider - Hidden on sm and up */}
                            <div className="h-px w-full bg-gray-200 sm:hidden order-3 col-span-2"></div>

                            {/* Submissions Count */}
                            <div className="col-span-2 sm:col-span-1 sm:col-auto order-4 sm:order-3 w-full">
                              <div className="text-xs sm:text-sm text-gray-600 bg-gray-50 sm:bg-gray-100 px-3 py-2 sm:py-1.5 rounded-lg sm:rounded-full font-medium border border-gray-200 text-center w-full flex items-center justify-center gap-1">
                                {(() => {
                                  const currentMonthSubmissions = userSalesSummaries.filter(summary => {
                                    if (!summary.period) return false;
                                    const periodMatch = summary.period.match(/^(\w+)\s+(\d+),\s+(\d{4})$/);
                                    if (periodMatch) {
                                      const [, monthName, , year] = periodMatch;
                                      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                                        'July', 'August', 'September', 'October', 'November', 'December'];
                                      const monthIndex = monthNames.indexOf(monthName);
                                      return monthIndex === currentMonth.getMonth() && parseInt(year) === currentMonth.getFullYear();
                                    }
                                    return false;
                                  });
                                  const count = currentMonthSubmissions.length;
                                  if (count === 0) {
                                    return <span className="text-gray-500">No summary</span>;
                                  }
                                  return (
                                    <>
                                      <div className="font-semibold text-gray-800">{count}</div>
                                      <div className="text-xs text-gray-500">
                                        {count === 1 ? 'summary' : 'summaries'}
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>

                          {/* Alternative Stacked Layout for Very Small Screens */}
                          <div className="block sm:hidden mt-2">
                            <div className="text-xs text-gray-500 text-center">
                              Tap dates to see submission details
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-gray-500 text-sm font-medium">{userId ? 'No sales summaries submitted yet' : 'Select a user to view submissions'}</p>
                          <p className="text-gray-400 text-xs mt-1">Submission dates will appear here</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !hasChanges}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      <ConfirmationDialog />
    </div>
  );
}
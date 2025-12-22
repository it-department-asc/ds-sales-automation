'use client';

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { UserActionsMenu } from "./UserActionsMenu";
import { Id } from "../../../convex/_generated/dataModel";
import { X, Loader2, CheckCircle, User } from "lucide-react";
import { useConfirm } from "../../../hooks/use-confirm";


interface EditUserModalProps {
  userId: Id<"users"> | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditUserModal({ userId, onClose, onSuccess }: EditUserModalProps) {
  const allUsers = useQuery(api.users.getAllUsers);
  const user = allUsers?.find(u => u._id === userId);
  const updateUser = useMutation(api.users.updateUser);
  const [ConfirmationDialog, confirm] = useConfirm(
    "Confirm Changes",
    "Are you sure you want to save these changes to the user?"
  );
  
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      setFormData({
        role: user.role || "user",
        status: user.status || "active",
        storeId: user.storeId || "",
        branch: user.branch || "",
        region: user.region || "",
        province: user.province || "",
        city: user.city || "",
        lessor: user.lessor || "",
        mallName: user.mallName || ""
      });
    }
  }, [user]);

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
      await updateUser({
        userId,
        role: formData.role,
        status: formData.status,
        storeId: formData.storeId,
        branch: formData.branch,
        region: formData.region,
        province: formData.province,
        city: formData.city,
        lessor: formData.lessor,
        mallName: formData.mallName
      });
      
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
        <div className="relative w-full max-w-md transform rounded-2xl bg-white p-6 shadow-2xl transition-all">
          
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
                  disabled={isSubmitting}
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
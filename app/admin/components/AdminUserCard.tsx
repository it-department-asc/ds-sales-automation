'use client';

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { AdminUserForm } from "./AdminUserForm";

interface User {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: "user" | "admin";
  storeId?: string;
  branch?: string;
  region?: string;
  province?: string;
  city?: string;
  lessor?: string;
  mallName?: string;
}

export function AdminUserCard({ user }: { user: User }) {
  const updateUserRole = useMutation(api.users.updateUserRole);
  const [isEditing, setIsEditing] = useState(false);

  const handleRoleChange = (newRole: "user" | "admin") => {
    updateUserRole({ userId: user._id as any, role: newRole });
  };

  return (
    <div className="bg-white p-4 rounded border">
      <p className="text-black mb-2">{user.firstName} {user.lastName} - {user.email}</p>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-gray-600">Role:</span>
        <select
          value={user.role}
          onChange={(e) => handleRoleChange(e.target.value as "user" | "admin")}
          className="px-2 py-1 border rounded text-black"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="mb-2">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {isEditing ? "Cancel" : "Edit Details"}
        </button>
      </div>
      {isEditing && (
        <AdminUserForm user={user} onSave={() => setIsEditing(false)} />
      )}
    </div>
  );
}
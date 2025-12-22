"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useConfirm } from "../../../hooks/use-confirm";

interface User {
  _id: Id<"users">;
  clerkId: string;
  status: "active" | "blocked";
}

interface UserActionsMenuProps {
  user: User;
  onEdit: () => void;
}

export function UserActionsMenu({ user, onEdit }: UserActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isConfirming, setIsConfirming] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const updateUserStatus = useMutation(api.users.updateUserStatus);
  const deleteUser = useMutation(api.users.deleteUser);
  const [ConfirmationDialog, confirm] = useConfirm(
    "Delete User",
    "Are you sure you want to delete this user? This will permanently remove their account from the system and they will no longer be able to access the application."
  );

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isConfirming) return; // Don't close menu when confirmation dialog is open
      
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, isConfirming]);

  const handleBlock = async () => {
    const newStatus = user.status === "active" ? "blocked" : "active";
    await updateUserStatus({
      userId: user._id,
      status: newStatus,
    });
    setIsOpen(false);
  };

  const handleDelete = async () => {
    setIsConfirming(true);
    try {
      const confirmed = await confirm();
      if (!confirmed) return;

      // First delete from Clerk
      const clerkResponse = await fetch('/api/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clerkId: user.clerkId }),
      });

      if (!clerkResponse.ok) {
        const errorData = await clerkResponse.json();
        console.error('Clerk API error:', errorData);
        throw new Error(errorData.error || 'Failed to delete user from Clerk');
      }

      // If Clerk deletion succeeds, delete from Convex
      await deleteUser({ userId: user._id });
      setIsOpen(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      // You could show a toast notification here
      alert('Failed to delete user. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <>
      <ConfirmationDialog />
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
              top: rect.top - 120, // Position just above the button
              left: rect.left + rect.width - 192, // Align to the right
            });
          }
          setIsOpen((prev) => !prev);
        }}
        className="p-2 rounded hover:bg-gray-100 focus:outline-none"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="fixed w-48 bg-white rounded-md shadow-lg z-50 border"
          style={{ top: position.top, left: position.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              onEdit();
              setIsOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Edit
          </button>

          <button
            onClick={handleBlock}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            {user.status === "active" ? "Block" : "Unblock"}
          </button>

          <button
            onClick={handleDelete}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      )}
    </>
  );
}

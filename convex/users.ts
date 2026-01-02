import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    role: v.optional(v.union(v.literal("user"), v.literal("admin"))),
    storeId: v.optional(v.string()),
    branch: v.optional(v.string()),
    region: v.optional(v.string()),
    province: v.optional(v.string()),
    city: v.optional(v.string()),
    lessor: v.optional(v.string()),
    mallName: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("blocked"))),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    // Check if this is the specific admin user, otherwise make them user
    const isAdminUser = args.clerkId === "user_372adEWROdQuJunogShuMiKs6ka";

    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      role: args.role || (isAdminUser ? "admin" : "user"), // Only specific user is admin
      status: "active",
      storeId: args.storeId,
      branch: args.branch,
      region: args.region,
      province: args.province,
      city: args.city,
      lessor: args.lessor,
      mallName: args.mallName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return userId;
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    return user;
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if current user is admin
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can update user roles");
    }

    await ctx.db.patch(args.userId, {
      role: args.role,
      updatedAt: Date.now(),
    });
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.optional(v.union(v.literal("user"), v.literal("admin"))),
    status: v.optional(v.union(v.literal("active"), v.literal("blocked"))),
    storeId: v.optional(v.string()),
    branch: v.optional(v.string()),
    region: v.optional(v.string()),
    province: v.optional(v.string()),
    city: v.optional(v.string()),
    lessor: v.optional(v.string()),
    mallName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if current user is admin
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can update user details");
    }

    const { userId, ...updates } = args;
    await ctx.db.patch(userId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const updateUserStatus = mutation({
  args: {
    userId: v.id("users"),
    status: v.union(v.literal("active"), v.literal("blocked")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if current user is admin
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can update user status");
    }

    await ctx.db.patch(args.userId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if current user is admin
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can delete users");
    }

    await ctx.db.delete(args.userId);
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      return [];
    }

    return await ctx.db.query("users").collect();
  },
});

export const getUserCount = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.length;
  },
});
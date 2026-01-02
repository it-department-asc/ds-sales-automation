import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveUserSalesSummary = mutation({
  args: {
    branchCode: v.string(),
    period: v.optional(v.string()),
    regularQty: v.number(),
    regularAmt: v.number(),
    nonRegularQty: v.number(),
    nonRegularAmt: v.number(),
    totalQtySold: v.number(),
    totalAmt: v.number(),
    cashCheck: v.number(),
    charge: v.number(),
    gc: v.number(),
    creditNote: v.number(),
    totalPayments: v.number(),
    amountsMatch: v.boolean(),
    storeId: v.optional(v.string()),
    branch: v.optional(v.string()),
    region: v.optional(v.string()),
    province: v.optional(v.string()),
    city: v.optional(v.string()),
    lessor: v.optional(v.string()),
    mallName: v.optional(v.string()),
    transactionCount: v.optional(v.number()),
    headCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) {
      throw new Error("User not found");
    }
    // Check if an entry already exists for the same user, storeId, branch, and period
    const existing = await ctx.db
      .query("userSalesSummaries")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("storeId"), args.storeId) && q.eq(q.field("branch"), args.branch) && q.eq(q.field("period"), args.period))
      .unique();

    const data = {
      userId: user._id,
      branchCode: args.branchCode,
      period: args.period,
      regularQty: args.regularQty,
      regularAmt: args.regularAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      nonRegularQty: args.nonRegularQty,
      nonRegularAmt: args.nonRegularAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totalQtySold: args.totalQtySold,
      totalAmt: args.totalAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      cashCheck: args.cashCheck.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      charge: args.charge.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      gc: args.gc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      creditNote: args.creditNote.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totalPayments: args.totalPayments.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      amountsMatch: args.amountsMatch,
      storeId: args.storeId,
      branch: args.branch,
      region: args.region,
      province: args.province,
      city: args.city,
      lessor: args.lessor,
      mallName: args.mallName,
      transactionCount: args.transactionCount,
      headCount: args.headCount,
      createdAt: Date.now(),
    };

    if (existing) {
      // Update existing entry
      await ctx.db.patch(existing._id, {
        ...data,
        updatedAt: Date.now(),
      });
    } else {
      // Insert new entry
      await ctx.db.insert("userSalesSummaries", {
        ...data,
        createdAt: Date.now(),
      });
    }
  },
});

export const getUserSalesSummaries = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) {
      throw new Error("User not found");
    }
    return await ctx.db
      .query("userSalesSummaries")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const getAllSalesSummaries = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user || user.role !== "admin") {
      return [];
    }
    return await ctx.db.query("userSalesSummaries").collect();
  },
});

export const getExistingPeriods = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) {
      throw new Error("User not found");
    }
    const summaries = await ctx.db
      .query("userSalesSummaries")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return summaries.map(s => s.period).filter(Boolean);
  },
});

export const deleteSalesSummary = mutation({
  args: {
    id: v.id("userSalesSummaries"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }
    await ctx.db.delete(args.id);
  },
});

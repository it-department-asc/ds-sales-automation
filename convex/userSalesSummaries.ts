import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveUserSalesSummary = mutation({
  args: {
    branchCode: v.string(),
    regularQty: v.number(),
    regularAmt: v.number(),
    nonRegularQty: v.number(),
    nonRegularAmt: v.number(),
    totalQtySold: v.number(),
    totalAmt: v.number(),
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
    await ctx.db.insert("userSalesSummaries", {
      userId: user._id,
      branchCode: args.branchCode,
      regularQty: args.regularQty,
      regularAmt: args.regularAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      nonRegularQty: args.nonRegularQty,
      nonRegularAmt: args.nonRegularAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totalQtySold: args.totalQtySold,
      totalAmt: args.totalAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      createdAt: Date.now(),
    });
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

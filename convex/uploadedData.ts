import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveUploadedData = mutation({
  args: {
    fileName: v.string(),
    data: v.any(),
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
    await ctx.db.insert("uploadedData", {
      userId: user._id,
      fileName: args.fileName,
      data: args.data,
      createdAt: Date.now(),
    });
  },
});

export const getUploadedData = query({
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
    if (!user) {
      return [];
    }
    let data;
    if (user.role === "admin") {
      data = await ctx.db.query("uploadedData").collect();
    } else {
      data = await ctx.db
        .query("uploadedData")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
    }
    // Add user info to each item
    const dataWithUser = await Promise.all(
      data.map(async (item) => {
        const uploader = await ctx.db.get(item.userId);
        return {
          ...item,
          uploaderName: uploader ? `${uploader.firstName || ''} ${uploader.lastName || ''}`.trim() || uploader.email : 'Unknown',
        };
      })
    );
    return dataWithUser;
  },
});

export const deleteUploadedData = mutation({
  args: {
    id: v.id("uploadedData"),
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
    const data = await ctx.db.get(args.id);
    if (!data) {
      throw new Error("Data not found");
    }
    // Allow if owner or admin
    if (data.userId !== user._id && user.role !== "admin") {
      throw new Error("Not authorized");
    }
    await ctx.db.delete(args.id);
  },
});
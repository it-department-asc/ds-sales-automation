// Returns the latest uploadedData file uploaded by an admin (for all users)
export const getLatestAdminProductFile = query({
  args: {},
  handler: async (ctx) => {
    // Find all users with role admin
    const admins = await ctx.db.query("users").collect();
    const adminIds = admins.filter(u => u.role === "admin").map(u => u._id);
    if (adminIds.length === 0) return null;
    // Find all uploadedData by admins
    const adminFiles = await ctx.db.query("uploadedData").collect();
    const adminProductFiles = adminFiles.filter(f => adminIds.includes(f.userId));
    if (adminProductFiles.length === 0) return null;
    // Group by fileId and find the latest
    const fileMap = new Map<string, any[]>();
    adminProductFiles.forEach((item) => {
      if (!fileMap.has(item.fileId)) {
        fileMap.set(item.fileId, []);
      }
      fileMap.get(item.fileId)!.push(item);
    });
    let latestFileId = null;
    let latestCreatedAt = 0;
    for (const [fileId, partitions] of fileMap) {
      const createdAt = partitions[0].createdAt;
      if (createdAt > latestCreatedAt) {
        latestCreatedAt = createdAt;
        latestFileId = fileId;
      }
    }
    if (!latestFileId) return null;
    const partitions = fileMap.get(latestFileId)!;
    partitions.sort((a, b) => a.partition - b.partition);
    const combinedData = partitions.flatMap(p => p.data);
    // Attach uploader info
    const uploader = await ctx.db.get(partitions[0].userId);
    return {
      _id: partitions[0]._id,
      userId: partitions[0].userId,
      fileId: latestFileId,
      fileName: partitions[0].fileName,
      // data: combinedData, // Remove data from response
      createdAt: partitions[0].createdAt,
      uploaderName: uploader ? `${(uploader as any).firstName || ''} ${(uploader as any).lastName || ''}`.trim() || (uploader as any).email : 'Unknown',
    };
  },
});
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveUploadedData = mutation({
  args: {
    fileId: v.string(),
    fileName: v.string(),
    partition: v.number(),
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
      fileId: args.fileId,
      fileName: args.fileName,
      partition: args.partition,
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
    // Group by fileId
    const fileMap = new Map<string, any[]>();
    data.forEach((item) => {
      if (!fileMap.has(item.fileId)) {
        fileMap.set(item.fileId, []);
      }
      fileMap.get(item.fileId)!.push(item);
    });
    // For each file, combine partitions
    const combinedData = [];
    for (const [fileId, partitions] of fileMap) {
      partitions.sort((a, b) => a.partition - b.partition);
      const combined = {
        _id: partitions[0]._id, // Use first partition's id for compatibility
        userId: partitions[0].userId,
        fileId,
        fileName: partitions[0].fileName,
        // data: partitions.flatMap(p => p.data), // Remove data from list
        createdAt: partitions[0].createdAt,
      };
      combinedData.push(combined);
    }
    // Add user info to each item
    const dataWithUser = await Promise.all(
      combinedData.map(async (item) => {
        const uploader = await ctx.db.get(item.userId);
        return {
          ...item,
          uploaderName: uploader ? `${(uploader as any).firstName || ''} ${(uploader as any).lastName || ''}`.trim() || (uploader as any).email : 'Unknown',
        };
      })
    );
    return dataWithUser;
  },
});

export const getUploadedDataContent = query({
  args: { fileId: v.string(), offset: v.optional(v.number()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const partitions = await ctx.db
      .query("uploadedData")
      .withIndex("by_file_id", (q) => q.eq("fileId", args.fileId))
      .collect();
    if (partitions.length === 0) return null;
    partitions.sort((a, b) => a.partition - b.partition);
    const fullData = partitions.flatMap(p => p.data);
    const offset = args.offset || 0;
    const limit = args.limit || 8000;
    const slicedData = fullData.slice(offset, offset + limit);
    return {
      data: slicedData,
      totalRows: fullData.length,
      hasMore: offset + limit < fullData.length,
      nextOffset: offset + limit,
    };
  },
});

export const deleteUploadedData = mutation({
  args: {
    fileId: v.string(),
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
    // Find all partitions for this fileId
    const partitions = await ctx.db
      .query("uploadedData")
      .withIndex("by_file_id", (q) => q.eq("fileId", args.fileId))
      .collect();
    if (partitions.length === 0) {
      throw new Error("Data not found");
    }
    // Check if user is owner or admin
    const firstPartition = partitions[0];
    if (firstPartition.userId !== user._id && user.role !== "admin") {
      throw new Error("Not authorized");
    }
    // Delete all partitions
    await Promise.all(partitions.map(p => ctx.db.delete(p._id)));
  },
});
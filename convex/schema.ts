import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    role: v.union(v.literal("user"), v.literal("admin")),
    status: v.optional(v.union(v.literal("active"), v.literal("blocked"))),
    storeId: v.optional(v.string()),
    branch: v.optional(v.string()),
    region: v.optional(v.string()),
    province: v.optional(v.string()),
    city: v.optional(v.string()),
    lessor: v.optional(v.string()),
    mallName: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),
  uploadedData: defineTable({
    userId: v.id("users"),
    fileId: v.string(), // Unique ID for the file, shared across partitions
    fileName: v.string(),
    partition: v.number(), // Partition index, starting from 0
    data: v.any(), // Parsed data as array of objects, chunked
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_file_id", ["fileId"])
    .index("by_user_file", ["userId", "fileName"]),
  userSalesSummaries: defineTable({
    userId: v.id("users"),
    branchCode: v.string(),
    regularQty: v.number(),
    regularAmt: v.union(v.number(), v.string()),
    nonRegularQty: v.number(),
    nonRegularAmt: v.union(v.number(), v.string()),
    totalQtySold: v.number(),
    totalAmt: v.union(v.number(), v.string()),
    cashCheck: v.optional(v.union(v.number(), v.string())),
    charge: v.optional(v.union(v.number(), v.string())),
    gc: v.optional(v.union(v.number(), v.string())),
    creditNote: v.optional(v.union(v.number(), v.string())),
    totalPayments: v.optional(v.union(v.number(), v.string())),
    amountsMatch: v.optional(v.boolean()),
    storeId: v.optional(v.string()),
    branch: v.optional(v.string()),
    region: v.optional(v.string()),
    province: v.optional(v.string()),
    city: v.optional(v.string()),
    lessor: v.optional(v.string()),
    mallName: v.optional(v.string()),
    transactionCount: v.optional(v.number()),
    headCount: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"]),
});
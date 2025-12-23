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
    fileName: v.string(),
    data: v.any(), // Parsed data as array of objects
    createdAt: v.number(),
  })
    .index("by_user", ["userId"]),
  userSalesSummaries: defineTable({
    userId: v.id("users"),
    branchCode: v.string(),
    regularQty: v.number(),
    regularAmt: v.union(v.number(), v.string()),
    nonRegularQty: v.number(),
    nonRegularAmt: v.union(v.number(), v.string()),
    totalQtySold: v.number(),
    totalAmt: v.union(v.number(), v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"]),
});
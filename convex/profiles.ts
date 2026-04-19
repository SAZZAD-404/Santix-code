import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create or update profile
export const upsert = mutation({
  args: {
    displayName: v.string(),
    avatar: v.optional(v.string()),
    status: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.auth.getUserIdentity();
    if (!sessionId) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.query("sessions").first();
    if (!session) {
      throw new Error("Session not found");
    }

    // Check if profile exists
    const existing = await ctx.db
      .query("profiles")
      .withIndex("bySession", (q) => q.eq("sessionId", session._id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("profiles", {
      sessionId: session._id,
      ...args,
    });
  },
});

// Get current user's profile
export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const sessionId = await ctx.auth.getUserIdentity();
    if (!sessionId) {
      return null;
    }

    const session = await ctx.db.query("sessions").first();
    if (!session) {
      return null;
    }

    return await ctx.db
      .query("profiles")
      .withIndex("bySession", (q) => q.eq("sessionId", session._id))
      .first();
  },
});

// Get profile by session ID
export const getBySession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("bySession", (q) => q.eq("sessionId", args.sessionId))
      .first();
  },
});

// List all profiles
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("profiles").collect();
  },
});

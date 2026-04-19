import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new channel
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isPrivate: v.boolean(),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.auth.getUserIdentity();
    if (!sessionId) {
      throw new Error("Not authenticated");
    }

    // Get or create session
    const session = await ctx.db
      .query("sessions")
      .first();
    
    if (!session) {
      throw new Error("Session not found");
    }

    const channelId = await ctx.db.insert("channels", {
      name: args.name,
      description: args.description,
      createdBy: session._id,
      createdAt: Date.now(),
      isPrivate: args.isPrivate,
    });

    // Add creator as member
    await ctx.db.insert("channelMembers", {
      channelId,
      userId: session._id,
      joinedAt: Date.now(),
    });

    return channelId;
  },
});

// List all channels
export const list = query({
  args: {},
  handler: async (ctx) => {
    const channels = await ctx.db.query("channels").collect();
    return channels;
  },
});

// Get channel by ID
export const get = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.channelId);
  },
});

// Update channel
export const update = mutation({
  args: {
    channelId: v.id("channels"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { channelId, ...updates } = args;
    await ctx.db.patch(channelId, updates);
  },
});

// Delete channel
export const remove = mutation({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.channelId);
  },
});

// Join a channel
export const join = mutation({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const sessionId = await ctx.auth.getUserIdentity();
    if (!sessionId) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.query("sessions").first();
    if (!session) {
      throw new Error("Session not found");
    }

    // Check if already a member
    const existing = await ctx.db
      .query("channelMembers")
      .withIndex("byChannelAndUser", (q) =>
        q.eq("channelId", args.channelId).eq("userId", session._id)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("channelMembers", {
      channelId: args.channelId,
      userId: session._id,
      joinedAt: Date.now(),
    });
  },
});

// Get channel members
export const getMembers = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("channelMembers")
      .withIndex("byChannel", (q) => q.eq("channelId", args.channelId))
      .collect();

    return members;
  },
});

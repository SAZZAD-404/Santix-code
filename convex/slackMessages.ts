import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Send a message
export const send = mutation({
  args: {
    channelId: v.id("channels"),
    content: v.string(),
    parentMessageId: v.optional(v.id("slackMessages")),
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

    return await ctx.db.insert("slackMessages", {
      channelId: args.channelId,
      userId: session._id,
      content: args.content,
      createdAt: Date.now(),
      parentMessageId: args.parentMessageId,
    });
  },
});

// Get messages for a channel
export const list = query({
  args: {
    channelId: v.id("channels"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    
    const messages = await ctx.db
      .query("slackMessages")
      .withIndex("byChannel", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .take(limit);

    // Get user profiles for each message
    const messagesWithProfiles = await Promise.all(
      messages.map(async (message) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("bySession", (q) => q.eq("sessionId", message.userId))
          .first();

        return {
          ...message,
          profile: profile || {
            displayName: "Anonymous",
            avatar: undefined,
          },
        };
      })
    );

    return messagesWithProfiles.reverse();
  },
});

// Get thread messages (replies)
export const getThread = query({
  args: {
    parentMessageId: v.id("slackMessages"),
  },
  handler: async (ctx, args) => {
    const replies = await ctx.db
      .query("slackMessages")
      .withIndex("byParent", (q) => q.eq("parentMessageId", args.parentMessageId))
      .collect();

    const repliesWithProfiles = await Promise.all(
      replies.map(async (message) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("bySession", (q) => q.eq("sessionId", message.userId))
          .first();

        return {
          ...message,
          profile: profile || {
            displayName: "Anonymous",
            avatar: undefined,
          },
        };
      })
    );

    return repliesWithProfiles;
  },
});

// Update a message
export const update = mutation({
  args: {
    messageId: v.id("slackMessages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.auth.getUserIdentity();
    if (!sessionId) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    const session = await ctx.db.query("sessions").first();
    if (!session || message.userId !== session._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.messageId, {
      content: args.content,
      editedAt: Date.now(),
    });
  },
});

// Delete a message
export const remove = mutation({
  args: {
    messageId: v.id("slackMessages"),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.auth.getUserIdentity();
    if (!sessionId) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    const session = await ctx.db.query("sessions").first();
    if (!session || message.userId !== session._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.messageId);
  },
});

// Search messages
export const search = query({
  args: {
    channelId: v.optional(v.id("channels")),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    let messages;
    
    if (args.channelId !== undefined) {
      messages = await ctx.db
        .query("slackMessages")
        .withIndex("byChannel", (q) => q.eq("channelId", args.channelId!))
        .collect();
    } else {
      messages = await ctx.db.query("slackMessages").collect();
    }

    // Simple text search
    const filtered = messages.filter((msg) =>
      msg.content.toLowerCase().includes(args.searchTerm.toLowerCase())
    );

    const messagesWithProfiles = await Promise.all(
      filtered.map(async (message) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("bySession", (q) => q.eq("sessionId", message.userId))
          .first();

        return {
          ...message,
          profile: profile || {
            displayName: "Anonymous",
            avatar: undefined,
          },
        };
      })
    );

    return messagesWithProfiles;
  },
});

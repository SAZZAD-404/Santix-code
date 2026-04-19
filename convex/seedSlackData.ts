import { mutation } from "./_generated/server";

/**
 * Seed script to create initial channels and demo data
 * Run this once to set up your Slack system with sample data
 * 
 * Usage: Call this mutation from the Convex dashboard
 */
export const seedInitialData = mutation({
  args: {},
  handler: async (ctx) => {
    // Get or create a session
    let session = await ctx.db.query("sessions").first();
    
    if (!session) {
      const sessionId = await ctx.db.insert("sessions", {});
      session = await ctx.db.get(sessionId);
    }

    if (!session) {
      throw new Error("Failed to create session");
    }

    // Create default channels
    const channels = [
      {
        name: "general",
        description: "General discussion and announcements",
        isPrivate: false,
      },
      {
        name: "random",
        description: "Random stuff and off-topic chat",
        isPrivate: false,
      },
      {
        name: "dev",
        description: "Development and technical discussions",
        isPrivate: false,
      },
    ];

    const createdChannels = [];
    
    for (const channel of channels) {
      // Check if channel already exists
      const existing = await ctx.db
        .query("channels")
        .withIndex("byName", (q) => q.eq("name", channel.name))
        .first();

      if (!existing) {
        const channelId = await ctx.db.insert("channels", {
          name: channel.name,
          description: channel.description,
          createdBy: session._id,
          createdAt: Date.now(),
          isPrivate: channel.isPrivate,
        });

        // Add creator as member
        await ctx.db.insert("channelMembers", {
          channelId,
          userId: session._id,
          joinedAt: Date.now(),
        });

        createdChannels.push({ id: channelId, name: channel.name });
      }
    }

    // Create a default profile if it doesn't exist
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("bySession", (q) => q.eq("sessionId", session._id))
      .first();

    if (!existingProfile) {
      await ctx.db.insert("profiles", {
        sessionId: session._id,
        displayName: "Demo User",
        status: "👋 New to the workspace",
      });
    }

    return {
      success: true,
      message: `Created ${createdChannels.length} channels`,
      channels: createdChannels,
    };
  },
});

/**
 * Clean up all Slack data (use with caution!)
 */
export const cleanupSlackData = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all messages
    const messages = await ctx.db.query("slackMessages").collect();
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete all channel members
    const members = await ctx.db.query("channelMembers").collect();
    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    // Delete all channels
    const channels = await ctx.db.query("channels").collect();
    for (const channel of channels) {
      await ctx.db.delete(channel._id);
    }

    // Delete all profiles
    const profiles = await ctx.db.query("profiles").collect();
    for (const profile of profiles) {
      await ctx.db.delete(profile._id);
    }

    return {
      success: true,
      deleted: {
        messages: messages.length,
        members: members.length,
        channels: channels.length,
        profiles: profiles.length,
      },
    };
  },
});

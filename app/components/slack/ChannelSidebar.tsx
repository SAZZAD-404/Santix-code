import { useState } from "react";
import type { Id } from "convex/_generated/dataModel";

interface Channel {
  _id: Id<"channels">;
  name: string;
  description?: string;
  createdAt: number;
  isPrivate: boolean;
}

interface Profile {
  displayName: string;
  avatar?: string;
  status?: string;
}

interface ChannelSidebarProps {
  channels: Channel[];
  selectedChannelId: Id<"channels"> | null;
  onSelectChannel: (channelId: Id<"channels">) => void;
  onCreateChannel: (name: string, description?: string) => void;
  currentProfile: Profile | null | undefined;
  onOpenProfile: () => void;
}

export function ChannelSidebar({
  channels,
  selectedChannelId,
  onSelectChannel,
  onCreateChannel,
  currentProfile,
  onOpenProfile,
}: ChannelSidebarProps) {
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDescription, setNewChannelDescription] = useState("");

  const handleCreateChannel = () => {
    if (newChannelName.trim()) {
      onCreateChannel(newChannelName.trim(), newChannelDescription.trim() || undefined);
      setNewChannelName("");
      setNewChannelDescription("");
      setShowCreateChannel(false);
    }
  };

  return (
    <div className="w-64 bg-gray-800 flex flex-col">
      {/* Workspace Header */}
      <div className="h-16 border-b border-gray-700 flex items-center px-4">
        <h1 className="text-xl font-bold">Slack Clone</h1>
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-400">Channels</h3>
            <button
              onClick={() => setShowCreateChannel(!showCreateChannel)}
              className="text-gray-400 hover:text-white text-xl"
              title="Create channel"
            >
              +
            </button>
          </div>

          {/* Create Channel Form */}
          {showCreateChannel && (
            <div className="mb-4 p-3 bg-gray-700 rounded-lg">
              <input
                type="text"
                placeholder="Channel name"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                className="w-full px-3 py-2 mb-2 bg-gray-800 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newChannelDescription}
                onChange={(e) => setNewChannelDescription(e.target.value)}
                className="w-full px-3 py-2 mb-2 bg-gray-800 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateChannel}
                  className="flex-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateChannel(false)}
                  className="flex-1 px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Channel List */}
          <div className="space-y-1">
            {channels.map((channel) => (
              <button
                key={channel._id}
                onClick={() => onSelectChannel(channel._id)}
                className={`w-full text-left px-3 py-2 rounded hover:bg-gray-700 transition-colors ${
                  selectedChannelId === channel._id ? "bg-blue-600" : ""
                }`}
              >
                <div className="flex items-center">
                  <span className="mr-2">#</span>
                  <span className="truncate">{channel.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="border-t border-gray-700 p-4">
        <button
          onClick={onOpenProfile}
          className="w-full flex items-center gap-3 hover:bg-gray-700 p-2 rounded transition-colors"
        >
          <div className="w-10 h-10 rounded bg-blue-600 flex items-center justify-center font-bold">
            {currentProfile?.avatar ? (
              <img
                src={currentProfile.avatar}
                alt={currentProfile.displayName}
                className="w-full h-full rounded object-cover"
              />
            ) : (
              currentProfile?.displayName?.[0]?.toUpperCase() || "?"
            )}
          </div>
          <div className="flex-1 text-left">
            <div className="font-semibold">
              {currentProfile?.displayName || "Set your name"}
            </div>
            {currentProfile?.status && (
              <div className="text-xs text-gray-400">{currentProfile.status}</div>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { ChannelSidebar } from "./ChannelSidebar";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ProfileEditor } from "./ProfileEditor";

export function SlackChat() {
  const [selectedChannelId, setSelectedChannelId] = useState<Id<"channels"> | null>(null);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const channels = useQuery(api.channels.list);
  const messages = useQuery(
    api.slackMessages.list,
    selectedChannelId ? { channelId: selectedChannelId } : "skip"
  );
  const currentProfile = useQuery(api.profiles.getCurrent);

  const sendMessage = useMutation(api.slackMessages.send);
  const createChannel = useMutation(api.channels.create);

  const handleSendMessage = async (content: string) => {
    if (!selectedChannelId) return;
    await sendMessage({ channelId: selectedChannelId, content });
  };

  const handleCreateChannel = async (name: string, description?: string) => {
    const channelId = await createChannel({
      name,
      description,
      isPrivate: false,
    });
    setSelectedChannelId(channelId);
  };

  const selectedChannel = channels?.find((c: any) => c._id === selectedChannelId);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <ChannelSidebar
        channels={channels || []}
        selectedChannelId={selectedChannelId}
        onSelectChannel={setSelectedChannelId}
        onCreateChannel={handleCreateChannel}
        currentProfile={currentProfile}
        onOpenProfile={() => setShowProfileEditor(true)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        {selectedChannel && (
          <div className="h-16 border-b border-gray-700 flex items-center px-6">
            <div>
              <h2 className="text-xl font-bold">#{selectedChannel.name}</h2>
              {selectedChannel.description && (
                <p className="text-sm text-gray-400">{selectedChannel.description}</p>
              )}
            </div>
            <div className="ml-auto">
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Messages */}
        {selectedChannelId ? (
          <>
            <MessageList messages={messages || []} />
            <MessageInput onSend={handleSendMessage} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">Welcome to Slack Clone</h3>
              <p>Select a channel to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Profile Editor Modal */}
      {showProfileEditor && (
        <ProfileEditor
          currentProfile={currentProfile}
          onClose={() => setShowProfileEditor(false)}
        />
      )}
    </div>
  );
}

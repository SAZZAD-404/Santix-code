import { useEffect, useRef } from "react";

interface Message {
  _id: string;
  content: string;
  createdAt: number;
  editedAt?: number;
  profile: {
    displayName: string;
    avatar?: string;
  };
}

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        messages.map((message) => (
          <div key={message._id} className="flex gap-3 hover:bg-gray-800 p-2 rounded">
            {/* Avatar */}
            <div className="w-10 h-10 rounded bg-blue-600 flex items-center justify-center font-bold flex-shrink-0">
              {message.profile.avatar ? (
                <img
                  src={message.profile.avatar}
                  alt={message.profile.displayName}
                  className="w-full h-full rounded object-cover"
                />
              ) : (
                message.profile.displayName[0]?.toUpperCase() || "?"
              )}
            </div>

            {/* Message Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-semibold">{message.profile.displayName}</span>
                <span className="text-xs text-gray-400">
                  {formatTime(message.createdAt)}
                </span>
                {message.editedAt && (
                  <span className="text-xs text-gray-500">(edited)</span>
                )}
              </div>
              <div className="text-gray-200 break-words whitespace-pre-wrap">
                {message.content}
              </div>
            </div>
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

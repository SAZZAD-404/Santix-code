import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";

interface Profile {
  displayName: string;
  avatar?: string;
  status?: string;
  bio?: string;
}

interface ProfileEditorProps {
  currentProfile: Profile | null | undefined;
  onClose: () => void;
}

export function ProfileEditor({ currentProfile, onClose }: ProfileEditorProps) {
  const [displayName, setDisplayName] = useState(currentProfile?.displayName || "");
  const [avatar, setAvatar] = useState(currentProfile?.avatar || "");
  const [status, setStatus] = useState(currentProfile?.status || "");
  const [bio, setBio] = useState(currentProfile?.bio || "");

  const upsertProfile = useMutation(api.profiles.upsert);

  useEffect(() => {
    if (currentProfile) {
      setDisplayName(currentProfile.displayName || "");
      setAvatar(currentProfile.avatar || "");
      setStatus(currentProfile.status || "");
      setBio(currentProfile.bio || "");
    }
  }, [currentProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim()) {
      await upsertProfile({
        displayName: displayName.trim(),
        avatar: avatar.trim() || undefined,
        status: status.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Display Name *
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Avatar URL (optional)
            </label>
            <input
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Status (optional)
            </label>
            <input
              type="text"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="e.g., Working from home"
              className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Bio (optional)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
              className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

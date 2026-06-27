import { Search, Monitor, KeyRound, Lock, MessageSquare, Video, Bell, Keyboard, HelpCircle, Camera } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect, useRef, useState } from "react";

const SETTINGS_ITEMS = [
  {
    title: "General",
    subtitle: "Startup and close",
    icon: Monitor,
  },
  {
    title: "Account",
    subtitle: "Security notifications, account info",
    icon: KeyRound,
  },
  {
    title: "Privacy",
    subtitle: "Blocked contacts, disappearing messages",
    icon: Lock,
  },
  {
    title: "Chats",
    subtitle: "Theme, wallpaper, chat settings",
    icon: MessageSquare,
  },
  {
    title: "Video & voice",
    subtitle: "Camera, microphone & speakers",
    icon: Video,
  },
  {
    title: "Notifications",
    subtitle: "Message notifications",
    icon: Bell,
  },
  {
    title: "Keyboard shortcuts",
    subtitle: "Quick actions",
    icon: Keyboard,
  },
  {
    title: "Help and feedback",
    subtitle: "Help centre, contact us, privacy policy",
    icon: HelpCircle,
  },
];

function SettingsPanel() {
  const { authUser, updateProfile, logout } = useAuthStore();
  const [statusText, setStatusText] = useState(authUser?.status || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    setStatusText(authUser?.status || "");
  }, [authUser?.status]);

  const handleStatusSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await updateProfile({ status: statusText.trim() });
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      setIsUploading(true);
      try {
        await updateProfile({ profilePic: reader.result });
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="h-16 px-6 flex items-center border-b border-[#1a1a1a]">
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
      </div>

      <div className="px-6 py-4 border-b border-[#1a1a1a]">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9b9b9b]" />
          <input
            type="text"
            placeholder="Search settings"
            className="w-full h-11 bg-[#131313] border border-[#e50914] rounded-full pl-11 pr-4 text-sm text-white placeholder-[#7a7a7a] focus:outline-none focus:ring-2 focus:ring-red-600"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-4 pb-20 md:pb-4">
        <div className="w-full flex items-center gap-4 text-left pb-4 border-b border-[#1a1a1a]">
          <div className="relative">
            <img
              src={authUser?.profilePic || "/avatar.png"}
              alt={authUser?.fullName || "Profile"}
              className={`w-14 h-14 rounded-full object-cover ${isUploading ? "opacity-60" : ""}`}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#131313] border border-[#1a1a1a] flex items-center justify-center text-[#b0b0b0] hover:text-white"
              title="Change photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleProfileUpload}
              className="hidden"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-base truncate">
              {authUser?.fullName || "Your profile"}
            </p>
            <p className="text-[#9b9b9b] text-sm truncate">
              {authUser?.status || "Set your status"}
            </p>
          </div>
        </div>

        <div className="space-y-2 pb-2 border-b border-[#1a1a1a]">
          <label className="text-sm text-[#9b9b9b]">Status</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              maxLength={80}
              placeholder="Set your status"
              className="flex-1 h-10 bg-[#131313] border border-[#1a1a1a] rounded-lg px-3 text-sm text-white placeholder-[#7a7a7a] focus:outline-none focus:ring-2 focus:ring-red-600"
            />
            <button
              type="button"
              onClick={handleStatusSave}
              disabled={isSaving}
              className="h-10 px-4 rounded-lg bg-[#e50914] text-white text-sm font-medium hover:bg-[#ff1f2b] disabled:opacity-60"
            >
              Save
            </button>

            <button
              type="button"
              onClick={logout}
              className="mt-6 w-full h-12 rounded-xl border border-red-900/60 bg-red-950/20 text-red-300 hover:bg-red-600 hover:text-white flex items-center justify-center gap-2 font-semibold transition-colors"
            >
              <LogOutIcon className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default SettingsPanel;
import { LogOutIcon } from "lucide-react";

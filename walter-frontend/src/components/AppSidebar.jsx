import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { MessageCircleIcon, UsersIcon, SettingsIcon, LogOutIcon, CameraIcon, Loader2 } from "lucide-react";
import { createElement, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import WebsiteBookmarks from "./WebsiteBookmarks";

function AppSidebar() {
  const { authUser, logout, updateProfile } = useAuthStore();
  const { activeTab, setActiveTab, setChatFilter } = useChatStore();
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isSettings = location.pathname.startsWith("/settings");

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    if (tab === "chats") {
      setChatFilter("all"); // Reset to "all" when switching to chats
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setIsUploading(true);
      try {
        await updateProfile({ profilePic: base64Image });
      } catch (error) {
        console.error("Failed to update profile", error);
      } finally {
        setIsUploading(false);
      }
    };
  };

  const SidebarIcon = ({ icon: Icon, label, onClick, isActive, isDanger, className }) => (
    <div className="relative group flex items-center justify-center">
      <button
        onClick={onClick}
        className={`p-3 rounded-xl transition-all duration-200 relative
          ${isActive ? "bg-red-900/40" : "hover:bg-[#141414] hover:bg-opacity-80"}
          ${className || ""}
        `}
        aria-label={label}
      >
        {createElement(Icon, {
          className: `w-6 h-6 transition-colors duration-200
            ${isActive ? "text-[#e50914]" : "text-[#aebac1] group-hover:text-[#f3f3f3]"}
            ${isDanger ? "group-hover:text-red-400" : ""}
          `,
        })}
      </button>

      {/* Perfect Tooltip (Desktop Only) */}
      <div className="hidden md:group-hover:flex absolute left-16 z-[100] items-center">
        {/* Triangle arrow */}
        <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-gray-900" />
        <span className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-md shadow-xl whitespace-nowrap ml-[-1px]">
          {label}
        </span>
      </div>
    </div>
  );

  return (
    <aside className="fixed bottom-0 left-0 w-full h-16 md:static md:w-[76px] md:h-full md:shrink-0 bg-[#0a0a0a] border-t md:border-t-0 md:border-r border-[#1a1a1a] flex md:flex-col flex-row items-center justify-around md:justify-start md:py-6 z-40 pb-[env(safe-area-inset-bottom)] md:pb-0">
      {/* Top: User avatar with Upload (Desktop Only) */}
      <div className="hidden md:block relative group mb-6">
        <div className="relative cursor-pointer w-12 h-12">
          <img
            src={authUser?.profilePic || "/avatar.png"}
            alt="User avatar"
            className={`w-full h-full rounded-full object-cover border-2 border-transparent transition-all duration-200 
              ${isUploading ? "opacity-50" : "group-hover:border-red-600 group-hover:opacity-80"}
            `}
          />

          {/* Upload Overlay */}
          <label
            htmlFor="avatar-upload"
            className={`absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer ${isUploading ? "opacity-100 cursor-not-allowed" : ""}`}
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <CameraIcon className="w-5 h-5 text-white drop-shadow-md" />
            )}
          </label>
          <input
            type="file"
            id="avatar-upload"
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isUploading}
          />
        </div>

        {/* Profile Tooltip */}
        <div className="absolute left-16 top-1/2 -translate-y-1/2 z-[100] hidden group-hover:flex items-center pointer-events-none">
          <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-gray-900" />
          <span className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-md shadow-xl whitespace-nowrap ml-[-1px]">
            Change Profile Photo
          </span>
        </div>
      </div>

      <div className="hidden md:block w-8 border-b border-[#1a1a1a]/50 mb-6" />

      {/* Main icons */}
      <div className="flex flex-row md:flex-col gap-1 md:gap-3 w-full md:w-auto justify-evenly md:justify-start px-2 md:px-0">
        <SidebarIcon
          icon={MessageCircleIcon}
          label="Chats"
          isActive={!isSettings && activeTab === "chats"}
          onClick={() => {
            handleTabSwitch("chats");
            navigate("/");
          }}
        />
        <SidebarIcon
          icon={UsersIcon}
          label="Contacts"
          isActive={!isSettings && activeTab === "contacts"}
          onClick={() => {
            handleTabSwitch("contacts");
            navigate("/");
          }}
        />
        {/* Mobile only Settings/Logout (Optional compression) */}
        <div className="md:hidden">
          <SidebarIcon
            icon={SettingsIcon}
            label="Settings"
            isActive={isSettings}
            onClick={() => navigate("/settings")}
          />
        </div>
        <WebsiteBookmarks />
      </div>

      <div className="hidden md:flex flex-1" />

      {/* Bottom icons (Desktop) */}
      <div className="hidden md:flex flex-col gap-3">
        <SidebarIcon
          icon={SettingsIcon}
          label="Settings"
          isActive={isSettings}
          onClick={() => navigate("/settings")}
        />
        <SidebarIcon
          icon={LogOutIcon}
          label="Logout"
          isDanger
          onClick={logout}
        />
      </div>
    </aside>
  );
}
export default AppSidebar;

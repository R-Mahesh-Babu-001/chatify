import { useChatStore } from "../store/useChatStore";

import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import AppSidebar from "../components/AppSidebar";
import ProfileHeader from "../components/ProfileHeader";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";
import SettingsPanel from "../components/SettingsPanel";
import EmbeddedWebsiteWorkspace from "../components/EmbeddedWebsiteWorkspace";
import { useLocation } from "react-router";
import { useWebsiteStore } from "../store/useWebsiteStore";

function ChatPage() {
  const { activeTab, selectedUser } = useChatStore();
  const location = useLocation();
  const isSettings = location.pathname.startsWith("/settings");
  const { selectedWebsite } = useWebsiteStore();
  const hasMainWorkspace = selectedWebsite || selectedUser;

  return (
    <div className="w-full h-screen flex flex-col md:flex-row bg-black overflow-hidden relative">
      {/* AppSidebar tile */}
      {/* On mobile, this is valid but inside AppSidebar it is fixed bottom. 
          We need to ensure it doesn't break layout. 
          Since it's fixed on mobile, it doesn't take space in flex flow, which is good.
          We just need padding-bottom on the list container. 
      */}
      <AppSidebar />

      {/* LEFT SIDE (Chats List) */}
      <div
        className={`w-full md:w-[360px] lg:w-[420px] bg-[#0c0c0c] flex flex-col h-full border-r border-[#1a1a1a] z-30 pb-20 md:pb-0
          ${hasMainWorkspace && !isSettings ? "hidden md:flex" : "flex"}`}
      >
        {isSettings ? (
          <SettingsPanel />
        ) : (
          <>
            <ProfileHeader />
            <div className="flex-1 overflow-y-auto space-y-0 custom-scrollbar bg-[#0c0c0c]">
              {activeTab === "chats" ? <ChatsList /> : <ContactList />}
            </div>
          </>
        )}
      </div>

      {/* RIGHT SIDE (Chat Window) */}
      <div
        className={`flex-1 flex flex-col bg-gradient-to-br from-[#050505] via-[#0c0c0c] to-[#1a0003] h-full
            ${hasMainWorkspace ? "fixed inset-0 z-50 md:static flex" : "hidden md:flex"}`}
      >
        {isSettings ? (
          <div className="flex-1 flex items-center justify-center text-[#7a7a7a]">
            <p className="text-sm">Select a settings option</p>
          </div>
        ) : selectedWebsite ? (
          <EmbeddedWebsiteWorkspace />
        ) : selectedUser ? (
          <ChatContainer />
        ) : (
          <NoConversationPlaceholder />
        )}
      </div>
    </div>
  );
}
export default ChatPage;

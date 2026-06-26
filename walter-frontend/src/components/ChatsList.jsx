import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";
import { Plus } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";

function ChatsList() {
  const { getMyChatPartners, chats, groups, getMyGroups, isUsersLoading, isGroupsLoading, setSelectedUser, chatFilter, isGroupModalOpen, setIsGroupModalOpen } = useChatStore();
  const { onlineUsers } = useAuthStore();
  useEffect(() => {
    getMyChatPartners();
    getMyGroups(); // Fetch groups as well
  }, [getMyChatPartners, getMyGroups]);

  if (isUsersLoading && chatFilter === "all") return <UsersLoadingSkeleton />;
  if (isGroupsLoading && chatFilter === "groups") return <UsersLoadingSkeleton />;

  // Filter Logic
  let displayItems = [];
  if (chatFilter === "groups") {
    displayItems = groups;
  } else {
    displayItems = chats;
  }

  if (chatFilter === "groups" && displayItems.length === 0) {
    // Show "Create Group" prominent button if empty
  }

  return (
    <div className="flex flex-col h-full bg-[#0c0c0c] relative">
      {/* Search Bar (Optional enhancement, sticking to basic for now, handled by parent maybe or just simple list) */}

      {/* Create Group Button (Visible only in Groups tab) */}
      {chatFilter === "groups" && (
        <button
          onClick={() => setIsGroupModalOpen(true)}
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#151515] transition-all border-b border-[#1a1a1a] text-[#e50914]"
        >
          <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center">
            <Plus className="w-6 h-6 text-[#e50914]" />
          </div>
          <span className="font-medium text-white">New Group</span>
        </button>
      )}

      {displayItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-[#9b9b9b] text-sm">
            {chatFilter === "groups" ? "No groups yet" : "No chats yet"}
          </p>
        </div>
      )}

      {displayItems.map((item) => {
        const isGroup = item.admin !== undefined;
        const name = isGroup ? item.name : item.fullName;
        const image = item.profilePic || "/avatar.png";
        const isOnline = !isGroup && onlineUsers.includes(item._id);

        return (
          <div
            key={item._id}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#151515] transition-all border-b border-[#1a1a1a]"
            onClick={() => setSelectedUser(item)}
          >
            <div className={`avatar ${isOnline ? "online" : ""}`}>
              <div className="w-12 h-12 rounded-full">
                <img src={image} alt={name} className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[#f2f2f2] font-normal text-base truncate">{name}</h4>
              <p className="text-[#9b9b9b] text-sm truncate">
                {isGroup ? "Group" : isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </div>
        );
      })}

      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
      />
    </div>
  );
}
export default ChatsList;

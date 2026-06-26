import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
import { useWebsiteStore } from "./useWebsiteStore";
import {
  deleteLocalMessage,
  getLocalConversations,
  getLocalMessages,
  mergeConversations,
  mergeMessages,
  saveLocalMessages,
} from "../lib/localChatStorage";

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  groups: [],
  messages: [],
  activeTab: "chats",
  chatFilter: "all", // "all", "unread", "groups"
  selectedUser: null, // This can be a User or a Group object
  isUsersLoading: false,
  isMessagesLoading: false,
  isGroupsLoading: false,
  isGroupModalOpen: false, // New global state for modal
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,

  setIsGroupModalOpen: (isOpen) => set({ isGroupModalOpen: isOpen }),

  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setChatFilter: (filter) => set({ chatFilter: filter }),
  setSelectedUser: (selectedUser) => {
    if (selectedUser) useWebsiteStore.getState().closeWebsite();
    set({ selectedUser });
  },

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    const ownerId = useAuthStore.getState().authUser?._id;
    try {
      const localChats = await getLocalConversations({
        ownerId,
        conversationType: "direct",
      });
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: mergeConversations(res.data, localChats) });
    } catch (error) {
      const localChats = await getLocalConversations({
        ownerId,
        conversationType: "direct",
      });
      set({ chats: localChats });
      toast.error(error.response?.data?.message || "Failed to fetch chats");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMyGroups: async () => {
    set({ isGroupsLoading: true });
    const ownerId = useAuthStore.getState().authUser?._id;
    try {
      const localGroups = await getLocalConversations({
        ownerId,
        conversationType: "group",
      });
      const res = await axiosInstance.get("/groups");
      set({ groups: mergeConversations(res.data, localGroups) });
    } catch (error) {
      const localGroups = await getLocalConversations({
        ownerId,
        conversationType: "group",
      });
      set({ groups: localGroups });
      toast.error(error.response?.data?.message || "Failed to fetch groups");
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  createGroup: async (groupData) => {
    try {
      const res = await axiosInstance.post("/groups/create", groupData);
      set((state) => ({ groups: [res.data, ...state.groups] }));
      toast.success("Group created successfully");

      // Join the group room immediately
      const socket = useAuthStore.getState().socket;
      socket.emit("joinGroup", res.data._id);

      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
      throw error;
    }
  },

  getMessages: async (id) => {
    set({ isMessagesLoading: true });
    try {
      // Determine if it's a group or user based on current state or assumption
      // However, we only have one ID.
      // Strategy: Try group endpoint if it looks like a group? 
      // Simplest: The UI knows if selectedUser is a group.
      const { selectedUser } = get();
      const ownerId = useAuthStore.getState().authUser?._id;
      const isGroup = selectedUser?.admin !== undefined; // Quick check if it's a group object
      const conversationType = isGroup ? "group" : "direct";
      const localMessages = await getLocalMessages({
        ownerId,
        conversationId: id,
        conversationType,
      });

      if (localMessages.length > 0) {
        set({ messages: localMessages });
      }

      const endpoint = isGroup ? `/groups/${id}` : `/messages/${id}`;
      const res = await axiosInstance.get(endpoint);
      const messages = mergeMessages(res.data, localMessages);
      set({ messages });

      await saveLocalMessages({
        ownerId,
        conversation: selectedUser,
        messages,
      });

      await axiosInstance.post(`/messages/seen/${id}`, { isGroup });
    } catch (error) {
      if (get().messages.length === 0) {
        toast.error(error.response?.data?.message || "Something went wrong");
      }
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { authUser } = useAuthStore.getState();
    const ownerId = authUser?._id;
    const isGroup = selectedUser?.admin !== undefined; // Check if group

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id, // Keep full object if possible, but ID is enough for logic usually
      receiverId: isGroup ? undefined : selectedUser._id,
      groupId: isGroup ? selectedUser._id : undefined,
      text: messageData.text,
      image: messageData.image,
      audio: messageData.audio,
      fileName: messageData.fileName,
      fileType: messageData.fileType,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    set({ messages: [...messages, optimisticMessage] });

    try {
      const payload = { ...messageData, isGroup };
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, payload);
      set((state) => ({
        messages: [...state.messages.filter((m) => m._id !== tempId), res.data],
      }));
      saveLocalMessages({
        ownerId,
        conversation: selectedUser,
        messages: [res.data],
      }).catch(() => {});
    } catch (error) {
      set({ messages: messages });
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  deleteMessage: async (messageId, scope) => {
    const { messages } = get();
    const ownerId = useAuthStore.getState().authUser?._id;
    const previous = messages;
    set({ messages: messages.filter((m) => m._id !== messageId) });
    try {
      await axiosInstance.post(`/messages/delete/${messageId}`, { scope });
      await deleteLocalMessage({ ownerId, messageId });
    } catch (error) {
      set({ messages: previous });
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, isSoundEnabled } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      // Check if message belongs to current chat
      // If direct chat: senderId matches selectedUser._id
      // If group chat: groupId matches selectedUser._id

      const isGroupMessage = !!newMessage.groupId;
      const isGroupChatOpen = selectedUser.admin !== undefined; // Duck typing check

      let shouldAdd = false;

      if (isGroupChatOpen && isGroupMessage) {
        if (newMessage.groupId === selectedUser._id) shouldAdd = true;
      } else if (!isGroupChatOpen && !isGroupMessage) {
        if (newMessage.senderId === selectedUser._id) shouldAdd = true;
      }

      if (!shouldAdd) return;

      const currentMessages = get().messages;
      set({ messages: [...currentMessages, newMessage] });
      saveLocalMessages({
        ownerId: useAuthStore.getState().authUser?._id,
        conversation: selectedUser,
        messages: [newMessage],
      }).catch(() => {});

      if (isGroupMessage) {
        axiosInstance.post(`/messages/seen/${selectedUser._id}`, { isGroup: true }).catch(() => { });
      } else if (newMessage.senderId === selectedUser._id) {
        axiosInstance.post(`/messages/seen/${selectedUser._id}`, { isGroup: false }).catch(() => { });
      }

      if ("Notification" in window) {
        const showNotification = () => {
          const title = isGroupMessage
            ? selectedUser.name || "New group message"
            : selectedUser.fullName || "New message";
          const body = newMessage.text ? newMessage.text : newMessage.image ? "Image" : newMessage.audio ? "Voice message" : "New message";
          try {
            const notification = new Notification(title, { body });
            notification.onclick = () => window.focus();
          } catch {
            // ignore notification errors
          }
        };

        if (Notification.permission === "granted") {
          showNotification();
        } else if (Notification.permission === "default") {
          Notification.requestPermission().then((permission) => {
            if (permission === "granted") showNotification();
          });
        }
      }

      if (isSoundEnabled) {
        const notificationSound = new Audio("/sounds/notification.mp3");
        notificationSound.currentTime = 0;
        notificationSound.play().catch((e) => console.log("Audio play failed:", e));
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  subscribeToContacts: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    const handleContactAdded = (contact) => {
      if (!contact?._id) return;

      set((state) => {
        if (state.allContacts.some((existing) => existing._id === contact._id)) {
          return state;
        }
        return { allContacts: [contact, ...state.allContacts] };
      });
    };

    socket.off("contactAdded");
    socket.on("contactAdded", handleContactAdded);
  },

  unsubscribeFromContacts: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("contactAdded");
  },
}));

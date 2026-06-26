import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export const useWebsiteStore = create((set, get) => ({
  websites: [],
  selectedWebsite: null,
  isLoading: false,
  isSaving: false,
  hasLoaded: false,

  loadWebsites: async () => {
    if (get().hasLoaded || get().isLoading) return;

    set({ isLoading: true });
    try {
      const response = await axiosInstance.get("/websites");
      set({ websites: response.data, hasLoaded: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load saved websites");
    } finally {
      set({ isLoading: false });
    }
  },

  addWebsite: async (websiteData) => {
    set({ isSaving: true });
    try {
      const response = await axiosInstance.post("/websites", websiteData);
      set((state) => ({ websites: [...state.websites, response.data] }));
      toast.success("Website saved");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save website");
      throw error;
    } finally {
      set({ isSaving: false });
    }
  },

  deleteWebsite: async (websiteId) => {
    try {
      await axiosInstance.delete(`/websites/${websiteId}`);
      set((state) => ({
        websites: state.websites.filter((website) => website._id !== websiteId),
        selectedWebsite:
          state.selectedWebsite?._id === websiteId ? null : state.selectedWebsite,
      }));
      toast.success("Website removed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove website");
    }
  },

  updateWebsiteViewMode: async (websiteId, viewMode) => {
    try {
      const response = await axiosInstance.patch(`/websites/${websiteId}/view-mode`, {
        viewMode,
      });
      set((state) => ({
        websites: state.websites.map((website) =>
          website._id === websiteId ? response.data : website
        ),
        selectedWebsite:
          state.selectedWebsite?._id === websiteId
            ? response.data
            : state.selectedWebsite,
      }));
      toast.success(
        viewMode === "assistant" ? "Assistant UI selected" : "Original website selected"
      );
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update website mode");
      throw error;
    }
  },

  openWebsite: (website) => set({ selectedWebsite: website }),
  closeWebsite: () => set({ selectedWebsite: null }),
}));

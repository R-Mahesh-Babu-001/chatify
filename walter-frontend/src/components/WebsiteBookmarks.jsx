import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BadgeCheck, ExternalLink, Globe2, Loader2, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { useWebsiteStore } from "../store/useWebsiteStore";
import { useChatStore } from "../store/useChatStore";

const TRULY_PDF_DISPLAY_NAME = "Truly-PDF";
const TRULY_PDF_LOGO = "/truly-pdf-logo.svg";

const isTrulyPdfWebsite = (url) => {
  try {
    return (
      new URL(url).hostname.toLowerCase().replace(/^www\./, "") ===
      "truly-pdf.onrender.com"
    );
  } catch {
    return false;
  }
};

const getWebsiteDisplayName = (website) =>
  isTrulyPdfWebsite(website.url) ? TRULY_PDF_DISPLAY_NAME : website.name;

const WebsiteIcon = ({ website, className = "w-9 h-9 rounded-lg" }) => {
  const isTrulyPdf = isTrulyPdfWebsite(website.url);

  if (isTrulyPdf) {
    return (
      <img
        src={TRULY_PDF_LOGO}
        alt=""
        className={`${className} object-cover shadow-[0_0_0_1px_rgba(229,9,20,0.28)]`}
      />
    );
  }

  return (
    <div className={`${className} bg-red-950/40 text-red-400 flex items-center justify-center font-semibold uppercase`}>
      {website.name.slice(0, 1)}
    </div>
  );
};

const VerifiedBadge = () => (
  <span
    className="inline-flex items-center justify-center"
    title="Verified Truly-PDF"
    aria-label="Verified Truly-PDF"
  >
    <BadgeCheck className="w-4 h-4 fill-[#e50914] text-white" strokeWidth={2.6} />
  </span>
);

function WebsiteBookmarks() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    viewMode: "website",
  });
  const {
    websites,
    isLoading,
    isSaving,
    loadWebsites,
    addWebsite,
    deleteWebsite,
    updateWebsiteViewMode,
    openWebsite,
  } = useWebsiteStore();
  const openInsideChatify = (website) => {
    useChatStore.getState().setSelectedUser(null);
    openWebsite(website);
  };

  let isTrulyPdfUrl = false;
  try {
    const candidateUrl = /^https?:\/\//i.test(formData.url)
      ? formData.url
      : `https://${formData.url}`;
    isTrulyPdfUrl = isTrulyPdfWebsite(candidateUrl);
  } catch {
    isTrulyPdfUrl = false;
  }

  useEffect(() => {
    loadWebsites();
  }, [loadWebsites]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.name.trim() || !formData.url.trim()) {
      toast.error("Enter a website name and link");
      return;
    }

    try {
      const website = await addWebsite(formData);
      setFormData({ name: "", url: "", viewMode: "website" });
      setIsOpen(false);
      openInsideChatify(website);
    } catch {
      return;
    }
  };

  const handleDelete = async (websiteId) => {
    await deleteWebsite(websiteId);
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const modal = isOpen
    ? createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="website-bookmarks-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <div className="w-full max-w-sm max-h-[calc(100dvh-2rem)] overflow-hidden rounded-2xl border border-[#252525] bg-[#0c0c0c] shadow-2xl flex flex-col">
            <div className="h-14 px-5 border-b border-[#1f1f1f] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-red-500" />
                <h2 id="website-bookmarks-title" className="text-white font-semibold">
                  Website bookmarks
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg text-[#8d8d8d] hover:text-white hover:bg-[#1a1a1a] flex items-center justify-center"
                aria-label="Close website bookmarks"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto custom-scrollbar">
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label htmlFor="website-name" className="block text-xs text-[#a0a0a0] mb-2">
                    Website name
                  </label>
                  <input
                    id="website-name"
                    type="text"
                    maxLength={40}
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="YouTube"
                    autoFocus
                    className="w-full h-11 rounded-lg bg-[#131313] border border-[#252525] px-3 text-sm text-white placeholder-[#666] focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                {isTrulyPdfUrl && (
                  <div>
                    <p className="block text-xs text-[#a0a0a0] mb-2">Open Truly PDF as</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((current) => ({
                            ...current,
                            viewMode: "assistant",
                          }))
                        }
                        className={`min-h-16 rounded-xl border px-3 text-left transition-colors ${
                          formData.viewMode === "assistant"
                            ? "border-red-600 bg-red-950/30"
                            : "border-[#252525] bg-[#131313] hover:border-[#3a3a3a]"
                        }`}
                      >
                        <span className="block text-sm font-semibold text-white">
                          Assistant UI
                        </span>
                        <span className="block text-[11px] text-[#808080] mt-1">
                          Custom dashboard and tool selector
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((current) => ({
                            ...current,
                            viewMode: "website",
                          }))
                        }
                        className={`min-h-16 rounded-xl border px-3 text-left transition-colors ${
                          formData.viewMode === "website"
                            ? "border-red-600 bg-red-950/30"
                            : "border-[#252525] bg-[#131313] hover:border-[#3a3a3a]"
                        }`}
                      >
                        <span className="block text-sm font-semibold text-white">
                          Original site
                        </span>
                        <span className="block text-[11px] text-[#808080] mt-1">
                          Display the existing website directly
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="website-url" className="block text-xs text-[#a0a0a0] mb-2">
                    Website link
                  </label>
                  <input
                    id="website-url"
                    type="text"
                    value={formData.url}
                    onChange={(event) => {
                      const url = event.target.value;
                      let shouldUseAssistant = false;
                      try {
                        const candidateUrl = /^https?:\/\//i.test(url)
                          ? url
                          : `https://${url}`;
                        shouldUseAssistant = isTrulyPdfWebsite(candidateUrl);
                      } catch {
                        shouldUseAssistant = false;
                      }
                      setFormData((current) => ({
                        ...current,
                        url,
                        viewMode: shouldUseAssistant ? "assistant" : "website",
                      }));
                    }}
                    placeholder="youtube.com"
                    className="w-full h-11 rounded-lg bg-[#131313] border border-[#252525] px-3 text-sm text-white placeholder-[#666] focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full h-11 rounded-lg bg-[#e50914] hover:bg-[#ff1f2b] text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Save website
                </button>
              </form>

              <div className="border-t border-[#1f1f1f] px-5 py-4">
                <p className="text-xs uppercase tracking-wide text-[#777] mb-3">Saved websites</p>
                <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2">
                  {isLoading ? (
                    <div className="py-5 flex justify-center">
                      <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                    </div>
                  ) : websites.length === 0 ? (
                    <p className="text-sm text-[#777] py-3">No websites saved yet.</p>
                  ) : (
                    websites.map((website) => {
                      const isTrulyPdf = isTrulyPdfWebsite(website.url);
                      const displayName = getWebsiteDisplayName(website);

                      return (
                        <div
                          key={website._id}
                          className="flex items-center gap-3 rounded-lg bg-[#131313] border border-[#1f1f1f] p-3"
                        >
                          <WebsiteIcon website={website} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className="text-sm text-white truncate">{displayName}</p>
                            {isTrulyPdf && <VerifiedBadge />}
                          </div>
                          <p className="text-xs text-[#777] truncate">{website.url}</p>
                          {isTrulyPdf && (
                            <div className="flex items-center gap-1 mt-2">
                              <button
                                type="button"
                                onClick={() =>
                                  updateWebsiteViewMode(website._id, "assistant")
                                }
                                className={`px-2 py-1 rounded-md text-[10px] border ${
                                  website.viewMode === "assistant"
                                    ? "border-red-600 bg-red-950/30 text-red-300"
                                    : "border-[#2a2a2a] text-[#777] hover:text-white"
                                }`}
                              >
                                Assistant
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateWebsiteViewMode(website._id, "website")
                                }
                                className={`px-2 py-1 rounded-md text-[10px] border ${
                                  website.viewMode !== "assistant"
                                    ? "border-red-600 bg-red-950/30 text-red-300"
                                    : "border-[#2a2a2a] text-[#777] hover:text-white"
                                }`}
                              >
                                Website
                              </button>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            openInsideChatify(website);
                            setIsOpen(false);
                          }}
                          className="w-8 h-8 rounded-lg text-[#999] hover:text-white hover:bg-[#202020] flex items-center justify-center"
                          aria-label={`Open ${displayName}`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        {!isTrulyPdf && (
                          <button
                            type="button"
                            onClick={() => handleDelete(website._id)}
                            className="w-8 h-8 rounded-lg text-[#999] hover:text-red-400 hover:bg-red-950/30 flex items-center justify-center"
                            aria-label={`Delete ${displayName}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div className="hidden md:flex flex-col items-center gap-2 mt-4">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-11 h-11 rounded-xl border border-dashed border-[#353535] text-[#aebac1] hover:text-white hover:border-red-600 hover:bg-red-950/30 flex items-center justify-center transition-colors"
          aria-label="Add website"
          title="Add website"
        >
          <Plus className="w-5 h-5" />
        </button>

        <div className="max-h-[32vh] overflow-y-auto custom-scrollbar flex flex-col gap-2 px-1">
          {websites.map((website) => {
            const displayName = getWebsiteDisplayName(website);

            return (
              <button
                type="button"
                key={website._id}
                onClick={() => openInsideChatify(website)}
                className="w-11 h-11 rounded-xl bg-[#131313] border border-[#1f1f1f] text-white hover:border-red-700 hover:bg-[#1a1a1a] flex items-center justify-center text-sm font-semibold uppercase transition-colors overflow-hidden"
                aria-label={`Open ${displayName}`}
                title={displayName}
              >
                <WebsiteIcon website={website} className="w-full h-full rounded-xl" />
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="md:hidden p-3 rounded-xl text-[#aebac1] hover:text-white hover:bg-[#141414]"
        aria-label="Add website"
      >
        <Plus className="w-6 h-6" />
      </button>

      {modal}
    </>
  );
}

export default WebsiteBookmarks;

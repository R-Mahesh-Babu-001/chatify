import { useState } from "react";
import { ExternalLink, Globe2, Loader2, RefreshCw, X } from "lucide-react";
import { useWebsiteStore } from "../store/useWebsiteStore";
import TrulyPdfAssistantWorkspace from "./TrulyPdfAssistantWorkspace";

function EmbeddedWebsiteWorkspace() {
  const { selectedWebsite, closeWebsite } = useWebsiteStore();
  const [frameKey, setFrameKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  if (!selectedWebsite) return null;

  let hostname = "";
  try {
    hostname = new URL(selectedWebsite.url).hostname.toLowerCase();
  } catch {
    hostname = "";
  }

  const normalizedHostname = hostname.replace(/^www\./, "");

  if (
    normalizedHostname === "truly-pdf.onrender.com" &&
    selectedWebsite.viewMode === "assistant"
  ) {
    return <TrulyPdfAssistantWorkspace />;
  }

  const refreshWebsite = () => {
    setIsLoading(true);
    setFrameKey((current) => current + 1);
  };

  return (
    <div className="h-full min-h-0 flex flex-col bg-[#080808]">
      <header className="h-16 shrink-0 px-4 md:px-5 border-b border-[#1f1f1f] bg-[#0f0f0f] flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-950/40 text-red-400 flex items-center justify-center font-semibold uppercase">
          {selectedWebsite.name?.slice(0, 1) || <Globe2 className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-semibold truncate">{selectedWebsite.name}</h2>
          <p className="text-xs text-[#777] truncate">{selectedWebsite.url}</p>
        </div>
        <button
          type="button"
          onClick={refreshWebsite}
          className="w-9 h-9 rounded-lg text-[#999] hover:text-white hover:bg-[#1b1b1b] flex items-center justify-center"
          aria-label="Refresh website"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <a
          href={selectedWebsite.url}
          target="_blank"
          rel="noreferrer"
          className="w-9 h-9 rounded-lg text-[#999] hover:text-white hover:bg-[#1b1b1b] flex items-center justify-center"
          aria-label={`Open ${selectedWebsite.name} in a new tab`}
          title="Open in new tab"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
        <button
          type="button"
          onClick={closeWebsite}
          className="w-9 h-9 rounded-lg text-[#999] hover:text-red-400 hover:bg-red-950/30 flex items-center justify-center"
          aria-label="Close website"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      <div className="relative flex-1 min-h-0 bg-white">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-[#0b0b0b] flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            <p className="text-sm text-[#999]">Opening {selectedWebsite.name}…</p>
          </div>
        )}
        <iframe
          key={frameKey}
          src={selectedWebsite.url}
          title={selectedWebsite.name}
          onLoad={() => setIsLoading(false)}
          className="w-full h-full border-0 bg-white"
          allow="clipboard-read; clipboard-write; camera; microphone; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}

export default EmbeddedWebsiteWorkspace;

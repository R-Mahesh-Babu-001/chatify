import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight,
  BadgeCheck,
  Combine,
  ExternalLink,
  FileArchive,
  FileCheck2,
  FileOutput,
  Files,
  Gauge,
  Image,
  LayoutGrid,
  Languages,
  Lock,
  PenTool,
  RotateCw,
  Scissors,
  ShieldCheck,
  Sparkles,
  Stamp,
  Unlock,
  X,
} from "lucide-react";
import { useWebsiteStore } from "../store/useWebsiteStore";
import MessageInput from "./MessageInput";
import {
  deletePdfResult,
  getPdfResults,
  savePdfResult,
} from "../lib/pdfResultStorage";
import toast from "react-hot-toast";

const CATEGORY_TABS = [
  { id: "all", label: "All PDF Tools", icon: LayoutGrid },
  { id: "convert", label: "Convert", icon: ArrowLeftRight },
  { id: "organize", label: "Organize", icon: Files },
  { id: "optimize", label: "Optimize", icon: Gauge },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "esign", label: "eSign", icon: PenTool },
];

const PDF_TOOLS = [
  {
    id: "merge-pdf",
    name: "Merge PDF",
    description: "Combine multiple PDFs into one document.",
    category: "organize",
    path: "/tool/merge-pdf",
    icon: Combine,
    keywords: ["combine", "join"],
  },
  {
    id: "split-pdf",
    name: "Split PDF",
    description: "Separate pages into independent PDF files.",
    category: "organize",
    path: "/tool/split-pdf",
    icon: Scissors,
    keywords: ["separate", "extract pages"],
  },
  {
    id: "compress-pdf",
    name: "Compress PDF",
    description: "Reduce PDF file size while preserving quality.",
    category: "optimize",
    path: "/tool/compress-pdf",
    icon: FileArchive,
    keywords: ["reduce", "smaller", "optimize"],
  },
  {
    id: "rotate-pdf",
    name: "Rotate PDF",
    description: "Rotate PDF pages into the correct orientation.",
    category: "organize",
    path: "/tool/rotate-pdf",
    icon: RotateCw,
    keywords: ["turn pages"],
  },
  {
    id: "watermark-pdf",
    name: "Watermark PDF",
    description: "Add a text or image watermark to a PDF.",
    category: "security",
    path: "/tool/watermark-pdf",
    icon: Stamp,
    keywords: ["stamp", "brand"],
  },
  {
    id: "protect-pdf",
    name: "Protect PDF",
    description: "Add password protection to a PDF.",
    category: "security",
    path: "/tool/protect-pdf",
    icon: Lock,
    keywords: ["password", "secure"],
  },
  {
    id: "unlock-pdf",
    name: "Unlock PDF",
    description: "Remove password protection from an accessible PDF.",
    category: "security",
    path: "/tool/unlock-pdf",
    icon: Unlock,
    keywords: ["remove password"],
  },
  {
    id: "translate-pdf",
    name: "Translate PDF",
    description: "Translate PDF text into another language.",
    category: "convert",
    path: "/tool/translate-pdf",
    icon: Languages,
    keywords: ["language"],
  },
  {
    id: "pdf-to-word",
    name: "PDF to Word",
    description: "Convert PDF content into an editable Word document.",
    category: "convert",
    path: "/tool/pdf-to-word",
    icon: FileOutput,
    keywords: ["docx", "document"],
  },
  {
    id: "pdf-to-powerpoint",
    name: "PDF to PowerPoint",
    description: "Turn PDF files into editable PowerPoint slides.",
    category: "convert",
    path: "/tool/pdf-to-powerpoint",
    icon: FileOutput,
    keywords: ["ppt", "pptx", "slides"],
  },
  {
    id: "pdf-to-excel",
    name: "PDF to Excel",
    description: "Extract PDF content into an Excel workbook.",
    category: "convert",
    path: "/tool/pdf-to-excel",
    icon: FileOutput,
    keywords: ["xls", "xlsx", "spreadsheet"],
  },
  {
    id: "word-to-pdf",
    name: "Word to PDF",
    description: "Convert Word documents into PDF files.",
    category: "convert",
    path: "/tool/word-to-pdf",
    icon: FileCheck2,
    keywords: ["docx"],
  },
  {
    id: "powerpoint-to-pdf",
    name: "PowerPoint to PDF",
    description: "Convert PowerPoint presentations into PDF files.",
    category: "convert",
    path: "/tool/powerpoint-to-pdf",
    icon: FileCheck2,
    keywords: ["ppt", "pptx", "slides"],
  },
  {
    id: "excel-to-pdf",
    name: "Excel to PDF",
    description: "Convert Excel spreadsheets into PDF files.",
    category: "convert",
    path: "/tool/excel-to-pdf",
    icon: FileCheck2,
    keywords: ["xls", "xlsx", "spreadsheet"],
  },
  {
    id: "edit-pdf",
    name: "Edit PDF",
    description: "Add text, images, shapes, and annotations to a PDF.",
    category: "organize",
    path: "/tool/edit-pdf",
    icon: PenTool,
    keywords: ["annotate", "modify"],
  },
  {
    id: "pdf-to-jpg",
    name: "PDF to JPG",
    description: "Convert PDF pages into JPG images.",
    category: "convert",
    path: "/tool/pdf-to-jpg",
    icon: Image,
    keywords: ["image", "photo"],
  },
  {
    id: "jpg-to-pdf",
    name: "JPG to PDF",
    description: "Combine JPG images into a PDF document.",
    category: "convert",
    path: "/tool/jpg-to-pdf",
    icon: Image,
    keywords: ["image", "photo"],
  },
  {
    id: "esign",
    name: "Sign PDF",
    description: "Open Truly PDF's electronic signature workspace.",
    category: "esign",
    path: "/tool/sign-pdf",
    icon: PenTool,
    keywords: ["signature", "sign"],
  },
  {
    id: "html-to-pdf",
    name: "HTML to PDF",
    description: "Convert a webpage URL into a PDF document.",
    category: "convert",
    path: "/tool/html-to-pdf",
    icon: FileCheck2,
    keywords: ["webpage", "website", "url"],
  },
  {
    id: "organize-pdf",
    name: "Organize PDF",
    description: "Sort, delete, and add pages inside a PDF.",
    category: "organize",
    path: "/tool/organize-pdf",
    icon: Files,
    keywords: ["reorder", "pages"],
  },
  {
    id: "pdf-to-pdfa",
    name: "PDF to PDF/A",
    description: "Convert a PDF into an archival PDF/A document.",
    category: "optimize",
    path: "/tool/pdf-to-pdfa",
    icon: FileArchive,
    keywords: ["archive", "archival"],
  },
  {
    id: "repair-pdf",
    name: "Repair PDF",
    description: "Repair damaged PDF files and recover readable data.",
    category: "optimize",
    path: "/tool/repair-pdf",
    icon: FileCheck2,
    keywords: ["fix", "recover"],
  },
  {
    id: "page-numbers",
    name: "Page numbers",
    description: "Add page numbers with configurable position and style.",
    category: "organize",
    path: "/tool/page-numbers",
    icon: FileOutput,
    keywords: ["number pages", "pagination"],
  },
  {
    id: "scan-to-pdf",
    name: "Scan to PDF",
    description: "Capture document scans and export them as a PDF.",
    category: "convert",
    path: "/tool/scan-to-pdf",
    icon: Image,
    keywords: ["camera", "scan"],
  },
  {
    id: "ocr-pdf",
    name: "OCR PDF",
    description: "Make scanned PDFs searchable and selectable.",
    category: "optimize",
    path: "/tool/ocr-pdf",
    icon: FileCheck2,
    keywords: ["recognize text", "scanned"],
  },
  {
    id: "compare-pdf",
    name: "Compare PDF",
    description: "Compare two PDF documents and identify changes.",
    category: "organize",
    path: "/tool/compare-pdf",
    icon: ArrowLeftRight,
    keywords: ["difference", "changes"],
  },
  {
    id: "redact-pdf",
    name: "Redact PDF",
    description: "Permanently remove sensitive information from a PDF.",
    category: "security",
    path: "/tool/redact-pdf",
    icon: ShieldCheck,
    keywords: ["hide", "remove sensitive"],
  },
  {
    id: "crop-pdf",
    name: "Crop PDF",
    description: "Crop page margins or selected areas in a PDF.",
    category: "organize",
    path: "/tool/crop-pdf",
    icon: Scissors,
    keywords: ["trim", "margins"],
  },
  {
    id: "ai-summarizer",
    name: "AI Summarizer",
    description: "Generate concise summaries from documents and reports.",
    category: "optimize",
    path: "/tool/ai-summarizer",
    icon: Sparkles,
    keywords: ["summary", "summarize", "ai"],
  },
];

function TrulyPdfAssistantWorkspace() {
  const { selectedWebsite, closeWebsite } = useWebsiteStore();
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedTool, setSelectedTool] = useState(null);
  const [activeOperation, setActiveOperation] = useState(null);
  const [recentResults, setRecentResults] = useState([]);
  const [isLoadingResults, setIsLoadingResults] = useState(true);
  const toolWindowRef = useRef(null);

  const visibleTools = useMemo(
    () =>
      activeCategory === "all"
        ? PDF_TOOLS.slice(0, 7)
        : PDF_TOOLS.filter((tool) => tool.category === activeCategory),
    [activeCategory]
  );

  const loadRecentResults = useCallback(async ({ showError = false } = {}) => {
    try {
      const results = await getPdfResults();
      setRecentResults(results);
    } catch {
      if (showError) toast.error("Could not load saved PDF results");
    } finally {
      setIsLoadingResults(false);
    }
  }, []);

  useEffect(() => {
    loadRecentResults({ showError: true });

    const refreshResults = () => {
      if (!document.hidden) {
        loadRecentResults();
      }
    };

    window.addEventListener("focus", refreshResults);
    document.addEventListener("visibilitychange", refreshResults);

    return () => {
      window.removeEventListener("focus", refreshResults);
      document.removeEventListener("visibilitychange", refreshResults);
    };
  }, [loadRecentResults]);

  useEffect(() => {
    const onTrulyPdfMessage = async (event) => {
      const sourceHostname = (() => {
        try {
          return new URL(event.origin).hostname.toLowerCase().replace(/^www\./, "");
        } catch {
          return "";
        }
      })();

      const isLocalTrulyPdf =
        event.origin === "http://127.0.0.1:5174" ||
        event.origin === "http://localhost:5174";
      if (sourceHostname !== "truly-pdf.onrender.com" && !isLocalTrulyPdf) return;
      if (!activeOperation || event.data?.operationId !== activeOperation.id) return;

      if (event.data?.type === "chatify:pdf-ready") {
        return;
      }

      if (event.data?.type !== "chatify:pdf-result" || !(event.data?.blob instanceof Blob)) {
        return;
      }

      const result = {
        ...activeOperation,
        toolId: event.data.toolSlug || activeOperation.toolId,
        status: "completed",
        completedAt: Date.now(),
        createdAt: Date.now(),
        fileName: event.data.filename || "truly-pdf-result",
        fileSize: event.data.fileSize || event.data.blob.size,
        fileType: event.data.fileType || event.data.blob.type || "application/octet-stream",
        blob: event.data.blob,
      };

      try {
        await savePdfResult(result);
        await loadRecentResults();
        setActiveOperation(null);
        toast.success(`${result.fileName} saved automatically in Chatify`);
      } catch {
        toast.error("Could not store the completed Truly PDF file");
      }
    };

    window.addEventListener("message", onTrulyPdfMessage);
    return () => window.removeEventListener("message", onTrulyPdfMessage);
  }, [activeOperation, loadRecentResults]);

  if (!selectedWebsite) return null;

  const baseUrl =
    import.meta.env.VITE_TRULY_PDF_URL?.trim().replace(/\/+$/, "") ||
    "https://truly-pdf.onrender.com";

  const chooseTool = (tool) => {
    setSelectedTool(tool);
  };

  const launchTool = (tool = selectedTool) => {
    if (!tool) return;
    const operationId = crypto.randomUUID();
    const chatifyOrigin = window.location.origin;
    const toolUrl = new URL(`${baseUrl}${tool.path}`);
    toolUrl.searchParams.set("chatifyOrigin", chatifyOrigin);
    toolUrl.searchParams.set("chatifyOperationId", operationId);

    setSelectedTool(tool);
    setActiveOperation({
      id: operationId,
      toolId: tool.id,
      toolName: tool.name,
      startedAt: Date.now(),
      status: "processing",
    });
    toolWindowRef.current = window.open(toolUrl.toString(), "truly-pdf-tool");
    toast.success(`${tool.name} opened in Truly PDF`);
  };

  const downloadResult = (result) => {
    const objectUrl = URL.createObjectURL(result.blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = result.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  };

  const removeResult = async (resultId) => {
    try {
      await deletePdfResult(resultId);
      setRecentResults((current) => current.filter((result) => result.id !== resultId));
      toast.success("Saved result removed");
    } catch {
      toast.error("Could not remove saved result");
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col bg-[radial-gradient(circle_at_50%_10%,rgba(28,32,40,0.35),transparent_40%),#07090c] text-white">
      <header className="h-16 px-4 md:px-6 border-b border-[#191d23] flex items-center gap-3 shrink-0">
        <img
          src="/truly-pdf-logo.svg"
          alt=""
          className="w-9 h-9 rounded-xl object-cover shadow-[0_0_0_1px_rgba(229,9,20,0.35)]"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <h1 className="text-base font-semibold leading-tight truncate">Truly-PDF</h1>
            <BadgeCheck
              className="w-4 h-4 shrink-0 fill-[#e50914] text-white"
              strokeWidth={2.6}
              aria-label="Verified Truly-PDF"
            />
          </div>
          <p className="text-xs text-[#747b86] leading-tight mt-1">
            Chat-only mode with dropdown feature trays
          </p>
        </div>
        <button
          type="button"
          onClick={closeWebsite}
          className="w-8 h-8 rounded-lg text-[#828995] hover:text-white hover:bg-[#171a20] flex items-center justify-center"
          aria-label="Close Truly PDF Assistant"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-5 md:px-7 py-5">
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
          {CATEGORY_TABS.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  setActiveCategory(category.id);
                  setSelectedTool(null);
                }}
                className={`relative h-10 px-4 rounded-xl border flex items-center gap-2 whitespace-nowrap text-sm transition-colors ${
                  isActive
                    ? "bg-white text-[#16191e] border-white"
                    : "bg-[#11141a] text-[#d0d4db] border-[#1d2229] hover:bg-[#171b22]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {category.label}
                {isActive && (
                  <span className="absolute -bottom-[2px] left-4 right-4 h-[3px] rounded-full bg-red-500" />
                )}
              </button>
            );
          })}
        </div>

        <section className="mt-5 rounded-2xl border border-[#1d2229] bg-[#0d1015]/90 p-5">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[#777f8b] uppercase mb-4">
            {activeCategory === "all"
              ? "All PDF Tools Features"
              : `${CATEGORY_TABS.find((tab) => tab.id === activeCategory)?.label} Features`}
          </p>
          <div className="flex flex-wrap gap-2">
            {visibleTools.map((tool) => {
              const Icon = tool.icon;
              const isSelected = selectedTool?.id === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => chooseTool(tool)}
                  className={`min-h-11 px-4 rounded-xl border flex items-center gap-2 text-sm transition-colors ${
                    isSelected
                      ? "border-red-600 bg-red-950/25 text-white"
                      : "border-[#252a31] bg-[#101318] text-[#d7dbe1] hover:border-[#3a414b] hover:bg-[#15191f]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tool.name}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-4 min-h-[88px] rounded-xl border border-dashed border-[#2b3038] bg-[#0b0e12]/80 p-5 flex items-center gap-4">
          <div className="w-10 h-10 shrink-0 rounded-full bg-[#15191f] border border-[#242a32] flex items-center justify-center text-[#8c95a1]">
            {selectedTool ? (
              <selectedTool.icon className="w-5 h-5 text-red-500" />
            ) : (
              <FileOutput className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold">
              {selectedTool ? selectedTool.name : "No feature selected yet"}
            </h2>
            <p className="text-xs text-[#8a929e] mt-1">
              {selectedTool
                ? selectedTool.description
                : "Select a tool from the list above to get started."}
            </p>
          </div>
          {selectedTool && (
            <button
              type="button"
              onClick={() => launchTool()}
              className="h-10 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold flex items-center gap-2"
            >
              Open tool
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </section>

        <section className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[#777f8b] uppercase">
              File history
            </p>
            <button
              type="button"
              onClick={() => loadRecentResults()}
              className="text-xs text-[#8b929c] hover:text-white"
            >
              Refresh
            </button>
          </div>
          {isLoadingResults ? (
            <div className="rounded-xl border border-[#20252c] bg-[#0d1015]/90 p-5 text-sm text-[#8a929e]">
              Loading saved files...
            </div>
          ) : recentResults.length === 0 ? (
            <div className="rounded-xl border border-[#20252c] bg-[#0d1015]/90 p-5">
              <h3 className="text-sm font-semibold">No downloaded files yet</h3>
              <p className="text-xs text-[#8a929e] mt-1">
                Open a PDF tool, finish the operation, then download the result. Saved files will
                appear here automatically.
              </p>
            </div>
          ) : (
            recentResults.map((result) => (
              <article
                key={result.id}
                className="rounded-xl border border-[#20252c] bg-[#0d1015]/90 p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-14 shrink-0 rounded-xl border border-red-900/60 bg-red-950/20 text-red-400 flex items-center justify-center text-xs font-bold">
                    PDF
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold truncate">{result.fileName}</h3>
                      <span className="px-2 py-0.5 rounded-full border border-emerald-800 bg-emerald-950/20 text-[10px] text-emerald-400">
                        Completed
                      </span>
                    </div>
                    <p className="text-xs text-[#7f8792] mt-1">
                      {result.toolName} · {(result.fileSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadResult(result)}
                    className="h-10 px-4 rounded-xl border border-[#2a3038] hover:bg-[#171b21] text-sm font-semibold"
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={() => removeResult(result.id)}
                    className="w-10 h-10 rounded-xl border border-[#2a3038] text-[#8b929c] hover:text-red-400 hover:bg-red-950/20 flex items-center justify-center"
                    aria-label={`Remove ${result.fileName}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </div>

      <MessageInput />
    </div>
  );
}

export default TrulyPdfAssistantWorkspace;

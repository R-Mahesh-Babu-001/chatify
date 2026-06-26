import Website from "../models/Website.js";

const isTrulyPdfHostname = (hostname) =>
  hostname.toLowerCase().replace(/^www\./, "") === "truly-pdf.onrender.com";

const normalizeWebsiteUrl = (value) => {
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const parsedUrl = new URL(candidate);

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Unsupported URL protocol");
  }

  return parsedUrl.toString();
};

export const getWebsites = async (req, res) => {
  try {
    const websites = await Website.find({ userId: req.user._id }).sort({ createdAt: 1 });
    res.status(200).json(websites);
  } catch (error) {
    console.error("Error loading websites:", error);
    res.status(500).json({ message: "Failed to load websites" });
  }
};

export const createWebsite = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const rawUrl = req.body.url?.trim();
    const requestedViewMode = req.body.viewMode;

    if (!name || !rawUrl) {
      return res.status(400).json({ message: "Website name and link are required" });
    }

    let url;
    try {
      url = normalizeWebsiteUrl(rawUrl);
    } catch {
      return res.status(400).json({ message: "Enter a valid website link" });
    }

    const isTrulyPdf = isTrulyPdfHostname(new URL(url).hostname);
    const viewMode =
      isTrulyPdf && requestedViewMode === "assistant" ? "assistant" : "website";

    const website = await Website.create({
      userId: req.user._id,
      name,
      url,
      viewMode,
    });

    res.status(201).json(website);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "This website is already saved" });
    }

    console.error("Error saving website:", error);
    res.status(500).json({ message: "Failed to save website" });
  }
};

export const deleteWebsite = async (req, res) => {
  try {
    const website = await Website.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!website) {
      return res.status(404).json({ message: "Website not found" });
    }

    res.status(200).json({ message: "Website removed" });
  } catch (error) {
    console.error("Error deleting website:", error);
    res.status(500).json({ message: "Failed to remove website" });
  }
};

export const updateWebsiteViewMode = async (req, res) => {
  try {
    const { viewMode } = req.body;
    if (!["assistant", "website"].includes(viewMode)) {
      return res.status(400).json({ message: "Invalid website view mode" });
    }

    const website = await Website.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!website) {
      return res.status(404).json({ message: "Website not found" });
    }

    const isTrulyPdf = isTrulyPdfHostname(new URL(website.url).hostname);
    if (!isTrulyPdf && viewMode === "assistant") {
      return res.status(400).json({
        message: "Assistant UI is currently available only for Truly PDF",
      });
    }

    website.viewMode = viewMode;
    await website.save();

    res.status(200).json(website);
  } catch (error) {
    console.error("Error updating website view mode:", error);
    res.status(500).json({ message: "Failed to update website view mode" });
  }
};

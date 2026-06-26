import express from "express";
import {
  createWebsite,
  deleteWebsite,
  getWebsites,
  updateWebsiteViewMode,
} from "../controllers/website.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);
router.get("/", getWebsites);
router.post("/", createWebsite);
router.patch("/:id/view-mode", updateWebsiteViewMode);
router.delete("/:id", deleteWebsite);

export default router;

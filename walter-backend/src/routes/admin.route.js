import express from "express";
import { deleteUserAccount } from "../controllers/admin.controller.js";
import { requireAdmin } from "../middleware/admin.middleware.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();

router.use(arcjetProtection, protectRoute, requireAdmin);

router.delete("/users/:id", deleteUserAccount);

export default router;

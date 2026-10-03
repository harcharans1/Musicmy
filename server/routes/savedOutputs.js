import { Router } from "express";

import {
  saveOutput,
  getSavedOutputs,
  deleteSavedOutput,
} from "../controllers/savedOutputController.js";

import { protect } from "../middleware/auth.js";

const router = Router();

router.post("/", protect, saveOutput);
router.get("/", protect, getSavedOutputs);
router.delete("/:id", protect, deleteSavedOutput);

export default router;
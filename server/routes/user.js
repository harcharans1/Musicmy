import { Router } from "express";

import { protect } from "../middleware/auth.js";

import {
  profile,
  dashboard,
  history,
  favorites,
  usage,
} from "../controllers/userController.js";

const router = Router();

router.get(
  "/profile",
  protect,
  profile
);

router.get(
  "/dashboard",
  protect,
  dashboard
);

router.get(
  "/history",
  protect,
  history
);

router.get(
  "/favorites",
  protect,
  favorites
);

router.get(
  "/usage",
  protect,
  usage
);

router.put(
  "/profile",
  protect,
  (req, res) => {
    res.json({
      message:
        "Profile update endpoint ready",
    });
  }
);

export default router;
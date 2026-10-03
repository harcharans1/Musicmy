import { Router } from "express";

import { protect } from "../middleware/auth.js";

import {
  profile,
  dashboard,
  history,
  deleteHistory,
  favorites,
  addFavorite,
  removeFavorite,
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

router.delete(
    "/history/:id",
    protect,
    deleteHistory
);

router.get(
  "/favorites",
  protect,
  favorites
);

router.post(
  "/favorites",
  protect,
  addFavorite
);

router.delete(
  "/favorites/:id",
  protect,
  removeFavorite
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
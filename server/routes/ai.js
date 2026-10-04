import { Router } from "express";

import {
  generate,
  image,
  summarize,
  translate,
} from "../controllers/aiController.js";

import { protect } from "../middleware/auth.js";

import {
  premiumTool,
  requirePro,
} from "../middleware/premium.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| General AI Generation
|--------------------------------------------------------------------------
|
| premiumTool checks req.body.slug.
|
| Premium:
| - code-generator
| - code-explainer
| - resume-builder
|
*/

router.post(
  "/generate",
  protect,
  premiumTool,
  generate
);

/*
|--------------------------------------------------------------------------
| AI Image Generator
|--------------------------------------------------------------------------
|
| Always Pro.
|
*/

router.post(
  "/image",
  protect,
  requirePro,
  image
);

/*
|--------------------------------------------------------------------------
| Free AI Tools
|--------------------------------------------------------------------------
*/

router.post(
  "/summarize",
  protect,
  summarize
);

router.post(
  "/translate",
  protect,
  translate
);

export default router;
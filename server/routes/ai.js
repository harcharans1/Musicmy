import { Router } from "express";
import multer from "multer";

import {
  generate,
  image,
  summarize,
  translate,
  pdfSummarize,
} from "../controllers/aiController.js";

import { protect } from "../middleware/auth.js";

import {
  premiumTool,
  requirePro,
} from "../middleware/premium.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(
        new Error("Only PDF files are allowed.")
      );
    }

    cb(null, true);
  },
});

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

router.post(
  "/pdf-summarize",
  protect,
  upload.single("file"),
  pdfSummarize
);

export default router;
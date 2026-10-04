import { Router } from "express";

import {
  register,
  login,
  me,
  logout,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

import { protect } from "../middleware/auth.js";

const r = Router();

r.post("/register", register);
r.post("/login", login);
r.post("/logout", logout);
r.get("/me", protect, me);

r.post("/forgot-password", forgotPassword);
r.post("/reset-password", resetPassword);

export default r;
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../config/db.js";

const safeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  plan: user.plan,
  credits: user.credits,
});

const createToken = (user) =>
  jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { data: existing, error: findError } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (findError) throw findError;

    if (existing) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const { data: user, error } = await supabase
      .from("users")
      .insert({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: "user",
        plan: "free",
        credits: 50,
      })
      .select("id,name,email,role,plan,credits")
      .single();

    if (error) throw error;

    res.status(201).json({
      token: createToken(user),
      user: safeUser(user),
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      message: "Registration failed",
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (error) throw error;

    if (
      !user ||
      !(await bcrypt.compare(password, user.password || ""))
    ) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    res.json({
      token: createToken(user),
      user: safeUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Login failed",
    });
  }
}

export async function me(req, res) {
  res.json({
    user: safeUser(req.user),
  });
}

export const logout = (req, res) => {
  res.json({
    success: true,
  });
};
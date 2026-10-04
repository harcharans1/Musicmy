import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Resend } from "resend";
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

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;


/* =========================
   REGISTER
========================= */

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
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


/* =========================
   LOGIN
========================= */

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


/* =========================
   CURRENT USER
========================= */

export async function me(req, res) {
  res.json({
    user: safeUser(req.user),
  });
}


/* =========================
   LOGOUT
========================= */

export const logout = (req, res) => {
  res.json({
    success: true,
  });
};


/* =========================
   FORGOT PASSWORD
========================= */

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { data: user, error } = await supabase
      .from("users")
      .select("id,email,name")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error("Forgot password lookup error:", error);

      return res.status(500).json({
        message: "Unable to process password reset request",
      });
    }

    /*
      Always return the same message whether
      the email exists or not.
      This prevents account enumeration.
    */

    if (!user) {
      return res.json({
        message:
          "If an account exists with this email, a password reset link has been sent.",
      });
    }

    /* Generate secure random token */

    const rawToken = crypto.randomBytes(32).toString("hex");

    /* Store only hashed token */

    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    /* Token valid for 15 minutes */

    const expires = new Date(
      Date.now() + 15 * 60 * 1000
    ).toISOString();

    const { error: updateError } = await supabase
      .from("users")
      .update({
        reset_password_token: hashedToken,
        reset_password_expires: expires,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error(
        "Reset token update error:",
        updateError
      );

      return res.status(500).json({
        message: "Unable to create password reset request",
      });
    }

    if (!resend) {
      console.error(
        "RESEND_API_KEY is missing"
      );

      return res.status(500).json({
        message: "Email service is not configured",
      });
    }

    const resetBaseUrl =
      process.env.RESET_PASSWORD_URL ||
      "http://localhost:5173/reset-password";

    const resetUrl =
      `${resetBaseUrl}?token=${rawToken}`;

    await resend.emails.send({
      from:
        process.env.EMAIL_FROM ||
        "AIForge <onboarding@resend.dev>",

      to: user.email,

      subject: "Reset your AIForge password",

      html: `
        <div style="
          font-family:Arial,sans-serif;
          max-width:600px;
          margin:auto;
          padding:40px;
          background:#0b0d14;
          color:#ffffff;
          border-radius:20px;
        ">

          <h1 style="
            color:#a78bfa;
            margin-bottom:20px;
          ">
            AIForge
          </h1>

          <h2>
            Reset your password
          </h2>

          <p>
            Hi ${user.name || "there"},
          </p>

          <p>
            We received a request to reset your
            AIForge account password.
          </p>

          <p>
            Click the button below to create a
            new password.
          </p>

          <p>
            This link will expire in
            <strong>15 minutes</strong>.
          </p>

          <div style="margin:30px 0;">

            <a
              href="${resetUrl}"
              style="
                display:inline-block;
                padding:14px 24px;
                background:#7c3aed;
                color:#ffffff;
                text-decoration:none;
                border-radius:10px;
                font-weight:bold;
              "
            >
              Reset Password
            </a>

          </div>

          <p style="
            color:#94a3b8;
            font-size:14px;
          ">
            If you did not request this password
            reset, you can safely ignore this email.
          </p>

          <p style="
            color:#64748b;
            font-size:12px;
            margin-top:30px;
          ">
            AIForge · Secure Account Recovery
          </p>

        </div>
      `,
    });

    return res.json({
      message:
        "If an account exists with this email, a password reset link has been sent.",
    });

  } catch (error) {
    console.error(
      "Forgot password error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong. Please try again.",
    });
  }
}


/* =========================
   RESET PASSWORD
========================= */

export async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message:
          "Token and new password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters",
      });
    }

    /* Hash incoming token */

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    /* Find valid non-expired token */

    const { data: user, error } = await supabase
      .from("users")
      .select("id")
      .eq(
        "reset_password_token",
        hashedToken
      )
      .gt(
        "reset_password_expires",
        new Date().toISOString()
      )
      .maybeSingle();

    if (error) {
      console.error(
        "Reset password lookup error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to reset password",
      });
    }

    if (!user) {
      return res.status(400).json({
        message:
          "Reset link is invalid or expired",
      });
    }

    /* Hash new password */

    const hashedPassword =
      await bcrypt.hash(password, 12);

    /* Update password and invalidate token */

    const { error: updateError } =
      await supabase
        .from("users")
        .update({
          password: hashedPassword,
          reset_password_token: null,
          reset_password_expires: null,
        })
        .eq("id", user.id);

    if (updateError) {
      console.error(
        "Password update error:",
        updateError
      );

      return res.status(500).json({
        message:
          "Unable to update password",
      });
    }

    return res.json({
      success: true,
      message:
        "Password reset successfully. You can now login.",
    });

  } catch (error) {
    console.error(
      "Reset password error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong. Please try again.",
    });
  }
}
import { useState } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import { useAuth } from "./context/AuthContext";

import PublicLayout from "./layouts/PublicLayout";
import DashboardLayout from "./layouts/DashboardLayout";

import Home from "./pages/Home";
import Tools from "./pages/Tools";
import ToolWorkspace from "./pages/ToolWorkspace";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";

import PaymentPage from "./pages/PaymentPage";
import AdminPayments from "./pages/AdminPayments";

import {
  History,
  Favorites,
  Usage,
  Subscription,
  Settings,
} from "./pages/Account";

import {
  Static,
  Pricing,
  Blog,
} from "./pages/Static";

import StartupLoader from "./components/StartupLoader";


/* --------------------------------
   Protected Routes
-------------------------------- */

function Protected() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#07080d] text-white">
        Loading...
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}


/* --------------------------------
   Admin Routes
-------------------------------- */

function AdminOnly() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#07080d] text-white">
        Loading...
      </div>
    );
  }

  return user?.role === "admin" ? (
    <Outlet />
  ) : (
    <Navigate to="/dashboard" replace />
  );
}


/* --------------------------------
   App
-------------------------------- */

export default function App() {
  const [startupLoading, setStartupLoading] = useState(true);

  return (
    <>
      {/* Startup Loader */}
      {startupLoading && (
        <StartupLoader
          onDone={() => setStartupLoading(false)}
        />
      )}

      <Routes>

        {/* ================================
            PUBLIC WEBSITE
        ================================= */}

        <Route element={<PublicLayout />}>

          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/ai-tools"
            element={<Tools />}
          />

          <Route
            path="/ai-tools/:slug"
            element={<ToolWorkspace />}
          />

          <Route
            path="/pricing"
            element={<Pricing />}
          />

          <Route
            path="/blog"
            element={<Blog />}
          />

          <Route
            path="/about"
            element={
              <Static title="About AIForge" />
            }
          />

          <Route
            path="/contact"
            element={
              <Static title="Contact AIForge" />
            }
          />

          <Route
            path="/faq"
            element={
              <Static title="Frequently Asked Questions" />
            }
          />

          <Route
            path="/privacy"
            element={
              <Static title="Privacy Policy" />
            }
          />

          <Route
            path="/terms"
            element={
              <Static title="Terms & Conditions" />
            }
          />

        </Route>


        {/* ================================
            AUTHENTICATION
        ================================= */}

        <Route
          path="/login"
          element={<Auth />}
        />

        <Route
          path="/register"
          element={<Auth register />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />


        {/* ================================
            PROTECTED USER ROUTES
        ================================= */}

        <Route element={<Protected />}>

          {/* Manual UPI Payment */}
          <Route
            path="/payment"
            element={<PaymentPage />}
          />


          {/* Dashboard */}
          <Route element={<DashboardLayout />}>

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/dashboard/tools"
              element={<Tools />}
            />

            <Route
              path="/dashboard/history"
              element={<History />}
            />

            <Route
              path="/dashboard/favorites"
              element={<Favorites />}
            />

            <Route
              path="/dashboard/usage"
              element={<Usage />}
            />

            <Route
              path="/dashboard/subscription"
              element={<Subscription />}
            />

            <Route
              path="/dashboard/settings"
              element={<Settings />}
            />


            {/* ================================
                ADMIN ROUTES
            ================================= */}

            <Route element={<AdminOnly />}>

              <Route
                path="/admin"
                element={<Admin />}
              />

              <Route
                path="/admin/payments"
                element={<AdminPayments />}
              />

            </Route>

          </Route>

        </Route>


        {/* ================================
            404
        ================================= */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </>
  );
}
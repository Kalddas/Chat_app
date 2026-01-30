// src/config/routes.js
import { lazy } from "react";

// Public Components
const Login = lazy(() => import("@/features/login/page.jsx"));
const Register = lazy(() => import("@/features/register/page.jsx"));
const ForgotPassword = lazy(() => import("@/features/forgot-password/page.jsx"));
const ResetPasswordPage = lazy(() => import("@/features/reset-password/page.jsx"));
const OTPVerification = lazy(() => import("@/features/otp-verification/page.jsx"));
const LandingPage = lazy(() => import("@/features/home/page.jsx"));
const NotFound = lazy(() => import("@/components/NotFound.jsx"));

// Common Components (accessible to both users and admins)
const ChatPage = lazy(() => import("../features/chat/page.jsx"));


// Admin Components
const AdminPage = lazy(() => import("@/features/admin/page.jsx"));


export const publicRoutes = [
  { path: "/", element: LandingPage },
  { path: "/login", element: Login },
  { path: "/register", element: Register },
  { path: "/forgot-password", element: ForgotPassword },
  { path: "/reset-password", element: ResetPasswordPage },
  { path: "/otp-verification", element: OTPVerification },
  { path: "*", element: NotFound },
];

export const commonRoutes = [
  { path: "/chat", element: ChatPage },

];

export const adminRoutes = [
  { path: "/admin", element: AdminPage },

];

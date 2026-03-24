"use client";

import Link from "next/link";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { BookOpenText, ArrowLeft, Lock, CheckCircle, AlertCircle, Loader2, Eye, EyeOff, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Password strength rules ────────────────────────────────────────────────
const RULES = [
  { label: "At least 8 characters",        test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter (A–Z)",    test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter (a–z)",   test: (p: string) => /[a-z]/.test(p) },
  { label: "One number (0–9)",             test: (p: string) => /\d/.test(p) },
  { label: "One special character (!@#…)", test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

type PageState = "waiting" | "ready" | "loading" | "success" | "invalid";

function ResetPasswordForm() {
  const router = useRouter();

  const [pageState,   setPageState]   = useState<PageState>("waiting");
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg,    setErrorMsg]    = useState("");
  const handled = useRef(false);

  useEffect(() => {
    // Listen for Supabase's PASSWORD_RECOVERY event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" && !handled.current) {
        handled.current = true;
        setPageState("ready");
      }
    });

    // PKCE flow: ?code= in URL → exchange for session (fires PASSWORD_RECOVERY above)
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(window.location.href).catch(() => {
        if (!handled.current) setPageState("invalid");
      });
    }

    // Implicit flow: #access_token=...&type=recovery in hash
    // Supabase JS detects the hash automatically; PASSWORD_RECOVERY fires on its own.
    // Nothing extra needed — the onAuthStateChange above handles it.

    // Safety timeout — if no event fires in 10s, the link is invalid/expired
    const timeout = setTimeout(() => {
      if (!handled.current) setPageState("invalid");
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const passRules  = RULES.map(r => ({ ...r, ok: r.test(password) }));
  const allRulesOk = passRules.every(r => r.ok);
  const confirmOk  = confirm.length > 0 && password === confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allRulesOk) {
      setErrorMsg("Please make sure your password meets all requirements.");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setPageState("loading");
    setErrorMsg("");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMsg(error.message || "Failed to update password. Please try again.");
      setPageState("ready");
      return;
    }

    // Sign out so the user logs in fresh with the new password
    await supabase.auth.signOut();
    setPageState("success");
    setTimeout(() => router.push("/auth/v1/login"), 3000);
  };

  return (
    <motion.div
      className="flex min-h-dvh"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Left dark panel */}
      <motion.div
        className="bg-black hidden lg:block lg:w-1/3"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href="/">
                <BookOpenText className="text-primary-foreground mx-auto size-12 cursor-pointer hover:opacity-80 transition-opacity" />
              </Link>
            </motion.div>
            <motion.div
              className="space-y-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <h1 className="text-primary-foreground text-4xl font-bold">BusinessHub Pro</h1>
              <p className="text-primary-foreground/80 text-lg font-bold">
                Smart Business Support Platform with Real-Time Queue Optimization
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Right panel */}
      <motion.div
        className="bg-background relative flex w-full items-center justify-center p-4 sm:p-8 lg:w-2/3"
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link
          href="/auth/v1/login"
          className="absolute top-4 left-4 flex items-center gap-1 text-sm font-medium text-[#636B2F] hover:text-[#3D4127] transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Login
        </Link>

        <div className="w-full max-w-md space-y-6 pt-8 sm:pt-0">
          <AnimatePresence mode="wait">

            {/* Waiting for Supabase PASSWORD_RECOVERY event */}
            {pageState === "waiting" && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-4"
              >
                <Loader2 className="size-10 animate-spin text-[#3D4127] mx-auto" />
                <p className="text-muted-foreground text-sm">Verifying your reset link…</p>
              </motion.div>
            )}

            {/* Invalid / expired link */}
            {pageState === "invalid" && (
              <motion.div
                key="invalid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-6"
              >
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="size-10 text-red-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-red-600">Link Invalid or Expired</h2>
                  <p className="text-muted-foreground text-sm">
                    This password reset link has expired or already been used.
                    Reset links are valid for a limited time.
                  </p>
                </div>
                <Link
                  href="/auth/forgot-password"
                  className="inline-block bg-[#3D4127] hover:bg-[#636B2F] text-white text-sm font-medium px-6 py-3 rounded-md transition-colors"
                >
                  Request a New Reset Link
                </Link>
              </motion.div>
            )}

            {/* Success */}
            {pageState === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-6"
              >
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="size-10 text-green-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-[#3D4127]">Password Reset!</h2>
                  <p className="text-muted-foreground text-sm">
                    Your password has been updated. Redirecting you to login…
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Redirecting in 3 seconds…
                </div>
                <Link href="/auth/v1/login" className="inline-block text-sm text-[#636B2F] hover:text-[#3D4127] font-medium hover:underline">
                  Go to Login now →
                </Link>
              </motion.div>
            )}

            {/* Password form (ready or loading) */}
            {(pageState === "ready" || pageState === "loading") && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="space-y-3 text-center">
                  <div className="flex justify-center">
                    <div className="w-14 h-14 rounded-full bg-[#3D4127]/10 flex items-center justify-center">
                      <Lock className="size-7 text-[#3D4127]" />
                    </div>
                  </div>
                  <div className="font-semibold tracking-tight text-xl">Set New Password</div>
                  <p className="text-muted-foreground text-sm">Choose a strong password for your account.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPass ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setErrorMsg(""); }}
                        disabled={pageState === "loading"}
                        className="pr-10"
                        autoComplete="new-password"
                        autoFocus
                      />
                      <button type="button" onClick={() => setShowPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                        {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {password.length > 0 && (
                      <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 space-y-1">
                        {passRules.map(rule => (
                          <li key={rule.label} className={`flex items-center gap-2 text-xs ${rule.ok ? "text-green-600" : "text-muted-foreground"}`}>
                            {rule.ok ? <Check className="size-3 shrink-0" /> : <X className="size-3 shrink-0 text-red-400" />}
                            {rule.label}
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirm Password <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input
                        id="confirm"
                        type={showConfirm ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirm}
                        onChange={(e) => { setConfirm(e.target.value); setErrorMsg(""); }}
                        disabled={pageState === "loading"}
                        className={`pr-10 ${confirm.length > 0 ? (confirmOk ? "border-green-500 focus-visible:ring-green-500" : "border-red-400 focus-visible:ring-red-400") : ""}`}
                        autoComplete="new-password"
                      />
                      <button type="button" onClick={() => setShowConfirm(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                        {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {confirm.length > 0 && !confirmOk && (
                      <p className="text-xs text-red-500 flex items-center gap-1"><X className="size-3" /> Passwords do not match</p>
                    )}
                    {confirmOk && (
                      <p className="text-xs text-green-600 flex items-center gap-1"><Check className="size-3" /> Passwords match</p>
                    )}
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {errorMsg && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3"
                      >
                        <AlertCircle className="size-4 text-red-500 mt-0.5 shrink-0" />
                        <p className="text-red-700 text-sm">{errorMsg}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    type="submit"
                    className="w-full bg-[#3D4127] hover:bg-[#636B2F] text-white"
                    disabled={pageState === "loading" || !allRulesOk || !confirmOk}
                  >
                    {pageState === "loading" ? (
                      <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" />Updating Password…</span>
                    ) : "Reset Password"}
                  </Button>
                </form>
              </motion.div>
            )}

          </AnimatePresence>

          <motion.div className="text-center space-y-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <p className="text-xs text-muted-foreground">© 2026 Business Pro Hub. All rights reserved.</p>
            <p className="text-[10px] text-muted-foreground/70">A product by <span className="font-medium">Elixa Software Private Limited</span></p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#3D4127]" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

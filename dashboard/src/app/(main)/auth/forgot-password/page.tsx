"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpenText, ArrowLeft, Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type State = "idle" | "loading" | "success" | "error";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();

    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg("Please enter a valid email address.");
      setState("error");
      return;
    }

    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/API/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Something went wrong. Please try again.");
        setState("error");
        return;
      }

      setState("success");
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setState("error");
    }
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

      {/* Right form panel */}
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

        <div className="w-full max-w-md space-y-8 pt-8 sm:pt-0">
          <AnimatePresence mode="wait">
            {state === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center space-y-6"
              >
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="size-10 text-green-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-[#3D4127]">Check Your Email</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    If <strong>{email}</strong> is registered, you&apos;ll receive a password reset link within a few minutes.
                    The link expires in <strong>15 minutes</strong>.
                  </p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
                  <p className="text-amber-800 text-sm">
                    <strong>Didn&apos;t receive it?</strong> Check your spam folder, or{" "}
                    <button
                      onClick={() => { setState("idle"); setEmail(""); }}
                      className="underline font-medium hover:text-amber-900 transition-colors"
                    >
                      try again with a different email
                    </button>.
                  </p>
                </div>
                <Link
                  href="/auth/v1/login"
                  className="inline-block text-sm text-[#636B2F] hover:text-[#3D4127] font-medium hover:underline transition-colors"
                >
                  ← Return to Login
                </Link>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Header */}
                <div className="space-y-3 text-center">
                  <div className="flex justify-center">
                    <div className="w-14 h-14 rounded-full bg-[#3D4127]/10 flex items-center justify-center">
                      <Mail className="size-7 text-[#3D4127]" />
                    </div>
                  </div>
                  <div className="font-semibold tracking-tight text-xl">Forgot Your Password?</div>
                  <p className="text-muted-foreground text-sm">
                    Enter your registered email address and we&apos;ll send you a secure reset link.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (state === "error") setState("idle");
                      }}
                      disabled={state === "loading"}
                      autoComplete="email"
                      autoFocus
                    />
                  </div>

                  <AnimatePresence>
                    {state === "error" && errorMsg && (
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
                    disabled={state === "loading"}
                  >
                    {state === "loading" ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Sending Reset Link…
                      </span>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    Remember your password?{" "}
                    <Link
                      href="/auth/v1/login"
                      className="text-primary font-medium hover:underline transition-all duration-200"
                    >
                      Login
                    </Link>
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className="text-center space-y-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <p className="text-xs text-muted-foreground">
              © 2026 Business Pro Hub. All rights reserved.
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              A product by <span className="font-medium">Elixa Software Private Limited</span>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

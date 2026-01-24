"use client";

import Link from "next/link";
import { BookOpenText } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { LoginForm } from "../../_components/login-form";
import { GoogleButton } from "../../_components/social-auth/google-button";
import { motion } from "framer-motion";

export default function LoginV1() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth/login-callback" },
    });
    if (error) console.error(error.message);
  };

  return (
    <motion.div
      className="flex h-dvh"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Left Section */}
      <motion.div
        className="bg-primary hidden lg:block lg:w-1/3"
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
              <BookOpenText className="text-primary-foreground mx-auto size-12" />
            </motion.div>
            <motion.div
              className="space-y-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <h1 className="text-primary-foreground text-4xl font-light">
                BusinessHub Pro
              </h1>
              <p className="text-primary-foreground/80 text-lg">
                Smart Business Support Platform with Real-Time Queue Optimization
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Right Section */}
      <motion.div
        className="bg-background flex w-full items-center justify-center p-8 lg:w-2/3"
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          {/* Header */}
          <motion.div
            className="space-y-4 text-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="font-semibold tracking-tight text-xl">
              Welcome to BusinessHub Pro
            </div>
            <div className="text-muted-foreground mx-auto max-w-xl">
              Login to access real-time queue management, customer activity insights,
              and smart business operations dashboard.
            </div>
          </motion.div>

          {/* Login Form */}
          <motion.div
            className="space-y-4"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <LoginForm />

            <GoogleButton
              className="w-full"
              onClick={handleGoogleLogin}
              variant="outline"
            />

            <p className="text-muted-foreground text-center text-xs">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/v1/register"
                className="text-primary font-medium hover:underline transition-all duration-200"
              >
                Register
              </Link>
            </p>
          </motion.div>

          <motion.p
            className="text-center text-xs text-muted-foreground mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            © BusinessHub Solutions. All rights reserved.
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
}

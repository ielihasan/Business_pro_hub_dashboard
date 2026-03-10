"use client";

import Link from "next/link";
import { BookOpenText } from "lucide-react";
import { RegisterFormNew } from "../../_components/register-form-new";
import { motion } from "framer-motion";

export default function RegisterV1() {
  return (
    <motion.div
      className="flex min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Left Section - Form Area (natural scroll) */}
      <motion.div
        className="bg-background flex w-full flex-col lg:w-2/3"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Sticky Header — always visible at top */}
        <motion.div
          className="sticky top-0 z-10 bg-background px-4 pt-3 pb-2 border-b"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="w-full max-w-2xl mx-auto text-center">
            <h2 className="text-lg md:text-xl font-bold tracking-tight">
              Welcome to BusinessHub Pro
            </h2>
            <p className="text-muted-foreground text-xs mt-1">
              Real-time queue management & business operations dashboard
            </p>
          </div>
        </motion.div>

        {/* Form Content */}
        <motion.div
          className="w-full max-w-2xl mx-auto px-4 py-6"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-4 text-center">
            <h1 className="text-base md:text-lg font-semibold">Create Your Account</h1>
            <p className="text-muted-foreground text-xs mt-1">
              Choose your account type and fill in the details
            </p>
          </div>

          {/* Registration Form */}
          <RegisterFormNew />

          {/* Login Link */}
          <p className="text-muted-foreground text-center text-xs mt-6">
            Already have an account?{" "}
            <Link href="/auth/v1/login" className="text-primary font-medium hover:underline transition-all duration-200 py-2 inline-block">
              Login here
            </Link>
          </p>

          {/* Elixa Software Branding */}
          <div className="text-center mt-6 pt-4 border-t border-gray-100">
            <p className="text-[10px] text-muted-foreground/70">
              A product by <span className="font-medium">Elixa Software Private Limited</span>
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Right Section - Sticky Branding Panel */}
      <motion.div
        className="bg-black hidden lg:flex lg:w-1/3 flex-shrink-0"
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="sticky top-0 h-screen flex flex-col items-center justify-center p-8 text-center w-full">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <BookOpenText className="text-primary-foreground size-16 mb-6 flex-shrink-0" />
          </motion.div>
          <motion.h1
            className="text-primary-foreground text-3xl font-bold mb-3"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Welcome!
          </motion.h1>
          <motion.p
            className="text-primary-foreground/90 text-base font-bold max-w-sm"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            Smart Business Support Platform with Real-Time Queue Optimization
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
}

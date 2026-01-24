"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

// Fade transition
export const FadeTransition = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.4, ease: "easeInOut" }}
  >
    {children}
  </motion.div>
);

// Slide from bottom transition
export const SlideUpTransition = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -50 }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

// Scale transition
export const ScaleTransition = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.05 }}
    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

// Slide from right transition
export const SlideRightTransition = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, x: 100 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -100 }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

// Smooth modern transition (like avvr.nl style)
export const SmoothTransition = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
    transition={{
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] // Smooth cubic-bezier easing
    }}
  >
    {children}
  </motion.div>
);

// Stagger children animation
export const StaggerContainer = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    exit="exit"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.2
        }
      },
      exit: {
        opacity: 0,
        transition: {
          staggerChildren: 0.05,
          staggerDirection: -1
        }
      }
    }}
  >
    {children}
  </motion.div>
);

// Individual stagger item
export const StaggerItem = ({ children }: { children: ReactNode }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -10 }
    }}
    transition={{ duration: 0.4 }}
  >
    {children}
  </motion.div>
);

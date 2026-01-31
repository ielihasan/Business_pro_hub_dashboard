"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useScroll } from "framer-motion";

interface ScrollProgressProps {
  className?: string;
  height?: number;
  showPercentage?: boolean;
  position?: "top" | "below-header";
  headerHeight?: number;
}

export function ScrollProgress({
  className = "",
  height = 3,
  showPercentage = false,
  position = "top",
  headerHeight = 73
}: ScrollProgressProps) {
  const { scrollYProgress } = useScroll();
  const [isVisible, setIsVisible] = useState(false);

  // Smooth spring animation for the progress
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Track scroll percentage for optional display
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      setPercentage(Math.round(latest * 100));
      setIsVisible(latest > 0.01);
    });

    return () => unsubscribe();
  }, [scrollYProgress]);

  const topPosition = position === "below-header" ? `${headerHeight}px` : "0px";

  return (
    <div
      className={`fixed left-0 right-0 z-[60] ${className}`}
      style={{ height: `${height}px`, top: topPosition }}
    >
      {/* Background track */}
      <div className="absolute inset-0 bg-gray-100" />

      {/* Progress bar */}
      <motion.div
        className="absolute top-0 left-0 right-0 bottom-0 origin-left"
        style={{
          scaleX,
          background: "linear-gradient(90deg, #111827 0%, #1f2937 30%, #374151 70%, #111827 100%)",
        }}
      />

      {/* Shine effect overlay */}
      <motion.div
        className="absolute top-0 left-0 right-0 bottom-0 origin-left pointer-events-none"
        style={{
          scaleX,
          background: "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)",
        }}
      />

      {/* Optional percentage indicator */}
      {showPercentage && isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute right-4 top-full mt-2 px-2 py-1 bg-gray-900 text-white text-xs font-medium rounded-md shadow-lg"
        >
          {percentage}%
        </motion.div>
      )}
    </div>
  );
}

// Alternative minimal variant
export function ScrollProgressMinimal({ className = "" }: { className?: string }) {
  const { scrollYProgress } = useScroll();

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      className={`fixed top-0 left-0 right-0 h-[2px] bg-gray-900 origin-left z-[100] ${className}`}
      style={{ scaleX }}
    />
  );
}

// Gradient variant with dots
export function ScrollProgressDots({ className = "" }: { className?: string }) {
  const { scrollYProgress } = useScroll();
  const [activeSection, setActiveSection] = useState(0);

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      // Determine which section (0-4) based on scroll progress
      setActiveSection(Math.min(4, Math.floor(latest * 5)));
    });

    return () => unsubscribe();
  }, [scrollYProgress]);

  const sections = [0, 1, 2, 3, 4];

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] ${className}`}>
      {/* Main progress line */}
      <div className="h-[3px] bg-gray-100 relative overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-gray-800 via-gray-600 to-gray-900"
          style={{ scaleX, transformOrigin: "left" }}
        />
      </div>

      {/* Section dots */}
      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between px-[10%] pointer-events-none">
        {sections.map((section) => (
          <motion.div
            key={section}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              section <= activeSection ? "bg-gray-900" : "bg-gray-300"
            }`}
            animate={{
              scale: section === activeSection ? 1.3 : 1,
            }}
            transition={{ duration: 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}

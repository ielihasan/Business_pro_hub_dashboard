"use client";
import { useEffect, useState } from "react";

/**
 * PsychologicalLoader — Progress Illusion pattern.
 * Starts fast (40% in 150ms) then slows down,
 * making the wait feel shorter than a plain spinner.
 *
 * fullScreen=true  → used in layouts (whole viewport)
 * fullScreen=false → used inside pages/cards (inline, h-40)
 */
export function PsychologicalLoader({
  message = "Loading...",
  fullScreen = true,
}: {
  message?: string;
  fullScreen?: boolean;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Fast start = perceived speed (Progress Illusions principle)
    const t1 = setTimeout(() => setProgress(40), 150);
    const t2 = setTimeout(() => setProgress(65), 400);
    const t3 = setTimeout(() => setProgress(82), 800);
    const t4 = setTimeout(() => setProgress(91), 1600);
    const t5 = setTimeout(() => setProgress(95), 3000);
    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, []);

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${
        fullScreen ? "h-screen" : "h-40 w-full"
      }`}
    >
      <div className="w-52 space-y-2">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>{message}</span>
          <span className="font-medium tabular-nums">{progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-black rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

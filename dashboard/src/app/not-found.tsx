"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center space-y-4 text-center px-4">
      <h1 className="text-2xl font-semibold">Page not found.</h1>
      <p className="text-muted-foreground">The page you are looking for could not be found.</p>
      <Link replace href="/auth/v1/login">
        <Button variant="outline">Go back home</Button>
      </Link>

      {/* Elixa Software Branding */}
      <p className="text-[10px] text-muted-foreground/60 mt-8">
        BusinessHub Pro by <span className="font-medium">Elixa Software Private Limited</span>
      </p>
    </div>
  );
}

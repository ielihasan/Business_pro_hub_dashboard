import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8 text-center bg-gray-50">
      <div className="space-y-3">
        <p className="text-8xl font-bold text-gray-200 select-none leading-none">404</p>
        <h1 className="text-2xl font-semibold text-gray-900">Page not found</h1>
        <p className="text-gray-500 max-w-sm mx-auto text-sm">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/business/dashboard">Go to Dashboard</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/auth/v1/login">Sign in</Link>
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground/60">
        BusinessHub Pro by <span className="font-medium">Elixa Software Private Limited</span>
      </p>
    </div>
  );
}

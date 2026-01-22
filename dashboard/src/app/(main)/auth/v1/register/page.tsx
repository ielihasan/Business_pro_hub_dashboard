import Link from "next/link";
import { BookOpenText } from "lucide-react";
import { RegisterFormNew } from "../../_components/register-form-new";

export default function RegisterV1() {
  return (
    <div className="flex h-dvh">
      {/* Left Section */}
      <div className="bg-background flex w-full items-center justify-center p-8 lg:w-2/3">
        <div className="w-full max-w-2xl space-y-6 py-12">
          {/* Header */}
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Create Account</h1>
            <p className="text-muted-foreground text-sm">
              Join BusinessHub Pro to manage your business operations
            </p>
          </div>

          {/* Registration Form */}
          <div className="space-y-4">
            <RegisterFormNew />

            <p className="text-muted-foreground text-center text-xs pt-4">
              Already have an account?{" "}
              <Link href="/auth/v1/login" className="text-primary font-medium hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="bg-primary hidden lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <BookOpenText className="text-primary-foreground mx-auto size-12" />
            <div className="space-y-2">
              <h1 className="text-primary-foreground text-4xl font-light">Welcome!</h1>
              <p className="text-primary-foreground/80 text-lg">
                Smart Business Support Platform with Real-Time Queue Optimization
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { BookOpenText } from "lucide-react";
import { RegisterFormNew } from "../../_components/register-form-new";

export default function RegisterV1() {
  return (
    <div className="flex h-dvh">
      {/* Left Section */}
      <div className="bg-background flex w-full justify-center p-6 lg:w-2/3 overflow-y-auto">
        <div className="w-full max-w-2xl space-y-5 py-6 my-auto">
          {/* Header */}
          <div className="space-y-3 text-center">
            {/* Welcome Section */}
            <div className="space-y-1.5">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                Welcome to BusinessHub Pro
              </h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto px-4">
                Register to access real-time queue management, customer activity insights,
                and smart business operations dashboard.
              </p>
            </div>

            {/* Create Account Header */}
            <div className="space-y-1 pt-1">
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Create Account</h1>
              <p className="text-muted-foreground text-xs md:text-sm">
                Fill in your details below to get started
              </p>
            </div>
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

import Link from "next/link";
import { BookOpenText } from "lucide-react";
import { RegisterFormNew } from "../../_components/register-form-new";

export default function RegisterV1() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Section - Form Area */}
      <div className="bg-background flex w-full flex-col lg:w-2/3 h-full">
        {/* Compact Fixed Header */}
        <div className="flex-shrink-0 px-4 pt-3 pb-2 border-b">
          <div className="w-full max-w-2xl mx-auto text-center">
            <h2 className="text-lg md:text-xl font-bold tracking-tight">
              Welcome to BusinessHub Pro
            </h2>
            <p className="text-muted-foreground text-xs mt-1">
              Real-time queue management & business operations dashboard
            </p>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full max-w-2xl mx-auto px-4 py-6">
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
              <Link href="/auth/v1/login" className="text-primary font-medium hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - Fixed Branding */}
      <div className="bg-primary hidden lg:flex lg:w-1/3 h-full flex-shrink-0 overflow-hidden">
        <div className="flex flex-col items-center justify-center p-8 text-center w-full overflow-hidden">
          <BookOpenText className="text-primary-foreground size-16 mb-6 flex-shrink-0" />
          <h1 className="text-primary-foreground text-3xl font-light mb-3">
            Welcome!
          </h1>
          <p className="text-primary-foreground/90 text-base max-w-sm">
            Smart Business Support Platform with Real-Time Queue Optimization
          </p>
        </div>
      </div>
    </div>
  );
}

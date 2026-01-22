import Link from "next/link";
import { BookOpenText } from "lucide-react";
import { RegisterForm } from "../../_components/register-form";
import { GoogleButton } from "../../_components/social-auth/google-button";

export default function RegisterV1() {
  return (
    <div className="flex h-dvh">
      {/* Left Section */}
      <div className="bg-background flex w-full items-center justify-center p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          {/* Header */}
          <div className="space-y-4 text-center">
            <div className="font-medium tracking-tight">Create Account</div>
            <div className="text-muted-foreground mx-auto max-w-xl">
              Create your BusinessHub Pro account to manage queues, track customers,
              and optimize your business operations in real-time.
            </div>
          </div>

          {/* Registration Form */}
          <div className="space-y-4">
            <RegisterForm />
            <GoogleButton className="w-full" variant="outline" />
            <p className="text-muted-foreground text-center text-xs">
              Already have an account?{" "}
              <Link href="login" className="text-primary">
                Login
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
              <h1 className="text-primary-foreground text-5xl font-light">Welcome!</h1>
              <p className="text-primary-foreground/80 text-xl">
                Your smart business management journey starts here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

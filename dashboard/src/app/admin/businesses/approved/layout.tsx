import type { Metadata } from "next";

export const metadata: Metadata = { title: "Approved Businesses" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

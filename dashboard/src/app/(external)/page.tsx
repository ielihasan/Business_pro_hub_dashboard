// src/app/page.tsx (or your Home page)
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/auth/v1/login");
  // This won't render anything because redirect happens immediately
  return null;
}

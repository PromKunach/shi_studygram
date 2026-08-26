import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginPageView } from "@/components/auth/login-page-view";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ | shi_studygram",
  description: "Sign in to your Shi studygram workspace",
};

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      กำลังโหลด...
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPageView />
    </Suspense>
  );
}

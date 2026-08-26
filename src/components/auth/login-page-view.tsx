"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { LoginPendulumLogo } from "@/components/auth/login-pendulum-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthErrorMessage, isSafeRedirectPath } from "@/lib/auth-utils";
import { getAuthSession, signInWithEmail } from "@/lib/auth";
import { resolveUserProfile } from "@/lib/userProfile";

export function LoginPageView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = isSafeRedirectPath(searchParams.get("redirect"))
    ? searchParams.get("redirect")!
    : "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        const session = await getAuthSession();
        if (!cancelled && session) {
          router.replace(redirectTo);
        }
      } finally {
        if (!cancelled) setIsCheckingSession(false);
      }
    };

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [redirectTo, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    setIsSubmitting(true);

    try {
      await signInWithEmail({ email: trimmedEmail, password });
      await resolveUserProfile(trimmedEmail);
      router.replace(redirectTo);
      router.refresh();
    } catch (submitError) {
      setError(getAuthErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <LoginPendulumLogo />

      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted hover:bg-hover hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5 shrink-0" />
          <span>กลับไปหน้าหลัก</span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 pt-64 pb-10 sm:pt-72">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-foreground">เข้าสู่ระบบ</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              เข้าสู่พื้นที่เรียนของคุณ
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            {isCheckingSession ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                กำลังตรวจสอบสถานะ...
              </div>
            ) : (
              <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
                <div className="space-y-2">
                  <Label htmlFor="login-email">อีเมล</Label>
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">รหัสผ่าน</Label>
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isSubmitting}
                    minLength={6}
                    required
                  />
                </div>

                {error ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                  </p>
                ) : null}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                      กำลังดำเนินการ...
                    </>
                  ) : (
                    "เข้าสู่ระบบ"
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

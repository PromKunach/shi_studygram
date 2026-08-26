import { describe, expect, it } from "vitest";
import { getAuthErrorMessage, isSafeRedirectPath } from "./auth-utils";

describe("auth helpers", () => {
  it("maps common Supabase auth errors to Thai messages", () => {
    expect(
      getAuthErrorMessage({ message: "Invalid login credentials" })
    ).toBe("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    expect(getAuthErrorMessage({ message: "Email not confirmed" })).toBe(
      "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ"
    );
  });

  it("allows only safe internal redirect paths", () => {
    expect(isSafeRedirectPath("/documents")).toBe(true);
    expect(isSafeRedirectPath("/login")).toBe(false);
    expect(isSafeRedirectPath("//evil.com")).toBe(false);
    expect(isSafeRedirectPath(null)).toBe(false);
  });
});

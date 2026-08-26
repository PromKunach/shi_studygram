export function getAuthErrorMessage(error: unknown) {
  if (!error || typeof error !== "object" || !("message" in error)) {
    return "เกิดข้อผิดพลาด กรุณาลองใหม่";
  }

  const message = String((error as { message: unknown }).message);

  if (message.includes("Invalid login credentials")) {
    return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
  }
  if (message.includes("Email not confirmed")) {
    return "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ";
  }
  if (message.includes("User already registered")) {
    return "อีเมลนี้ถูกใช้งานแล้ว";
  }
  if (message.includes("Password should be at least")) {
    return "รหัสผ่านสั้นเกินไป";
  }
  if (message.includes("Unable to validate email address")) {
    return "รูปแบบอีเมลไม่ถูกต้อง";
  }

  return message || "เกิดข้อผิดพลาด กรุณาลองใหม่";
}

export function isSafeRedirectPath(path: string | null | undefined) {
  if (!path) return false;
  return path.startsWith("/") && !path.startsWith("//") && path !== "/login";
}

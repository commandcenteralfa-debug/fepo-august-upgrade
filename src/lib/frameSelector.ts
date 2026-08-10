export type ActiveFrame = "phone" | "email" | null;

export function getActiveFrame(phone: string, email: string): ActiveFrame {
  const hasPhone = phone.trim().length > 0;
  const hasEmail = email.trim().length > 0;

  if (hasPhone && !hasEmail) return "phone";
  if (hasEmail && !hasPhone) return "email";
  return null;
}

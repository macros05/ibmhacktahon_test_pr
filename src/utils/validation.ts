const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(input: string): boolean {
  return EMAIL_RE.test(input);
}

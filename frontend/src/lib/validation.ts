// Shared validation regex + helpers for auth forms (login / signup).
// Keeping these in one place means the login and signup pages always
// validate email/password the same way.

// Standard "something@something.tld" shape.
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

// At least 6 characters, with at least one letter and one number.
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&.^_-]{6,}$/;

export function validateEmail(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) return "Email is required";
  if (!EMAIL_REGEX.test(trimmed)) return "Enter a valid email address";

  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return "Password is required";

  if (!PASSWORD_REGEX.test(value)) {
    return "Password must be at least 6 characters and include a letter and a number";
  }

  return null;
}

export function validateRequired(
  value: string,
  label: string,
): string | null {
  return value.trim() ? null : `${label} is required`;
}

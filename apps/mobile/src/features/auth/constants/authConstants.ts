export const OTP_CODE_LENGTH = 6;

export const AUTH_ROUTES = {
  email: "/(auth)/email" as const,
  otp: "/(auth)/otp" as const,
  createProfile: "/(auth)/create-profile" as const,
  appIndex: "/home" as const,
};

/**
 * Pathnames returned by Expo Router `usePathname()` (route groups like `(auth)` stripped).
 * Use these for guard comparisons — never compare pathname to `AUTH_ROUTES.*` directly.
 */
export const AUTH_PATHNAMES = {
  email: "/email",
  otp: "/otp",
  createProfile: "/create-profile",
} as const;

export function isAuthPathname(
  pathname: string,
  key: keyof typeof AUTH_PATHNAMES,
): boolean {
  return pathname === AUTH_PATHNAMES[key];
}

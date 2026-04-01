export const OTP_CODE_LENGTH = 6;

export const AUTH_ROUTES = {
  email: "/(auth)/email" as const,
  otp: "/(auth)/otp" as const,
  createProfile: "/(auth)/create-profile" as const,
  appIndex: "/home" as const,
};

import i18n from "@/src/i18n";
export const OTP_CODE_LENGTH = 6;

export const AUTH_MESSAGES = {
  genericError: i18n.t("auth.genericError"),
  emailSent: i18n.t("auth.emailSent"),
  invalidCode: i18n.t("auth.invalidCode"),
};

export const AUTH_ROUTES = {
  email: "/(auth)/email" as const,
  otp: "/(auth)/otp" as const,
  createProfile: "/(auth)/create-profile" as const,
  appIndex: "/home" as const,
};

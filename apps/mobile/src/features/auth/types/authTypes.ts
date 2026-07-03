import type { Session, User } from '@supabase/supabase-js';

export type AuthStatus = 'unauthenticated' | 'authenticated' | 'loading';

export type AuthUser = User;

export type AuthSessionData = {
  status: AuthStatus;
  session: Session | null;
  user: AuthUser | null;
};

export type EmailOtpPayload = {
  email: string;
  requestId?: string;
};

export type VerifyOtpPayload = {
  email: string;
  token: string;
  requestId?: string;
};

export type VerifyOtpErrorCode = "OTP_INVALID_LENGTH" | "OTP_VERIFICATION_FAILED";

export type VerifyOtpResult =
  | {
      success: true;
      data: { user: User };
    }
  | {
      success: false;
      kind: "business";
      errorCode: VerifyOtpErrorCode;
    };

export type SendEmailOtpErrorCode =
  | "EMAIL_SEND_RATE_LIMITED"
  | "CAPTCHA_FAILED"
  | "EMAIL_INVALID"
  | "SIGNUP_DISABLED"
  | "EMAIL_PROVIDER_DISABLED"
  | "EMAIL_NOT_AUTHORIZED"
  | "UNKNOWN_ERROR";

/** Mapped failures treated as expected user-facing outcomes (`kind: "business"`). */
export type SendEmailOtpBusinessErrorCode = Exclude<
  SendEmailOtpErrorCode,
  "UNKNOWN_ERROR"
>;

/** Non-PII diagnostic fields for auth OTP send failures (monitoring / debug). */
export type SendEmailOtpDiagnostic = {
  branch: "supabase_error" | "caught_exception";
  supabaseErrorCode?: string;
  errorName?: string;
  errorMessage?: string;
  errorIsInstanceOfError: string;
  connectivityProbe: "ok" | "failed";
  connectivityHttpStatus?: string;
  connectivityErrorMessage?: string;
  supabaseUrlHost?: string;
  supabaseConfigured: string;
};

export type SendEmailOtpFailureResult = {
  success: false;
  diagnostic: SendEmailOtpDiagnostic;
} & (
  | {
      kind: "business";
      errorCode: SendEmailOtpBusinessErrorCode;
    }
  | {
      kind: "technical";
    }
  | {
      kind: "unexpected";
    }
);

export type SendEmailOtpResult =
  | {
      success: true;
      data: undefined;
    }
  | SendEmailOtpFailureResult;


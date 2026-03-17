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
};

export type VerifyOtpPayload = {
  email: string;
  token: string;
};

export type VerifyOtpResult =
  | {
      success: true;
      user: User;
    }
  | {
      success: false;
      errorMessage: string;
    };


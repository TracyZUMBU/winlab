import { getSupabaseClient } from "@/src/lib/supabase/client";

type DeleteMyAccountResponse = {
  success: boolean;
  error?: string;
};

type SupabaseFunctionsInvokeError = {
  name?: string;
  message?: string;
  context?: {
    status?: number;
    body?: unknown;
  };
};

export async function deleteMyAccount(): Promise<void> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.functions.invoke<DeleteMyAccountResponse>(
    "delete-my-account",
    { body: {} },
  );

  if (error) {
    const e = error as SupabaseFunctionsInvokeError;
    const status = e.context?.status;
    const body = e.context?.body;
    const bodyText = body ? ` ${JSON.stringify(body)}` : "";

    throw new Error(
      `Delete account failed${status ? ` (${status})` : ""}: ${e.message ?? "Unknown error"}${bodyText}`,
    );
  }

  if (!data?.success) {
    throw new Error(data?.error ?? "Delete account failed");
  }
}


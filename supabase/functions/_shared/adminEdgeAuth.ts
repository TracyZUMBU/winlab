/**
 * Vérification commune des Edge Functions appelées depuis l’admin Winlab :
 * JWT utilisateur final valide + `profiles.is_admin` (lecture via service_role uniquement ici).
 */
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";
import * as jose from "https://esm.sh/jose@5.9.6";

export function bearerTokenFromAuthorization(header: string): string | null {
  const m = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return m ? m[1] : null;
}

function originOnlyFromUrl(url: string): string | null {
  try {
    const u = new URL(url.trim());
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

/**
 * Vérifie un JWT de session Supabase (rôle `authenticated`) et renvoie `sub` (user id).
 */
async function verifyAuthenticatedEndUserJwtAndGetSub(
  bearerToken: string,
  supabaseUrl: string,
): Promise<string | null> {
  if (!bearerToken.startsWith("eyJ")) {
    return null;
  }

  const symmetricSecrets = [
    Deno.env.get("SUPABASE_JWT_SECRET"),
    Deno.env.get("JWT_SECRET"),
    Deno.env.get("GOTRUE_JWT_SECRET"),
  ]
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s))
    .map((s) => new TextEncoder().encode(s));

  for (const keyMaterial of symmetricSecrets) {
    try {
      const { payload } = await jose.jwtVerify(bearerToken, keyMaterial, {
        algorithms: ["HS256"],
      });
      if (payload.role === "authenticated" && typeof payload.sub === "string") {
        return payload.sub;
      }
    } catch {
      continue;
    }
  }

  const projectOrigin = originOnlyFromUrl(supabaseUrl);
  if (!projectOrigin) return null;
  const jwksUrl = new URL("/auth/v1/.well-known/jwks.json", `${projectOrigin}/`);
  const JWKS = jose.createRemoteJWKSet(jwksUrl);
  try {
    const { payload } = await jose.jwtVerify(bearerToken, JWKS);
    if (payload.role === "authenticated" && typeof payload.sub === "string") {
      return payload.sub;
    }
    return null;
  } catch {
    return null;
  }
}

export type RequireAdminServiceClientResult =
  | { ok: true; admin: SupabaseClient; callerUserId: string }
  | {
      ok: false;
      status: number;
      error: "UNAUTHORIZED" | "FORBIDDEN" | "PROFILE_CHECK_FAILED";
      /** Présent pour journaux d’audit (jamais renvoyé au client). */
      callerUserId?: string;
    };

/**
 * Client service_role + appelant admin (`profiles.is_admin = true` pour le `sub` du JWT).
 * À utiliser avant toute action privilégiée dans une Edge Function « admin ».
 */
export async function requireAdminServiceClient(options: {
  bearerToken: string | null;
  supabaseUrl: string;
  serviceRoleKey: string;
}): Promise<RequireAdminServiceClientResult> {
  const { bearerToken, supabaseUrl, serviceRoleKey } = options;

  if (!bearerToken?.trim()) {
    return { ok: false, status: 401, error: "UNAUTHORIZED" };
  }

  const callerUserId = await verifyAuthenticatedEndUserJwtAndGetSub(
    bearerToken.trim(),
    supabaseUrl,
  );
  if (!callerUserId) {
    return { ok: false, status: 401, error: "UNAUTHORIZED" };
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    global: {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: profile, error } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", callerUserId)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      status: 500,
      error: "PROFILE_CHECK_FAILED",
      callerUserId,
    };
  }
  if (profile?.is_admin !== true) {
    return {
      ok: false,
      status: 403,
      error: "FORBIDDEN",
      callerUserId,
    };
  }

  return { ok: true, admin, callerUserId };
}

/** Minimal Deno / std types for IDE TypeScript (runtime = Supabase Edge / Deno). */
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

declare module "https://deno.land/std@0.224.0/http/server.ts" {
  export function serve(
    handler: (req: Request) => Response | Promise<Response>,
    options?: { port?: number; hostname?: string; signal?: AbortSignal },
  ): void;
}

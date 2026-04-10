import type { FormEvent } from "react";
import { useState } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "../../../lib/supabase";

const GENERIC_LOGIN_ERROR =
  "Identifiants incorrects ou compte indisponible. Réessayez.";

/** Connexion email + mot de passe (pas d’inscription depuis l’admin). */
export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!isSupabaseConfigured) {
      setErrorMessage("Configuration Supabase manquante.");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setErrorMessage(GENERIC_LOGIN_ERROR);
        return;
      }
      setPassword("");
    } catch {
      setErrorMessage(GENERIC_LOGIN_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-login">
      <div className="auth-login__card">
        <h1 className="auth-login__title">Winlab Admin</h1>
        <p className="auth-login__subtitle">Connexion réservée à l’équipe.</p>
        <form className="auth-login__form" onSubmit={handleSubmit}>
          <label className="auth-login__label" htmlFor="auth-email">
            Email
          </label>
          <input
            id="auth-email"
            className="auth-login__input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
          />
          <label className="auth-login__label" htmlFor="auth-password">
            Mot de passe
          </label>
          <input
            id="auth-password"
            className="auth-login__input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isSubmitting}
          />
          {errorMessage && (
            <p className="auth-login__error" role="alert">
              {errorMessage}
            </p>
          )}
          <button
            className="auth-login__submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}

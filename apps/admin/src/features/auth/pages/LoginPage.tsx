import type { FormEvent } from "react";
import { useState } from "react";
import { useSignIn } from "../hooks/useSignIn";

/** Connexion email + mot de passe (pas d’inscription depuis l’admin). */
export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, isSubmitting, errorMessage } = useSignIn();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { success } = await signIn(email, password);
    if (success) {
      setPassword("");
    }
  }

  return (
    <div className="auth-login">
      <div className="auth-login__card">
        <h1 className="auth-login__title">Winlab Admin</h1>
        <p className="auth-login__subtitle">Connexion administrateur Winlab</p>
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

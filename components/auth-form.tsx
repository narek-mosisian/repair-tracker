
"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

type AuthMode = "login" | "register";

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const isRegister = mode === "register";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      if (isRegister && !name.trim()) {
        setError("Bitte gib deinen Namen ein.");
        return;
      }

      const result = isRegister
        ? await authClient.signUp.email({
            name: name.trim(),
            email: email.trim(),
            password,
          })
        : await authClient.signIn.email({
            email: email.trim(),
            password,
          });

      if (result.error) {
        setError(result.error.message || "Anmeldung fehlgeschlagen.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6 text-gray-900">
      <section className="w-full max-w-md rounded-xl border bg-white p-8">
        <h1 className="text-3xl font-bold">Repair Tracker</h1>

        <h2 className="mt-4 text-xl font-semibold">
          {isRegister ? "Registrieren" : "Anmelden"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isRegister && (
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium">
                Name
              </label>
              <input
                id="name"
                type="text"
                required
                maxLength={120}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border p-3"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              E-Mail-Adresse
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={isRegister ? 8 : undefined}
              maxLength={128}
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-gray-900 p-3 font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {isLoading
              ? "Bitte warten..."
              : isRegister
                ? "Konto erstellen"
                : "Anmelden"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          {isRegister ? "Bereits registriert?" : "Noch kein Konto?"}{" "}
          <Link
            href={isRegister ? "/login" : "/register"}
            className="font-medium text-blue-700 hover:underline"
          >
            {isRegister ? "Anmelden" : "Registrieren"}
          </Link>
        </p>
      </section>
    </main>
  );
}

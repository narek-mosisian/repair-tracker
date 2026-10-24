
"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type OrganizationOption = {
  id: string;
  name: string;
};

// Technischen URL-Namen automatisch erzeugen
function createSlug(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFKD") // Zerlegt bestimmte Sonderzeichen in ihre Grundzeichen und zusätzliche Zeichen.
    .replace(/[\u0300-\u036f]/g, "") // Entfernt die kombinierenden Akzentzeichen im angegebenen Unicode-Bereich.
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") // Entfernt Bindestriche am Anfang und Ende.
    .slice(0, 45);

  return `${base || "geschaeft"}-${crypto.randomUUID().slice(0, 8)}`;
}

export default function OrganizationSetup({
  initialOrganizations,
}: {
  initialOrganizations: OrganizationOption[];
}) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Vorhandenes Geschäft aktivieren
  async function activateOrganization(organizationId: string) {
    setError("");
    setIsLoading(true);

    try {
      const result = await authClient.organization.setActive({
        organizationId,
      });

      if (result.error) {
        setError("Das Geschäft konnte nicht ausgewählt werden.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  }

  // Neues Geschäft erstellen
  async function createOrganization(
    event: SubmitEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const organizationName = name.trim();

    if (!organizationName) {
      setError("Bitte gib einen Geschäftsnamen ein.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const result = await authClient.organization.create({
        name: organizationName,
        slug: createSlug(organizationName),
      });

      if (result.error || !result.data) {
        setError(
          result.error?.message ||
            "Das Geschäft konnte nicht erstellt werden."
        );
        return;
      }

      const activeResult = await authClient.organization.setActive({
        organizationId: result.data.id,
      });

      if (activeResult.error) {
        setError(
          "Das Geschäft wurde erstellt, konnte aber nicht ausgewählt werden. Bitte lade die Seite neu."
        );
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
      <section className="w-full max-w-md space-y-6 rounded-xl border bg-white p-8">
        <header>
          <h1 className="text-3xl font-bold">Repair Tracker</h1>
          <p className="mt-2 text-gray-600">
            Richte dein Geschäft ein, um Aufträge zu verwalten.
          </p>
        </header>

        {initialOrganizations.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">
              Vorhandenes Geschäft auswählen
            </h2>

            {initialOrganizations.map((org) => (
              <button
                key={org.id}
                type="button"
                disabled={isLoading}
                onClick={() => activateOrganization(org.id)}
                className="w-full rounded-lg border p-3 text-left hover:bg-gray-100 disabled:opacity-50"
              >
                {org.name}
              </button>
            ))}
          </section>
        )}

        <form onSubmit={createOrganization} className="space-y-4">
          <h2 className="text-lg font-semibold">
            Neues Geschäft erstellen
          </h2>

          <div>
            <label
              htmlFor="organizationName"
              className="mb-2 block text-sm font-medium"
            >
              Geschäftsname
            </label>

            <input
              id="organizationName"
              type="text"
              required
              maxLength={100}
              autoComplete="organization"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="Schuhreparatur Müller"
              className="w-full rounded-lg border p-3"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-gray-900 p-3 font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {isLoading ? "Bitte warten..." : "Geschäft erstellen"}
          </button>
        </form>
      </section>
    </main>
  );
}

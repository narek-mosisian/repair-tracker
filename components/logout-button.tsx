
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    setError("");
    setIsLoading(true);

    try {
      const result = await authClient.signOut();

      if (result.error) {
        setError("Abmeldung fehlgeschlagen.");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setError("Abmeldung fehlgeschlagen.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoading}
        className="rounded-lg border px-5 py-3 font-medium hover:bg-gray-100 disabled:opacity-50"
      >
        {isLoading ? "Abmeldung..." : "Abmelden"}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}


import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  // Bestehende Sitzung überprüfen
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // Nicht angemeldete Benutzer zum Login weiterleiten
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Angemeldete Benutzer auf der Root-Seite lassen
  return NextResponse.next();
}

// Proxy ausschließlich für die Root-Seite ausführen
export const config = {
  matcher: ["/"],
};

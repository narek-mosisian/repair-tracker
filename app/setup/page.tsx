
import { Suspense } from "react";
import { connection } from "next/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OrganizationSetup from "@/components/organization-setup";

async function SetupContent() {
  await connection();

  const requestHeaders = await headers();

  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    redirect("/login");
  }

  const activeOrganizationId =
    session.session.activeOrganizationId;

  // Bereits eingerichtete Benutzer zum Dashboard
  if (activeOrganizationId) {
    const membership = await prisma.member.findFirst({
      where: {
        userId: session.user.id,
        organizationId: activeOrganizationId,
      },
      select: { id: true },
    });

    if (membership) {
      redirect("/dashboard");
    }
  }

  // Geschäfte laden, in denen der Benutzer Mitglied ist
  const organizations = await auth.api.listOrganizations({
    headers: requestHeaders,
  });

  return (
    <OrganizationSetup
      initialOrganizations={organizations.map((org) => ({
        id: org.id,
        name: org.name,
      }))}
    />
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<p>Geschäfte werden geladen...</p>}>
      <SetupContent />
    </Suspense>
  );
}

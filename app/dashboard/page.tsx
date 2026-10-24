
import { Suspense } from "react";
import { connection } from "next/server";
import OrderDashboard from "@/components/order-dashboard";
import { prisma } from "@/lib/prisma";

async function DashboardContent() {
  await connection();

  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const dbOrders = await prisma.order.findMany({
    orderBy: { id: "asc" },
  });

  const initialOrders = dbOrders.map((order) => ({
    id: order.id,
    customer: order.customer,
    description: order.description,
    status: {
      OPEN: "Offen",
      IN_PROGRESS: "In Bearbeitung",
      COMPLETED: "Abgeschlossen",
    }[order.status] as "Offen" | "In Bearbeitung" | "Abgeschlossen",
    receivedAt: order.receivedAt.toISOString().slice(0, 10),
    dueDate: order.dueDate?.toISOString().slice(0, 10) ?? null,
    completedAt: order.completedAt?.toISOString().slice(0, 10) ?? null,
  }));

  return <OrderDashboard today={today} initialOrders={initialOrders} />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<p>Dashboard wird geladen...</p>}>
      <DashboardContent />
    </Suspense>
  );
}

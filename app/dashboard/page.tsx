
import { Suspense } from "react";
import { connection } from "next/server";
import OrderDashboard from "@/components/order-dashboard";

async function DashboardContent() {
  await connection();

  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return <OrderDashboard today={today} />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<p>Dashboard wird geladen...</p>}>
      <DashboardContent />
    </Suspense>
  );
}

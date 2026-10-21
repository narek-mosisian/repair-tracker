import { Suspense } from "react";
import { connection } from "next/server";

type Status = "Offen" | "In Bearbeitung" | "Abgeschlossen";

type Order = {
  id: number;
  customer: string;
  description: string;
  status: Status;
  receivedAt: string;
  dueDate: string | null;
  completedAt: string | null;
};

// Beispielaufträge
const orders: Order[] = [
  {
    id: 1,
    customer: "Max Müller",
    description: "Fahrradreparatur",
    status: "Offen",
    receivedAt: "2026-10-19",
    dueDate: "2026-10-25",
    completedAt: null,
  },
  {
    id: 2,
    customer: "Lisa Weber",
    description: "Schuhreparatur",
    status: "In Bearbeitung",
    receivedAt: "2026-10-20",
    dueDate: "2026-10-23",
    completedAt: null,
  },
  {
    id: 3,
    customer: "Tim Schmidt",
    description: "Smartphone",
    status: "Abgeschlossen",
    receivedAt: "2026-10-15",
    dueDate: "2026-10-20",
    completedAt: "2026-10-18",
  },
];

// Deutsches Datumsformat
function formatDate(date: string | null): string {
  if (!date) return "–";

  const [year, month, day] = date.split("-");
  return `${day}.${month}.${year}`;
}

// Prüfen, ob ein Auftrag überfällig ist
function isOverdue(order: Order, today: string): boolean {
  return (
    order.status !== "Abgeschlossen" &&
    order.dueDate !== null &&
    order.dueDate < today
  );
}

// Aufträge nach Dringlichkeit sortieren
function sortOrders(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => {
    const aCompleted = a.status === "Abgeschlossen";
    const bCompleted = b.status === "Abgeschlossen";

    // Abgeschlossene Aufträge nach unten
    if (aCompleted !== bCompleted) {
      return aCompleted ? 1 : -1;
    }

    // Aufträge ohne Fälligkeitsdatum nach unten
    if (a.dueDate === null && b.dueDate !== null) return 1;
    if (a.dueDate !== null && b.dueDate === null) return -1;

    // Früheste Fälligkeit zuerst
    if (a.dueDate !== null && b.dueDate !== null) {
      const comparison = a.dueDate.localeCompare(b.dueDate);
      if (comparison !== 0) return comparison;
    }

    // Bei gleicher Fälligkeit: älteste Annahme zuerst
    return a.receivedAt.localeCompare(b.receivedAt);
  });
}

async function DashboardContent() {
  // Heutiges Datum in deutscher Zeitzone
  await connection();
  const today = new Intl.DateTimeFormat("sv-SE", {
  // Das schwedische Format eignet sich besonders gut für Datumswerte in Anwendungen und Datenbanken.
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const sortedOrders = sortOrders(orders);

  const open = orders.filter(
    (order) => order.status === "Offen"
  ).length;

  const inProgress = orders.filter(
    (order) => order.status === "In Bearbeitung"
  ).length;

  const completed = orders.filter(
    (order) => order.status === "Abgeschlossen"
  ).length;

  const overdue = orders.filter(
    (order) => isOverdue(order, today)
  ).length;

  const stats = [
    { label: "Gesamt", value: orders.length },
    { label: "Offen", value: open },
    { label: "In Bearbeitung", value: inProgress },
    { label: "Abgeschlossen", value: completed },
  ];

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Verwalte deine Reparaturaufträge.
          </p>
        </header>

        {/* Statistiken */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border bg-white p-6"
            >
              <p className="text-sm text-gray-500">
                {stat.label}
              </p>
              <p className="mt-2 text-3xl font-bold">
                {stat.value}
              </p>
            </div>
          ))}
        </section>

        {/* Überfällige Aufträge */}
        {overdue > 0 && (
          <div
            role="status"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"
          >
            {overdue} {overdue === 1 ? "Auftrag ist" : "Aufträge sind"} überfällig.
          </div>
        )}

        {/* Auftragstabelle */}
        <section className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">
            Aufträge
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="p-3">ID</th>
                  <th className="p-3">Kunde</th>
                  <th className="p-3">Beschreibung</th>
                  <th className="p-3">Angenommen am</th>
                  <th className="p-3">Fertig bis</th>
                  <th className="p-3">Abgeschlossen am</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {sortedOrders.map((order) => {
                  const overdue = isOverdue(order, today);

                  return (
                    <tr
                      key={order.id}
                      className={`border-b last:border-0 ${
                        overdue ? "bg-red-50" : ""
                      }`}
                    >
                      <td className="p-3">{order.id}</td>
                      <td className="p-3">{order.customer}</td>
                      <td className="p-3">{order.description}</td>

                      <td className="whitespace-nowrap p-3">
                        {formatDate(order.receivedAt)}
                      </td>

                      <td className="whitespace-nowrap p-3">
                        <span
                          className={
                            overdue
                              ? "font-semibold text-red-700"
                              : ""
                          }
                        >
                          {formatDate(order.dueDate)}
                        </span>

                        {overdue && (
                          <span className="mt-1 block text-xs font-medium text-red-700">
                            Überfällig
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap p-3">
                        {formatDate(order.completedAt)}
                      </td>

                      <td className="whitespace-nowrap p-3">
                        {order.status}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<p>Dashboard wird geladen...</p>}>
      <DashboardContent />
    </Suspense>
  );
}
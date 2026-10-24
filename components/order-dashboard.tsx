
"use client";

import { useRef, useState, type SubmitEvent } from "react";

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

const statuses: Status[] = [
  "Offen",
  "In Bearbeitung",
  "Abgeschlossen",
];

const statusColors: Record<Status, string> = {
  Offen: "bg-blue-100 text-blue-800",
  "In Bearbeitung": "bg-amber-100 text-amber-800",
  Abgeschlossen: "bg-green-100 text-green-800",
};

// Heutiges Datum in Deutschland
function getToday(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// Datum in deutsches Format umwandeln
function formatDate(date: string | null): string {
  if (!date) return "–";

  const [year, month, day] = date.split("-");
  return `${day}.${month}.${year}`;
}

// Überfälligkeit prüfen
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

    // Aufträge ohne Fertigstellungstermin nach unten
    if (a.dueDate === null && b.dueDate !== null) return 1;
    if (a.dueDate !== null && b.dueDate === null) return -1;

    // Früheste Fälligkeit zuerst
    if (a.dueDate !== null && b.dueDate !== null) {
      const comparison = a.dueDate.localeCompare(b.dueDate);

      if (comparison !== 0) return comparison;
    }

    // Bei gleicher Fälligkeit älteste Annahme zuerst
    return (
      a.receivedAt.localeCompare(b.receivedAt) ||
      a.id - b.id
    );
  });
}

export default function OrderDashboard({ today, initialOrders }: { today: string, initialOrders: Order[] }) {
  // Aufträge im React-State speichern
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  // Nächste verfügbare Auftrags-ID
  const nextId = useRef(
    Math.max(0, ...initialOrders.map((order) => order.id)) + 1
    // 0 sorgt dafür, dass bei einer leeren Auftragsliste mit 1 begonnen wird
  );

  // Formularzustand
  const [showForm, setShowForm] = useState(false);
  const [customer, setCustomer] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [formError, setFormError] = useState("");
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);

  // Neuen Auftrag erstellen
  function saveOrder(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!customer.trim() || !description.trim()) {
        setFormError(
            "Bitte gib einen Kundennamen und eine Beschreibung ein."
        );
        return;
    }

    if (dueDate && dueDate < getToday()) {
        setFormError(
            "Der Fertigstellungstermin darf nicht in der Vergangenheit liegen."
        );
        return;
    }

    if (editingOrderId !== null) {
        // Bestehenden Auftrag aktualisieren
        setOrders((current) =>
            current.map((order) =>
                order.id === editingOrderId
                    ? {
                        ...order,
                        customer: customer.trim(),
                        description: description.trim(),
                        dueDate: dueDate || null,
                    }
                : order
            )
        );
    } else {
        // Neuen Auftrag erstellen
        const newOrder: Order = {
            id: nextId.current++,
            customer: customer.trim(),
            description: description.trim(),
            status: "Offen",
            receivedAt: getToday(),
            dueDate: dueDate || null,
            completedAt: null,
        };

        setOrders((current) => [...current, newOrder]);
    }

    // Formular zurücksetzen
    setCustomer("");
    setDescription("");
    setDueDate("");
    setFormError("");
    setEditingOrderId(null);
    setShowForm(false);
  }

  // Bestehenden Auftrag bearbeiten
  function editOrder(order: Order) {
    setEditingOrderId(order.id);
    setCustomer(order.customer);
    setDescription(order.description);
    setDueDate(order.dueDate ?? "");
    setFormError("");
    setShowForm(true);

    // Zum Formular nach oben scrollen
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Auftragsstatus ändern
  function changeStatus(id: number, status: Status) {
    const completedDate = getToday();

    setOrders((current) =>
      current.map((order) => {
        if (order.id !== id) return order;

        return {
          ...order,
          status,
          completedAt:
            status === "Abgeschlossen"
              ? order.completedAt ?? completedDate
              : null,
        };
      })
    );
  }

  // Auftrag löschen
  function deleteOrder(id: number) {
    const confirmed = window.confirm(
      `Möchtest du Auftrag #${id} wirklich löschen?`
    );

    if (!confirmed) return;

    setOrders((current) =>
      current.filter((order) => order.id !== id)
    );
  }

  // Sortierte Aufträge
  const sortedOrders = sortOrders(orders);

  // Statistiken berechnen
  const open = orders.filter(
    (order) => order.status === "Offen"
  ).length;

  const inProgress = orders.filter(
    (order) => order.status === "In Bearbeitung"
  ).length;

  const completed = orders.filter(
    (order) => order.status === "Abgeschlossen"
  ).length;

  const overdueCount = orders.filter(
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

        {/* Dashboard-Kopfbereich */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Dashboard
            </h1>

            <p className="mt-2 text-gray-600">
              Verwalte deine Reparaturaufträge.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
                setShowForm(!showForm);
                setEditingOrderId(null);
                setCustomer("");
                setDescription("");
                setDueDate("");
                setFormError("");
            }}
            className="rounded-lg bg-gray-900 px-5 py-3 font-medium text-white hover:bg-gray-700"
          >
            {showForm ? "Abbrechen" : "+ Neuer Auftrag"}
          </button>
        </header>

        {/* Formular zum Erstellen neuer Aufträge */}
        {showForm && (
          <section className="rounded-xl border bg-white p-6">
            <h2 className="mb-5 text-xl font-semibold">
                {editingOrderId !== null
                    ? `Auftrag #${editingOrderId} bearbeiten`
                    : "Neuen Auftrag erstellen"}
            </h2>

            <form onSubmit={saveOrder} className="space-y-4">

              {/* Kundenname */}
              <div>
                <label
                  htmlFor="customer"
                  className="mb-2 block text-sm font-medium"
                >
                  Kundenname
                </label>

                <input
                  id="customer"
                  type="text"
                  required
                  maxLength={120}
                  value={customer}
                  onChange={(e) => {
                    setCustomer(e.target.value);
                    setFormError("");
                  }}
                  className="w-full rounded-lg border p-3"
                  placeholder="Max Müller"
                />
              </div>

              {/* Beschreibung */}
              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-medium"
                >
                  Beschreibung
                </label>

                <textarea
                  id="description"
                  required
                  maxLength={1000}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setFormError("");
                  }}
                  className="w-full rounded-lg border p-3"
                  placeholder="Was soll repariert werden?"
                  rows={3}
                />
              </div>

              {/* Fertigstellungstermin */}
              <div>
                <label
                  htmlFor="dueDate"
                  className="mb-2 block text-sm font-medium"
                >
                  Geplante Fertigstellung (optional)
                </label>

                <input
                  id="dueDate"
                  type="date"
                  min={today}
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    setFormError("");
                  }}
                  className="w-full rounded-lg border p-3"
                />
              </div>

              {formError && (
                <p
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                    {formError}
                </p>
                )}

                <button
                type="submit"
                className="rounded-lg bg-gray-900 px-5 py-3 font-medium text-white hover:bg-gray-700"
                >
                  {editingOrderId !== null
                    ? "Änderungen speichern"
                    : "Auftrag speichern"}
                </button>
            </form>
          </section>
        )}

        {/* Statistikkarten */}
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

        {/* Warnung bei überfälligen Aufträgen */}
        {overdueCount > 0 && (
          <div
            role="status"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"
          >
            {overdueCount}{" "}
            {overdueCount === 1
              ? "Auftrag ist"
              : "Aufträge sind"}{" "}
            überfällig.
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
                  <th className="p-3">Angenommen</th>
                  <th className="p-3">Fertig bis</th>
                  <th className="p-3">Abgeschlossen</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Aktionen</th>
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

                      {/* Auftrags-ID */}
                      <td className="p-3">
                        {order.id}
                      </td>

                      {/* Kunde */}
                      <td className="p-3">
                        {order.customer}
                      </td>

                      {/* Beschreibung */}
                      <td className="p-3">
                        {order.description}
                      </td>

                      {/* Annahmedatum */}
                      <td className="whitespace-nowrap p-3">
                        {formatDate(order.receivedAt)}
                      </td>

                      {/* Fertigstellungstermin */}
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
                          <span className="block text-xs font-medium text-red-700">
                            Überfällig
                          </span>
                        )}
                      </td>

                      {/* Abschlussdatum */}
                      <td className="whitespace-nowrap p-3">
                        {formatDate(order.completedAt)}
                      </td>

                      {/* Status ändern */}
                      <td className="p-3">
                        <select
                          aria-label={`Status für Auftrag ${order.id}`}
                          value={order.status}
                          onChange={(e) =>
                            changeStatus(
                              order.id,
                              e.target.value as Status
                            )
                          }
                          className={`rounded-lg border p-2 text-xs font-medium ${statusColors[order.status]}`}
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Auftrag löschen */}
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => editOrder(order)}
                            aria-label={`Auftrag ${order.id} bearbeiten`}
                            className="rounded-lg px-3 py-2 text-blue-700 hover:bg-blue-50"
                          >
                            Bearbeiten
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteOrder(order.id)}
                            aria-label={`Auftrag ${order.id} löschen`}
                            className="rounded-lg px-3 py-2 text-red-700 hover:bg-red-100"
                          >
                            Löschen
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Leere Auftragstabelle */}
            {orders.length === 0 && (
              <p className="py-8 text-center text-gray-500">
                Noch keine Aufträge vorhanden.
              </p>
            )}
          </div>
        </section>

        <p className="text-center text-xs text-gray-500">
          Demo mit Beispieldaten. Änderungen werden noch nicht
          dauerhaft gespeichert.
        </p>

      </div>
    </main>
  );
}

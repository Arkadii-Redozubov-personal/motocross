"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { api, errText, Toast, useToast, ApiError } from "./shared";
import type { BookingView } from "@/server/services/bookings";
import type { LocationDto, ModelDto } from "@/server/services/catalog";

const STATUS: Record<string, { label: string; cls: string }> = {
  NEW: { label: "Нова", cls: "bg-amber/20 text-amber" },
  CONFIRMED: { label: "Підтверджена", cls: "bg-ok/20 text-ok" },
  REJECTED: { label: "Відхилена", cls: "bg-danger/20 text-danger" },
  CANCELLED: { label: "Скасована", cls: "bg-fg-3/25 text-fg-2" },
};
const NOTIFY: Record<string, string> = { SENT: "e-mail надіслано", FAILED: "e-mail: помилка", NOT_CONFIGURED: "e-mail не налаштовано", PENDING: "e-mail: очікує" };

export function BookingsTab({ models, locations }: { models: ModelDto[]; locations: LocationDto[] }) {
  const [rows, setRows] = useState<BookingView[] | null>(null);
  const [f, setF] = useState({ status: "", date: "", locationId: "", modelId: "", q: "" });
  const [busyId, setBusyId] = useState<number | null>(null);
  const [conflict, setConflict] = useState<{ id: number; refs: string[] } | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    const q = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v && q.set(k, v));
    try {
      const r = await api<{ bookings: BookingView[] }>("GET", `/api/admin/bookings?${q}`);
      setRows(r.bookings);
    } catch (e) { toast.fail(e); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f]);
  useEffect(() => { load(); }, [load]);

  async function act(b: BookingView, action: "confirm" | "reject" | "cancel") {
    if (action === "cancel" && !window.confirm(`Скасувати підтверджену бронь ${b.referenceCode}?`)) return;
    setBusyId(b.id); setConflict(null); toast.clear();
    try {
      await api("PATCH", `/api/admin/bookings/${b.id}/status`, { action });
      toast.ok(`${b.referenceCode}: готово`);
    } catch (e) {
      if (e instanceof ApiError && e.code === "SLOT_CONFLICT") setConflict({ id: b.id, refs: (e.body.conflicts as string[]) ?? [] });
      toast.fail(e);
    }
    setBusyId(null);
    load();
  }
  async function retry(b: BookingView) {
    setBusyId(b.id);
    try {
      const r = await api<{ notification: string }>("POST", `/api/admin/bookings/${b.id}/notify`);
      toast.ok(`${b.referenceCode}: ${NOTIFY[r.notification] ?? r.notification}`);
    } catch (e) { toast.fail(e); }
    setBusyId(null);
    load();
  }

  const sel = "field";
  return (
    <section aria-labelledby="t-bookings" className="space-y-4">
      <h2 id="t-bookings" className="sr-only">Заявки</h2>
      <div className="grid gap-3 rounded-card border border-line bg-card p-4 sm:grid-cols-2 lg:grid-cols-6">
        <label className="block"><span className="label">Статус</span>
          <select className={sel} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            <option value="">Усі</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select></label>
        <label className="block"><span className="label">Дата виїзду</span><input type="date" className={sel} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
        <label className="block"><span className="label">Місто</span>
          <select className={sel} value={f.locationId} onChange={(e) => setF({ ...f, locationId: e.target.value })}>
            <option value="">Усі</option>{locations.map((l) => <option key={l.id} value={l.id}>{l.city.pl}</option>)}
          </select></label>
        <label className="block"><span className="label">Техніка</span>
          <select className={sel} value={f.modelId} onChange={(e) => setF({ ...f, modelId: e.target.value })}>
            <option value="">Уся</option>{models.map((m) => <option key={m.id} value={m.id}>{m.title.pl}</option>)}
          </select></label>
        <label className="block lg:col-span-1"><span className="label">Пошук (ім&apos;я, тел., номер)</span><input className={sel} value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} /></label>
        <div className="flex items-end"><button type="button" className="btn btn-ghost w-full" onClick={load}><RefreshCw size={16} aria-hidden="true" />Оновити</button></div>
      </div>
      <Toast msg={toast.t.msg} kind={toast.t.kind} />
      {rows === null && <p className="text-fg-2">Завантаження…</p>}
      {rows?.length === 0 && <p className="rounded-card border border-line bg-card p-6 text-fg-2">Заявок за цими фільтрами немає. Нові заявки з форми /booking з&apos;являться тут.</p>}
      <ul className="space-y-3">
        {rows?.map((b) => (
          <li key={b.id} className="rounded-card border border-line bg-card p-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="num font-mono text-base font-bold">{b.referenceCode}</span>
              <span className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS[b.status]?.cls}`}>{STATUS[b.status]?.label}</span>
              <span className="num text-fg-2">{b.date} · {b.startTime}–{b.endTime} · {b.city}</span>
              <span className="num ml-auto font-semibold">{b.total} зл</span>
            </div>
            <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
              <div>
                <p className="font-semibold">{b.customerName}</p>
                <p className="num"><a className="underline underline-offset-2" href={`tel:${b.customerPhone.replace(/[^\d+]/g, "")}`}>{b.customerPhone}</a></p>
                {b.customerEmail && <p className="break-all text-fg-2">{b.customerEmail}</p>}
              </div>
              <div>
                {b.items.map((i) => <p key={i.modelId}>{i.qty} × {i.title} <span className="num text-fg-3">({i.unit} зл)</span></p>)}
                {b.addons.length > 0 && <p className="text-fg-2">Додатки: {b.addons.map((a) => a.slug).join(", ")}</p>}
              </div>
              <div className="text-fg-2">
                {b.comment ? <p>«{b.comment}»</p> : <p className="text-fg-3">Без коментаря</p>}
                <p className="mt-1 text-xs text-fg-3">{NOTIFY[b.notificationStatus] ?? b.notificationStatus}{b.notificationError ? ` (${b.notificationError})` : ""}</p>
              </div>
            </div>
            {conflict?.id === b.id && (
              <p role="alert" className="mt-3 rounded-ctl border border-danger/60 p-2 text-sm text-danger">
                Конфлікт зі підтвердженими бронями: {conflict.refs.length ? conflict.refs.join(", ") : "—"}. Відхиліть цю заявку або скасуйте конфліктну бронь.
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {b.status === "NEW" && (<>
                <button type="button" className="btn btn-amber" disabled={busyId === b.id} onClick={() => act(b, "confirm")}>Підтвердити</button>
                <button type="button" className="btn btn-danger" disabled={busyId === b.id} onClick={() => act(b, "reject")}>Відхилити</button>
              </>)}
              {b.status === "CONFIRMED" && <button type="button" className="btn btn-danger" disabled={busyId === b.id} onClick={() => act(b, "cancel")}>Скасувати</button>}
              {b.notificationStatus !== "SENT" && <button type="button" className="btn btn-ghost" disabled={busyId === b.id} onClick={() => retry(b)}>Надіслати e-mail повторно</button>}
            </div>
          </li>
        ))}
      </ul>
      <span className="sr-only">{rows ? errText(null) && "" : ""}</span>
    </section>
  );
}


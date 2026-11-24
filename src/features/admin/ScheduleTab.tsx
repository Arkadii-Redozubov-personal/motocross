"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api, Field, L3Inputs, Toast, UploadButton, useToast, type L3 } from "./shared";
import type { ExceptionDto, LocationDto } from "@/server/services/catalog";

const WD = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const ORDER = [1, 2, 3, 4, 5, 6, 0];

export function ScheduleTab({ locations, exceptions, reload }: { locations: LocationDto[]; exceptions: ExceptionDto[]; reload: () => void }) {
  const [locs, setLocs] = useState(locations);
  const [exc, setExc] = useState(exceptions);
  const toast = useToast();

  async function save() {
    try {
      await api("PUT", "/api/admin/schedules", {
        locations: locs.map((l) => ({ id: l.id, active: l.active, address_pl: l.address.pl, address_uk: l.address.uk, address_ru: l.address.ru })),
        schedules: locs.flatMap((l) => l.schedules.map((s) => ({ location_id: l.id, ...s }))),
        exceptions: exc.map(({ location_id, date_ymd, is_open, open_time, close_time, note }) => ({ location_id, date_ymd, is_open, open_time, close_time, note })),
      });
      toast.ok("Графік збережено. Існуючі бронювання не змінено автоматично.");
      reload();
    } catch (e) { toast.fail(e); }
  }

  return (
    <section aria-labelledby="t-schedule" className="space-y-6">
      <h2 id="t-schedule" className="h3">Графік роботи та міста</h2>
      <Toast msg={toast.t.msg} kind={toast.t.kind} />
      {locs.map((l, li) => (
        <div key={l.id} className="space-y-4 rounded-card border border-line bg-card p-4">
          <div className="flex items-center gap-4">
            <h3 className="h3">{l.city.pl}</h3>
            <label className="flex items-center gap-2"><input type="checkbox" className="size-4 accent-[#f5b700]" checked={l.active} onChange={(e) => setLocs(locs.map((x, i) => (i === li ? { ...x, active: e.target.checked } : x)))} />Місто активне</label>
          </div>
          <L3Inputs label="Адреса / як дістатися" value={l.address} onChange={(v: L3) => setLocs(locs.map((x, i) => (i === li ? { ...x, address: v } : x)))} multiline />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead><tr className="text-left text-fg-3"><th className="py-1 pr-3 font-semibold">День</th><th className="pr-3 font-semibold">Працюємо</th><th className="pr-3 font-semibold">З</th><th className="font-semibold">До</th></tr></thead>
              <tbody>
                {ORDER.map((wd) => {
                  const s = l.schedules.find((x) => x.weekday === wd) ?? { weekday: wd, is_open: false, open_time: "09:00", close_time: "18:00" };
                  const upd = (patch: Partial<typeof s>) => setLocs(locs.map((x, i) => (i === li ? { ...x, schedules: [...x.schedules.filter((y) => y.weekday !== wd), { ...s, ...patch }].sort((a, b) => a.weekday - b.weekday) } : x)));
                  return (
                    <tr key={wd} className="border-t border-line">
                      <th scope="row" className="py-2 pr-3 text-left font-semibold">{WD[wd]}</th>
                      <td className="pr-3"><input type="checkbox" aria-label={`${l.city.pl}: ${WD[wd]} працюємо`} className="size-4 accent-[#f5b700]" checked={s.is_open} onChange={(e) => upd({ is_open: e.target.checked })} /></td>
                      <td className="pr-3"><input type="time" aria-label="Відкриття" className="field num !w-28" value={s.open_time} onChange={(e) => upd({ open_time: e.target.value })} /></td>
                      <td><input type="time" aria-label="Закриття" className="field num !w-28" value={s.close_time} onChange={(e) => upd({ close_time: e.target.value })} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="space-y-3 rounded-card border border-line bg-card p-4">
        <h3 className="h3">Винятки: закрити або відкрити конкретну дату</h3>
        {exc.length === 0 && <p className="text-fg-3">Винятків немає.</p>}
        <ul className="space-y-2">
          {exc.map((x, i) => (
            <li key={i} className="flex flex-wrap items-center gap-2">
              <select aria-label="Місто" className="field !w-auto" value={x.location_id} onChange={(e) => setExc(exc.map((y, j) => (j === i ? { ...y, location_id: Number(e.target.value) } : y)))}>
                {locs.map((l) => <option key={l.id} value={l.id}>{l.city.pl}</option>)}
              </select>
              <input type="date" aria-label="Дата" className="field num !w-40" value={x.date_ymd} onChange={(e) => setExc(exc.map((y, j) => (j === i ? { ...y, date_ymd: e.target.value } : y)))} />
              <select aria-label="Статус" className="field !w-auto" value={x.is_open ? "open" : "closed"} onChange={(e) => setExc(exc.map((y, j) => (j === i ? { ...y, is_open: e.target.value === "open" } : y)))}>
                <option value="closed">Закрито</option><option value="open">Відкрито</option>
              </select>
              {x.is_open && (<>
                <input type="time" aria-label="З" className="field num !w-28" value={x.open_time} onChange={(e) => setExc(exc.map((y, j) => (j === i ? { ...y, open_time: e.target.value } : y)))} />
                <input type="time" aria-label="До" className="field num !w-28" value={x.close_time} onChange={(e) => setExc(exc.map((y, j) => (j === i ? { ...y, close_time: e.target.value } : y)))} />
              </>)}
              <input aria-label="Примітка" placeholder="Примітка" className="field !w-48" value={x.note} onChange={(e) => setExc(exc.map((y, j) => (j === i ? { ...y, note: e.target.value } : y)))} />
              <button type="button" aria-label="Видалити виняток" className="btn btn-ghost !px-3" onClick={() => setExc(exc.filter((_, j) => j !== i))}><Trash2 size={16} aria-hidden="true" /></button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn btn-ghost" onClick={() => setExc([...exc, { id: 0, location_id: locs[0]?.id ?? 1, date_ymd: "", is_open: false, open_time: "09:00", close_time: "18:00", note: "" }])}><Plus size={16} aria-hidden="true" />Додати виняток</button>
      </div>
      <button type="button" className="btn btn-amber" onClick={save}>Зберегти графік</button>
    </section>
  );
}

export { Field, UploadButton };


"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, MapPin, Phone } from "lucide-react";
import type { AddonDto, LocationDto, ModelDto } from "@/server/services/catalog";
import { INTL_TAG, type Locale } from "@/shared/i18n/config";
import type { Dict } from "@/shared/i18n/dictionaries/pl";
import { formatPhoneHref } from "@/features/marketing/ui";

type Day = { date: string; open: boolean; locationId: number | null; slug: string | null };
type Slot = { hm: string; startUtc: string; available: boolean; free: number };
type Quote = { unit: number; subtotal: number; addons: { slug: string; amount: number }[]; total: number };
type Avail = { eligible: number; slots: Slot[]; quote: Quote | null };

export type Initial = { date: string; category: "" | "quad" | "moto"; model: string; qty: number; dur: number; slot: string; addons: string[] };

const PHONE_RE = /^\+?[0-9 ()\-]{7,22}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function BookingWizard(props: { d: Dict; locale: Locale; models: ModelDto[]; addons: AddonDto[]; locations: LocationDto[]; today: string; initial: Initial; phone: string }) {
  const { d, locale, models, addons, locations, today, initial, phone } = props;
  const b = d.booking;
  const tag = INTL_TAG[locale];

  const [date, setDate] = useState(initial.date);
  const [category, setCategory] = useState<"" | "quad" | "moto">(initial.category);
  const [modelSlug, setModelSlug] = useState(initial.model);
  const [qty, setQty] = useState(initial.qty || 1);
  const [dur, setDur] = useState(initial.dur || 0);
  const [slot, setSlot] = useState(initial.slot);
  const [addonSel, setAddonSel] = useState<string[]>(initial.addons);
  const [ym, setYm] = useState((initial.date || today).slice(0, 7));
  const [days, setDays] = useState<Day[] | null>(null);
  const [avail, setAvail] = useState<Avail | null>(null);
  const [availLoading, setAvailLoading] = useState(false);
  const [tick, setTick] = useState(0);

  const [name, setName] = useState("");
  const [phoneVal, setPhoneVal] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [consent, setConsent] = useState(false);
  const [honey, setHoney] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ ref: string } | null>(null);
  const idemKey = useRef("");
  const errRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);

  // Contact fields survive a language switch (not put in the URL: they are personal data).
  useEffect(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem("mq-contact") ?? "{}");
      if (s.name) setName(s.name);
      if (s.phone) setPhoneVal(s.phone);
      if (s.email) setEmail(s.email);
      if (s.comment) setComment(s.comment);
    } catch { /* ignore */ }
    idemKey.current = crypto.randomUUID();
  }, []);
  useEffect(() => {
    sessionStorage.setItem("mq-contact", JSON.stringify({ name, phone: phoneVal, email, comment }));
  }, [name, phoneVal, email, comment]);

  // Keep the booking parameters in the URL (shareable; preserved by the language switcher).
  useEffect(() => {
    const u = new URL(window.location.href);
    const set = (k: string, v: string) => (v ? u.searchParams.set(k, v) : u.searchParams.delete(k));
    set("date", date); set("category", category); set("model", modelSlug); set("qty", qty > 1 ? String(qty) : "");
    set("dur", dur ? String(dur) : ""); set("slot", slot); set("addons", addonSel.join(","));
    window.history.replaceState(null, "", u.toString());
  }, [date, category, modelSlug, qty, dur, slot, addonSel]);

  // Calendar data
  useEffect(() => {
    const ac = new AbortController();
    setDays(null);
    fetch(`/api/availability?month=${ym}`, { signal: ac.signal, cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setDays(j.days))
      .catch(() => {});
    return () => ac.abort();
  }, [ym]);

  const [selDay, setSelDay] = useState<Day | null>(null);
  useEffect(() => {
    if (!days || !date) return;
    const f = days.find((x) => x.date === date);
    if (f) setSelDay(f.open ? f : null);
  }, [days, date]);
  const dayInfo = selDay && selDay.date === date ? selDay : null;
  const locationId = dayInfo?.locationId ?? null;
  const location = locations.find((l) => l.id === locationId);
  const model = models.find((m) => m.slug === modelSlug);
  const durations = useMemo(() => model?.rates.map((r) => r.duration_min) ?? [], [model]);
  const catModels = models.filter((m) => !category || m.category === category);

  useEffect(() => {
    if (model && !durations.includes(dur)) setDur(durations[0] ?? 0);
  }, [model, durations, dur]);
  useEffect(() => {
    if (model && qty > model.units) setQty(Math.max(1, model.units));
  }, [model, qty]);

  // Availability + server-side price
  const addonKey = addonSel.join(",");
  useEffect(() => {
    if (!date || !locationId || !model || !dur || !dayInfo) { setAvail(null); return; }
    const ac = new AbortController();
    setAvailLoading(true);
    const q = new URLSearchParams({ date, locationId: String(locationId), modelId: String(model.id), durationMin: String(dur), qty: String(qty), addons: addonKey });
    fetch(`/api/availability?${q}`, { signal: ac.signal, cache: "no-store" })
      .then((r) => r.json())
      .then((j: Avail) => {
        setAvail(j);
        setSlot((cur) => (cur && j.slots?.some((s) => s.hm === cur && s.available) ? cur : ""));
        setAvailLoading(false);
      })
      .catch((e) => { if (e.name !== "AbortError") setAvailLoading(false); });
    return () => ac.abort();
  }, [date, locationId, model, dur, qty, addonKey, dayInfo, tick]);

  const dur_label = (m: number) => (m % 60 === 0 ? `${m / 60} ${d.common.hours}` : `${m} ${d.common.minutes}`);
  const fmtDate = (ymd: string) => new Intl.DateTimeFormat(tag, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${ymd}T00:00:00Z`));

  const monthLabel = new Intl.DateTimeFormat(tag, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${ym}-01T00:00:00Z`));
  const weekdayNames = [1, 2, 3, 4, 5, 6, 0].map((wd) => new Intl.DateTimeFormat(tag, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 7 + wd))));
  const firstOffset = (new Date(`${ym}-01T00:00:00Z`).getUTCDay() + 6) % 7;
  const shiftMonth = (n: number) => {
    const [y, m] = ym.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1 + n, 1));
    setYm(`${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}`);
  };
  const canPrev = ym > today.slice(0, 7);

  const validate = useCallback(() => {
    const e: Record<string, string> = {};
    if (!date || !locationId) e.date = b.pickDate;
    if (!model) e.model = b.required;
    if (!slot) e.slot = b.needSlot;
    if (name.trim().length < 2) e.name = b.required;
    if (!PHONE_RE.test(phoneVal.trim()) || phoneVal.replace(/\D/g, "").length < 7) e.phone = phoneVal.trim() ? b.badPhone : b.required;
    if (email.trim() && !EMAIL_RE.test(email.trim())) e.email = b.badEmail;
    if (!consent) e.consent = b.needConsent;
    return e;
  }, [date, locationId, model, slot, name, phoneVal, email, consent, b]);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setFormError("");
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0];
      document.getElementById(`f-${first}`)?.focus();
      errRef.current?.focus();
      return;
    }
    setSending(true);
    try {
      const utm: Record<string, string> = {};
      new URL(window.location.href).searchParams.forEach((v, k) => { if (k.startsWith("utm_")) utm[k] = v.slice(0, 100); });
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId, date, startTime: slot, durationMin: dur, modelId: model!.id, qty, addons: addonSel,
          name: name.trim(), phone: phoneVal.trim(), email: email.trim(), comment: comment.trim(), consent: true,
          idempotencyKey: idemKey.current, lang: locale, utm: Object.keys(utm).length ? utm : undefined, website: honey,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.ok) {
        setDone({ ref: j.booking.referenceCode });
        sessionStorage.removeItem("mq-contact");
        setTimeout(() => doneRef.current?.focus(), 50);
      } else {
        const code = (j.code as keyof typeof b.errors) ?? "GENERIC";
        setFormError(b.errors[code] ?? b.errors.GENERIC);
        if (code === "SLOT_TAKEN" || code === "INVALID_SLOT" || code === "PAST_SLOT") setSlot("");
        setTick((t) => t + 1);
        errRef.current?.focus();
      }
    } catch {
      setFormError(b.errors.NETWORK);
      errRef.current?.focus();
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl rounded-card border border-amber/60 bg-card p-8 text-center">
        <span className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-amber text-ink"><Check size={30} aria-hidden="true" /></span>
        <h2 ref={doneRef} tabIndex={-1} className="display text-3xl">{b.successTitle}</h2>
        <p className="mt-4 text-fg-2">{b.successText}</p>
        <p className="mt-6 text-sm text-fg-3">{b.reference}</p>
        <p className="num font-display text-4xl font-bold tracking-widest text-amber">{done.ref}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href={formatPhoneHref(phone)} className="btn btn-amber"><Phone size={18} aria-hidden="true" />{phone}</a>
          <Link href="/" className="btn btn-ghost">{d.common.back}</Link>
        </div>
      </div>
    );
  }

  const selectedAddons = addons.filter((a) => addonSel.includes(a.slug));
  const q = avail?.quote;
  const errList = Object.values(errors);

  return (
    <form onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="space-y-12">
        <div ref={errRef} tabIndex={-1} aria-live="assertive" className={formError || errList.length ? "rounded-ctl border border-danger bg-card p-4 text-danger" : "sr-only"}>
          {formError || (errList.length ? b.errors.VALIDATION : "")}
        </div>

        {/* 1. Date */}
        <fieldset>
          <legend className="h3 mb-4 flex items-center gap-2"><CalendarDays size={22} className="text-amber" aria-hidden="true" />{b.s1}</legend>
          <div className="max-w-md rounded-card border border-line bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <button type="button" onClick={() => shiftMonth(-1)} disabled={!canPrev} aria-label={b.prevMonth} className="grid size-11 place-items-center rounded-ctl border border-line disabled:opacity-30"><ChevronLeft size={20} aria-hidden="true" /></button>
              <p className="font-display text-lg font-semibold uppercase tracking-wide" aria-live="polite">{monthLabel}</p>
              <button type="button" onClick={() => shiftMonth(1)} aria-label={b.nextMonth} className="grid size-11 place-items-center rounded-ctl border border-line"><ChevronRight size={20} aria-hidden="true" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-fg-3" aria-hidden="true">
              {weekdayNames.map((w) => <span key={w} className="py-1">{w}</span>)}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {Array.from({ length: firstOffset }).map((_, i) => <span key={`b${i}`} />)}
              {(days ?? Array.from({ length: new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5), 0)).getUTCDate() }, (_, i) => ({ date: `${ym}-${String(i + 1).padStart(2, "0")}`, open: false, locationId: null, slug: null }))).map((x) => {
                const loc = locations.find((l) => l.id === x.locationId);
                const sel = x.date === date;
                return (
                  <button
                    key={x.date}
                    type="button"
                    disabled={!x.open}
                    aria-pressed={sel}
                    aria-label={x.open ? `${fmtDate(x.date)}, ${loc?.city[locale] ?? ""}` : `${fmtDate(x.date)}, ${b.dayClosed}`}
                    onClick={() => { setSelDay(x); setDate(x.date); setSlot(""); }}
                    className={`num flex aspect-square min-h-11 flex-col items-center justify-center rounded-ctl text-sm transition-colors ${
                      sel ? "bg-amber font-bold text-ink" : x.open ? "bg-card-2 text-fg hover:bg-[#3f434d]" : "text-fg-3/50"
                    } ${!days ? "animate-pulse" : ""}`}
                  >
                    {Number(x.date.slice(8))}
                    {x.open && <span className={`text-[0.6rem] leading-none ${sel ? "text-ink" : "text-amber"}`}>{loc?.city[locale].slice(0, 3)}</span>}
                  </button>
                );
              })}
            </div>
          </div>
          {errors.date && <p id="f-date" tabIndex={-1} className="err">{errors.date}</p>}
          {date && dayInfo && location && (
            <p className="mt-3 flex items-center gap-2 text-fg-2"><MapPin size={18} className="text-amber" aria-hidden="true" />{b.cityOn} <strong className="text-fg">{location.city[locale]}</strong>. {location.address[locale]}</p>
          )}
        </fieldset>

        {/* 2. Equipment */}
        <fieldset disabled={!date || !dayInfo} className="space-y-6 disabled:opacity-50">
          <legend className="h3 mb-4">{b.s2}</legend>
          {!date && <p className="text-fg-2">{b.pickDate}</p>}
          <div role="radiogroup" aria-label={b.category} className="flex flex-wrap gap-2">
            {([["", d.hero.any], ["quad", d.hero.quad], ["moto", d.hero.moto]] as const).map(([k, label]) => (
              <button key={k} type="button" role="radio" aria-checked={category === k}
                onClick={() => { setCategory(k); if (model && k && model.category !== k) { setModelSlug(""); setSlot(""); } }}
                className={`min-h-11 rounded-ctl border px-5 font-display font-semibold uppercase tracking-wider ${category === k ? "border-amber bg-amber text-ink" : "border-line text-fg-2 hover:border-amber"}`}>
                {label}
              </button>
            ))}
          </div>
          <div role="radiogroup" aria-label={b.model} className="grid gap-3 sm:grid-cols-2">
            {catModels.map((m) => {
              const on = m.slug === modelSlug;
              return (
                <button key={m.id} type="button" role="radio" aria-checked={on} id={m === catModels[0] ? "f-model" : undefined}
                  onClick={() => { setModelSlug(m.slug); setCategory(m.category); setSlot(""); }}
                  className={`rounded-card border p-4 text-left transition-colors ${on ? "border-amber bg-[#353840]" : "border-line bg-card hover:border-amber/60"}`}>
                  <span className="flex items-start justify-between gap-2">
                    <span className="font-display text-lg font-semibold uppercase leading-tight">{m.title[locale]}</span>
                    {on && <Check size={20} className="shrink-0 text-amber" aria-hidden="true" />}
                  </span>
                  <span className="mt-1 block text-sm text-fg-2">{d.fleet.units} <span className="num">{m.units}</span>{m.beginner ? ` · ${d.fleet.beginner}` : ""}</span>
                </button>
              );
            })}
          </div>
          {errors.model && <p className="err">{errors.model}</p>}

          {model && (
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="f-qty" className="label">{b.qty} <span className="font-normal text-fg-3">({b.qtyMax} {model.units})</span></label>
                <div className="flex w-40 items-stretch">
                  <button type="button" aria-label="−" onClick={() => setQty((v) => Math.max(1, v - 1))} className="grid min-h-12 w-12 place-items-center rounded-l-ctl border border-[#3e424b] bg-card text-xl">−</button>
                  <input id="f-qty" readOnly value={qty} aria-live="polite" className="num min-h-12 w-full border-y border-[#3e424b] bg-card text-center font-display text-xl" />
                  <button type="button" aria-label="+" onClick={() => setQty((v) => Math.min(model.units, v + 1))} className="grid min-h-12 w-12 place-items-center rounded-r-ctl border border-[#3e424b] bg-card text-xl">+</button>
                </div>
              </div>
              <div role="radiogroup" aria-label={b.duration}>
                <span className="label">{b.duration}</span>
                <div className="flex flex-wrap gap-2">
                  {durations.map((m) => (
                    <button key={m} type="button" role="radio" aria-checked={dur === m} onClick={() => { setDur(m); setSlot(""); }}
                      className={`num min-h-12 rounded-ctl border px-4 font-display font-semibold ${dur === m ? "border-amber bg-amber text-ink" : "border-line text-fg-2 hover:border-amber"}`}>
                      {dur_label(m)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {model && dur > 0 && (
            <div>
              <span className="label">{b.slot}</span>
              <div className="flex flex-wrap gap-2" aria-busy={availLoading}>
                {(avail?.slots ?? []).map((s) => (
                  <button key={s.hm} type="button" disabled={!s.available} aria-pressed={slot === s.hm} id={s === avail?.slots[0] ? "f-slot" : undefined}
                    onClick={() => setSlot(s.hm)}
                    className={`num min-h-12 min-w-[84px] rounded-ctl border px-3 font-display text-lg font-semibold transition-colors ${
                      slot === s.hm ? "border-amber bg-amber text-ink" : s.available ? "border-line bg-card hover:border-amber" : "border-transparent bg-card text-fg-3/60 line-through"
                    }`}>
                    {s.hm}
                  </button>
                ))}
                {availLoading && !avail && <span className="text-fg-3">{d.common.loading}</span>}
              </div>
              {avail && avail.slots.every((s) => !s.available) && <p className="mt-3 text-fg-2">{b.noSlots}</p>}
              {errors.slot && <p className="err">{errors.slot}</p>}
            </div>
          )}
        </fieldset>

        {/* 3. Add-ons */}
        {addons.length > 0 && (
          <fieldset className="space-y-3">
            <legend className="h3 mb-4">{b.s3}</legend>
            {addons.map((a) => (
              <label key={a.id} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-ctl border border-line bg-card px-4 py-2 has-[:checked]:border-amber">
                <input type="checkbox" className="size-5 accent-[#f5b700]" checked={addonSel.includes(a.slug)}
                  onChange={(e) => setAddonSel((cur) => (e.target.checked ? [...cur, a.slug] : cur.filter((x) => x !== a.slug)))} />
                <span className="flex-1">{a.title[locale]}</span>
                <span className="num whitespace-nowrap font-display font-semibold text-amber">
                  {a.amount_pln === 0 ? d.prices.included : `+${a.amount_pln} ${a.pricing_mode === "per_hour" ? d.common.perHour : d.common.zl}`}
                </span>
              </label>
            ))}
          </fieldset>
        )}

        {/* 4. Contact */}
        <fieldset className="space-y-5">
          <legend className="h3 mb-4">{b.s4}</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="f-name" className="label">{b.name} *</label>
              <input id="f-name" className="field" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? "e-name" : undefined} />
              {errors.name && <p id="e-name" className="err">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="f-phone" className="label">{b.phone} *</label>
              <input id="f-phone" type="tel" inputMode="tel" className="field num" autoComplete="tel" placeholder={b.phoneHint} value={phoneVal} onChange={(e) => setPhoneVal(e.target.value)} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "e-phone" : undefined} />
              {errors.phone && <p id="e-phone" className="err">{errors.phone}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="f-email" className="label">{b.email}</label>
            <input id="f-email" type="email" className="field" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? "e-email" : undefined} />
            {errors.email && <p id="e-email" className="err">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="f-comment" className="label">{b.comment}</label>
            <textarea id="f-comment" rows={3} maxLength={1000} className="field" value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label>Website<input tabIndex={-1} autoComplete="off" value={honey} onChange={(e) => setHoney(e.target.value)} /></label>
          </div>
          <div>
            <label className="flex cursor-pointer items-start gap-3">
              <input id="f-consent" type="checkbox" className="mt-1 size-5 shrink-0 accent-[#f5b700]" checked={consent} onChange={(e) => setConsent(e.target.checked)} aria-invalid={!!errors.consent} aria-describedby={errors.consent ? "e-consent" : undefined} />
              <span className="text-sm text-fg-2">{b.consent} <Link href="/privacy" target="_blank" className="underline underline-offset-4 hover:text-amber">{b.consentLink}</Link> *</span>
            </label>
            {errors.consent && <p id="e-consent" className="err">{errors.consent}</p>}
          </div>
        </fieldset>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start" aria-label={b.summary}>
        <div className="rounded-card border border-line bg-card p-5">
          <h2 className="h3 mb-4">{b.summary}</h2>
          <dl className="space-y-3 text-sm">
            {([
              [b.sCity, location?.city[locale]],
              [b.sDate, date ? fmtDate(date) : undefined],
              [b.sTime, slot ? `${slot}${dur ? ` · ${dur_label(dur)}` : ""}` : undefined],
              [b.sItem, model?.title[locale]],
              [b.sQty, model ? String(qty) : undefined],
              [b.sAddons, selectedAddons.length ? selectedAddons.map((a) => a.title[locale]).join(", ") : undefined],
            ] as [string, string | undefined][]).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-line pb-2">
                <dt className="text-fg-3">{k}</dt>
                <dd className="text-right font-medium">{v ?? b.sEmpty}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 flex items-end justify-between">
            <span className="text-fg-2">{b.sTotal}</span>
            <span className="num font-display text-4xl font-bold text-amber" aria-live="polite">{q ? `${q.total} ${d.common.zl}` : b.sEmpty}</span>
          </div>
          <button type="submit" disabled={sending} className="btn btn-amber mt-5 w-full">{sending ? b.sending : b.submit}</button>
          <p className="mt-4 text-sm text-fg-3">{b.notice}</p>
        </div>
      </aside>
    </form>
  );
}

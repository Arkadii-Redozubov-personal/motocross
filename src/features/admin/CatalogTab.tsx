"use client";

import Image from "next/image";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api, Field, L3Inputs, Toast, UploadButton, useToast, type L3 } from "./shared";
import type { AddonDto, LocationDto, ModelDto } from "@/server/services/catalog";

const blank3: L3 = { pl: "", uk: "", ru: "" };

type Draft = {
  id?: number; slug: string; category: "quad" | "moto"; title: L3; desc: L3; specs: L3; beginner_flag: boolean; image_url: string; published: boolean; sort_order: number;
  rates: { duration_min: number; amount_pln: number }[];
};

function toDraft(m: ModelDto): Draft {
  return { id: m.id, slug: m.slug, category: m.category, title: m.title, desc: m.desc, specs: m.specs, beginner_flag: m.beginner, image_url: m.image, published: m.published, sort_order: m.sort, rates: m.rates };
}

export function CatalogTab({ models, addons, locations, reload }: { models: ModelDto[]; addons: AddonDto[]; locations: LocationDto[]; reload: () => void }) {
  const toast = useToast();
  const [edit, setEdit] = useState<Draft | null>(null);
  const [newAsset, setNewAsset] = useState<Record<number, string>>({});
  const [addonDrafts, setAddonDrafts] = useState<Record<number, AddonDto>>({});

  async function saveModel() {
    if (!edit) return;
    try {
      await api("PUT", "/api/admin/catalog", { kind: "model", data: edit });
      toast.ok("Модель збережено. Зміни вже видно на сайті.");
      setEdit(null);
      reload();
    } catch (e) { toast.fail(e); }
  }
  async function saveAsset(a: { id?: number; code: string; model_id: number; location_id: number | null; active: boolean }) {
    try {
      await api("PUT", "/api/admin/catalog", { kind: "asset", data: a });
      toast.ok("Одиницю збережено.");
      reload();
    } catch (e) { toast.fail(e); }
  }
  async function saveAddon(a: AddonDto) {
    try {
      await api("PUT", "/api/admin/catalog", { kind: "addon", data: { id: a.id, title: a.title, pricing_mode: a.pricing_mode, amount_pln: a.amount_pln, active: a.active } });
      toast.ok("Додаток збережено.");
      reload();
    } catch (e) { toast.fail(e); }
  }

  return (
    <section aria-labelledby="t-catalog" className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="t-catalog" className="h3">Моделі та техніка</h2>
        <button type="button" className="btn btn-amber" onClick={() => setEdit({ slug: "", category: "moto", title: { ...blank3 }, desc: { ...blank3 }, specs: { ...blank3 }, beginner_flag: false, image_url: "", published: false, sort_order: models.length, rates: [{ duration_min: 60, amount_pln: 0 }] })}>
          <Plus size={16} aria-hidden="true" />Нова модель
        </button>
      </div>
      <Toast msg={toast.t.msg} kind={toast.t.kind} />

      {edit && (
        <form onSubmit={(e) => { e.preventDefault(); saveModel(); }} className="space-y-4 rounded-card border border-amber/50 bg-card p-5">
          <h3 className="h3">{edit.id ? "Редагування моделі" : "Нова модель"}</h3>
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Slug (латиниця, дефіси)"><input required pattern="[a-z0-9\-]{2,50}" className="field" value={edit.slug} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} /></Field>
            <Field label="Тип"><select className="field" value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value as "quad" | "moto" })}><option value="quad">Квадроцикл</option><option value="moto">Мотоцикл</option></select></Field>
            <Field label="Порядок"><input type="number" className="field" value={edit.sort_order} onChange={(e) => setEdit({ ...edit, sort_order: Number(e.target.value) })} /></Field>
            <div className="flex flex-col justify-end gap-2 pb-1">
              <label className="flex items-center gap-2"><input type="checkbox" className="size-4 accent-[#f5b700]" checked={edit.beginner_flag} onChange={(e) => setEdit({ ...edit, beginner_flag: e.target.checked })} />Для початківців</label>
              <label className="flex items-center gap-2"><input type="checkbox" className="size-4 accent-[#f5b700]" checked={edit.published} onChange={(e) => setEdit({ ...edit, published: e.target.checked })} />Опубліковано</label>
            </div>
          </div>
          <L3Inputs label="Назва" value={edit.title} onChange={(v) => setEdit({ ...edit, title: v })} />
          <L3Inputs label="Короткий опис" value={edit.desc} onChange={(v) => setEdit({ ...edit, desc: v })} multiline />
          <L3Inputs label="Характеристики (розділяйте символом |)" value={edit.specs} onChange={(v) => setEdit({ ...edit, specs: v })} multiline />
          <div className="flex flex-wrap items-end gap-4">
            <Field label="Фото (шлях)" className="min-w-64 flex-1"><input className="field" value={edit.image_url} onChange={(e) => setEdit({ ...edit, image_url: e.target.value })} placeholder="/uploads/…" /></Field>
            <UploadButton onUploaded={(url) => setEdit({ ...edit, image_url: url })} />
            {edit.image_url && <Image src={edit.image_url} alt="" width={96} height={72} className="h-[72px] w-24 rounded-ctl object-cover" />}
          </div>
          <fieldset>
            <legend className="label">Тарифи (хвилини → злоті)</legend>
            <div className="space-y-2">
              {edit.rates.map((r, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <input aria-label="Тривалість, хв" type="number" min={15} step={15} className="field num w-28" value={r.duration_min} onChange={(e) => setEdit({ ...edit, rates: edit.rates.map((x, j) => (j === i ? { ...x, duration_min: Number(e.target.value) } : x)) })} />
                  <span className="text-fg-3">хв</span>
                  <input aria-label="Ціна, зл" type="number" min={0} className="field num w-28" value={r.amount_pln} onChange={(e) => setEdit({ ...edit, rates: edit.rates.map((x, j) => (j === i ? { ...x, amount_pln: Number(e.target.value) } : x)) })} />
                  <span className="text-fg-3">зл</span>
                  <button type="button" aria-label="Видалити тариф" className="btn btn-ghost !px-3" disabled={edit.rates.length < 2} onClick={() => setEdit({ ...edit, rates: edit.rates.filter((_, j) => j !== i) })}><Trash2 size={16} aria-hidden="true" /></button>
                </div>
              ))}
              <button type="button" className="btn btn-ghost" onClick={() => setEdit({ ...edit, rates: [...edit.rates, { duration_min: (edit.rates.at(-1)?.duration_min ?? 0) + 60, amount_pln: 0 }] })}><Plus size={16} aria-hidden="true" />Додати тариф</button>
            </div>
          </fieldset>
          <p className="text-sm text-fg-3">Уже створені заявки зберігають ціну на момент подачі: зміна тарифу їх не торкається.</p>
          <div className="flex gap-2"><button className="btn btn-amber" type="submit">Зберегти</button><button className="btn btn-ghost" type="button" onClick={() => setEdit(null)}>Скасувати</button></div>
        </form>
      )}

      <ul className="space-y-4">
        {models.map((m) => (
          <li key={m.id} className="rounded-card border border-line bg-card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="h3">{m.title.pl}</h3>
              <span className="rounded bg-card-2 px-2 py-0.5 text-xs text-fg-2">{m.category === "quad" ? "Квадроцикл" : "Мотоцикл"}</span>
              {m.beginner && <span className="rounded bg-flame px-2 py-0.5 text-xs font-semibold text-ink">Для початківців</span>}
              {!m.published && <span className="rounded bg-fg-3/30 px-2 py-0.5 text-xs">Приховано</span>}
              <span className="num ml-auto text-sm text-fg-2">{m.rates.map((r) => `${r.duration_min / 60 >= 1 && r.duration_min % 60 === 0 ? r.duration_min / 60 + " год" : r.duration_min + " хв"}: ${r.amount_pln} зл`).join(" · ")}</span>
              <button type="button" className="btn btn-ghost" onClick={() => setEdit(toDraft(m))}>Редагувати</button>
              <button type="button" className="btn btn-ghost" onClick={async () => { try { await api("PUT", "/api/admin/catalog", { kind: "model", data: { ...toDraft(m), published: !m.published } }); toast.ok(m.published ? "Модель приховано." : "Модель опубліковано."); reload(); } catch (e) { toast.fail(e); } }}>{m.published ? "Приховати" : "Опублікувати"}</button>
            </div>
            <div className="mt-3">
              <p className="label">Одиниці техніки ({m.units} активних)</p>
              <ul className="space-y-2">
                {m.assets.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="num w-32 font-mono">{a.code}</span>
                    <select aria-label={`Локація ${a.code}`} className="field !w-auto" value={a.location_id ?? ""} onChange={(e) => saveAsset({ ...a, model_id: m.id, location_id: e.target.value ? Number(e.target.value) : null })}>
                      <option value="">Будь-яке місто</option>
                      {locations.map((l) => <option key={l.id} value={l.id}>{l.city.pl}</option>)}
                    </select>
                    <label className="flex items-center gap-2"><input type="checkbox" className="size-4 accent-[#f5b700]" checked={a.active} onChange={(e) => saveAsset({ ...a, model_id: m.id, active: e.target.checked })} />Активна</label>
                  </li>
                ))}
                <li className="flex flex-wrap items-center gap-2">
                  <input aria-label="Код нової одиниці" placeholder="Код, напр. MOTO-250-04" className="field !w-56" value={newAsset[m.id] ?? ""} onChange={(e) => setNewAsset({ ...newAsset, [m.id]: e.target.value })} />
                  <button type="button" className="btn btn-ghost" disabled={(newAsset[m.id] ?? "").trim().length < 2} onClick={async () => { await saveAsset({ code: newAsset[m.id].trim(), model_id: m.id, location_id: null, active: true }); setNewAsset({ ...newAsset, [m.id]: "" }); }}><Plus size={16} aria-hidden="true" />Додати одиницю</button>
                </li>
              </ul>
            </div>
          </li>
        ))}
      </ul>

      <div>
        <h2 className="h3 mb-3">Додатки</h2>
        <ul className="space-y-3">
          {addons.map((a0) => {
            const a = addonDrafts[a0.id] ?? a0;
            const set = (x: AddonDto) => setAddonDrafts({ ...addonDrafts, [a0.id]: x });
            return (
              <li key={a0.id} className="space-y-3 rounded-card border border-line bg-card p-4">
                <L3Inputs label={`Назва (${a0.slug})`} value={a.title} onChange={(v) => set({ ...a, title: v })} />
                <div className="flex flex-wrap items-end gap-3">
                  <Field label="Тарифікація"><select className="field" value={a.pricing_mode} onChange={(e) => set({ ...a, pricing_mode: e.target.value as AddonDto["pricing_mode"] })}><option value="per_hour">за годину (на заявку)</option><option value="flat">одноразово</option></select></Field>
                  <Field label="Ціна, зл"><input type="number" min={0} className="field num w-28" value={a.amount_pln} onChange={(e) => set({ ...a, amount_pln: Number(e.target.value) })} /></Field>
                  <label className="flex items-center gap-2 pb-2"><input type="checkbox" className="size-4 accent-[#f5b700]" checked={a.active} onChange={(e) => set({ ...a, active: e.target.checked })} />Активний</label>
                  <button type="button" className="btn btn-amber" onClick={() => saveAddon(a)}>Зберегти</button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}


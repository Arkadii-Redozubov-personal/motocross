"use client";

import Image from "next/image";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { api, Field, L3Inputs, Toast, UploadButton, useToast, type L3 } from "./shared";

type Content = {
  contact: { phone: string; email: string; ownerEmail: string; instagramUrl: string; facebookUrl: string };
  texts: { heroTitle: L3; heroSubtitle: L3 };
  promo: { enabled: boolean; title: L3; body: L3 };
  gallery: { id: string; src: string; alt: L3; visible: boolean }[];
};

export function ContentTab({ initial }: { initial: Content }) {
  const [c, setC] = useState(initial);
  const toast = useToast();
  async function save() {
    try { await api("PUT", "/api/admin/content", c); toast.ok("Збережено. Зміни вже видно на сайті."); } catch (e) { toast.fail(e); }
  }
  return (
    <section aria-labelledby="t-content" className="space-y-6">
      <h2 id="t-content" className="h3">Тексти, контакти, акції та фото</h2>
      <Toast msg={toast.t.msg} kind={toast.t.kind} />

      <div className="space-y-4 rounded-card border border-line bg-card p-4">
        <h3 className="h3">Контакти</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Телефон"><input className="field num" value={c.contact.phone} onChange={(e) => setC({ ...c, contact: { ...c.contact, phone: e.target.value } })} /></Field>
          <Field label="E-mail на сайті (необов'язково)"><input type="email" className="field" value={c.contact.email} onChange={(e) => setC({ ...c, contact: { ...c.contact, email: e.target.value } })} /></Field>
          <Field label="E-mail власника для сповіщень про заявки"><input type="email" className="field" value={c.contact.ownerEmail} onChange={(e) => setC({ ...c, contact: { ...c.contact, ownerEmail: e.target.value } })} /></Field>
          <Field label="Instagram (URL)"><input type="url" className="field" value={c.contact.instagramUrl} onChange={(e) => setC({ ...c, contact: { ...c.contact, instagramUrl: e.target.value } })} /></Field>
          <Field label="Facebook (URL)"><input type="url" className="field" value={c.contact.facebookUrl} onChange={(e) => setC({ ...c, contact: { ...c.contact, facebookUrl: e.target.value } })} /></Field>
        </div>
      </div>

      <div className="space-y-4 rounded-card border border-line bg-card p-4">
        <h3 className="h3">Головний екран</h3>
        <p className="text-sm text-fg-3">Порожнє поле означає стандартний текст. Заголовок, якщо заповнений, виводиться одним кольором.</p>
        <L3Inputs label="Заголовок" value={c.texts.heroTitle} onChange={(v) => setC({ ...c, texts: { ...c.texts, heroTitle: v } })} />
        <L3Inputs label="Підзаголовок" value={c.texts.heroSubtitle} onChange={(v) => setC({ ...c, texts: { ...c.texts, heroSubtitle: v } })} multiline />
      </div>

      <div className="space-y-4 rounded-card border border-line bg-card p-4">
        <div className="flex items-center gap-4">
          <h3 className="h3">Акція / блок для груп</h3>
          <label className="flex items-center gap-2"><input type="checkbox" className="size-4 accent-[#f5b700]" checked={c.promo.enabled} onChange={(e) => setC({ ...c, promo: { ...c.promo, enabled: e.target.checked } })} />Показувати на сайті</label>
        </div>
        <L3Inputs label="Заголовок акції" value={c.promo.title} onChange={(v) => setC({ ...c, promo: { ...c.promo, title: v } })} />
        <L3Inputs label="Текст акції" value={c.promo.body} onChange={(v) => setC({ ...c, promo: { ...c.promo, body: v } })} multiline />
      </div>

      <div className="space-y-4 rounded-card border border-line bg-card p-4">
        <h3 className="h3">Галерея</h3>
        <p className="text-sm text-fg-3">JPG, PNG або WebP до 5 МБ. Завантажуйте лише фото, на які маєте права.</p>
        <ul className="space-y-4">
          {c.gallery.map((g, i) => (
            <li key={g.id} className="grid gap-3 rounded-ctl border border-line p-3 md:grid-cols-[120px_1fr_auto]">
              <Image src={g.src} alt="" width={120} height={90} className="h-[90px] w-[120px] rounded-ctl object-cover" />
              <L3Inputs label="Опис фото (alt)" value={g.alt} onChange={(v) => setC({ ...c, gallery: c.gallery.map((x, j) => (j === i ? { ...x, alt: v } : x)) })} />
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2"><input type="checkbox" className="size-4 accent-[#f5b700]" checked={g.visible} onChange={(e) => setC({ ...c, gallery: c.gallery.map((x, j) => (j === i ? { ...x, visible: e.target.checked } : x)) })} />Показувати</label>
                <button type="button" className="btn btn-danger" onClick={() => setC({ ...c, gallery: c.gallery.filter((_, j) => j !== i) })}><Trash2 size={16} aria-hidden="true" />Видалити</button>
              </div>
            </li>
          ))}
        </ul>
        <UploadButton label="Додати фото" onUploaded={(url) => setC({ ...c, gallery: [...c.gallery, { id: `g${Date.now()}`, src: url, alt: { pl: "", uk: "", ru: "" }, visible: true }] })} />
      </div>
      <button type="button" className="btn btn-amber" onClick={save}>Зберегти</button>
    </section>
  );
}


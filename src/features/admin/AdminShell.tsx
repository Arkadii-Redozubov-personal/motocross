"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, KeyRound, CalendarClock, Layers, FileText, ClipboardList } from "lucide-react";
import { BookingsTab } from "./BookingsTab";
import { CatalogTab } from "./CatalogTab";
import { ScheduleTab } from "./ScheduleTab";
import { ContentTab } from "./ContentTab";
import { api, Field, Toast, useToast, type L3 } from "./shared";
import type { AddonDto, ExceptionDto, LocationDto, ModelDto } from "@/server/services/catalog";

type Tab = "bookings" | "catalog" | "schedule" | "content" | "security";

type Props = {
  email: string;
  mustChange: boolean;
  models: ModelDto[];
  addons: AddonDto[];
  locations: LocationDto[];
  exceptions: ExceptionDto[];
  content: {
    contact: { phone: string; email: string; ownerEmail: string; instagramUrl: string; facebookUrl: string; telegramUrl: string };
    texts: { heroTitle: L3; heroSubtitle: L3 };
    promo: { enabled: boolean; title: L3; body: L3 };
    gallery: { id: string; src: string; alt: L3; visible: boolean }[];
  };
};

export function AdminShell(props: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("bookings");
  const [curPw, setCurPw] = useState("");
  const [nextPw, setNextPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const pwToast = useToast();

  const reload = () => router.refresh();

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    window.location.assign("/admin/login");
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    pwToast.clear();
    if (nextPw.length < 10) {
      pwToast.fail(new Error("short"));
      return;
    }
    if (nextPw !== confirmPw) {
      pwToast.fail(new Error("mismatch"));
      return;
    }
    setPwBusy(true);
    try {
      await api("POST", "/api/admin/auth/password", { current: curPw, next: nextPw });
      setCurPw("");
      setNextPw("");
      setConfirmPw("");
      pwToast.ok("Пароль змінено.");
      reload();
    } catch (err) {
      pwToast.fail(err);
    }
    setPwBusy(false);
  }

  const tabs: { id: Tab; label: string; Icon: typeof ClipboardList }[] = [
    { id: "bookings", label: "Заявки", Icon: ClipboardList },
    { id: "catalog", label: "Техніка та ціни", Icon: Layers },
    { id: "schedule", label: "Графік і міста", Icon: CalendarClock },
    { id: "content", label: "Тексти, фото, акції", Icon: FileText },
    { id: "security", label: "Доступ", Icon: KeyRound },
  ];

  return (
    <div className="admin min-h-screen bg-obsidian text-fg">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <span className="font-bold tracking-tight text-fg">Панель власника</span>
            <span className="text-sm text-fg-3">{props.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="btn btn-ghost">На сайт</Link>
            <button type="button" className="btn btn-ghost" onClick={logout}>
              <LogOut size={16} aria-hidden="true" />
              Вийти
            </button>
          </div>
        </div>
        <nav aria-label="Розділи адмін-панелі" className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-current={tab === id ? "page" : undefined}
              onClick={() => setTab(id)}
              className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
                tab === id ? "border-amber text-amber" : "border-transparent text-fg-2 hover:text-fg"
              }`}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {props.mustChange && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-amber/60 bg-card p-4 text-sm">
            <span>Використовується стандартний пароль. Змініть його у вкладці «Доступ».</span>
            <button type="button" className="btn btn-amber" onClick={() => setTab("security")}>Змінити пароль</button>
          </div>
        )}

        {tab === "bookings" && <BookingsTab models={props.models} locations={props.locations} />}
        {tab === "catalog" && <CatalogTab models={props.models} addons={props.addons} locations={props.locations} reload={reload} />}
        {tab === "schedule" && <ScheduleTab locations={props.locations} exceptions={props.exceptions} reload={reload} />}
        {tab === "content" && <ContentTab initial={props.content} />}
        {tab === "security" && (
          <section aria-labelledby="t-sec" className="max-w-lg space-y-4 rounded-card border border-line bg-card p-5">
            <h2 id="t-sec" className="h3">Зміна пароля адміністратора</h2>
            <p className="text-sm text-fg-2">Мінімум 10 символів. Новий пароль набуває чинності одразу.</p>
            <Toast msg={pwToast.t.msg} kind={pwToast.t.kind} />
            <form onSubmit={savePassword} className="space-y-4">
              <Field label="Поточний пароль">
                <input type="password" required autoComplete="current-password" className="field" value={curPw} onChange={(e) => setCurPw(e.target.value)} />
              </Field>
              <Field label="Новий пароль (мін. 10 символів)">
                <input type="password" required minLength={10} autoComplete="new-password" className="field" value={nextPw} onChange={(e) => setNextPw(e.target.value)} />
              </Field>
              <Field label="Повторіть новий пароль">
                <input type="password" required minLength={10} autoComplete="new-password" className="field" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
              </Field>
              <button type="submit" disabled={pwBusy} className="btn btn-amber">{pwBusy ? "Збереження…" : "Оновити пароль"}</button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}


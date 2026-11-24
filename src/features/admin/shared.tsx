"use client";

import { useState } from "react";

export type L3 = { pl: string; uk: string; ru: string };
export const L3_KEYS = ["pl", "uk", "ru"] as const;

export class ApiError extends Error {
  constructor(public status: number, public code: string, public body: Record<string, unknown>) {
    super(code);
  }
}

export async function api<T = Record<string, unknown>>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    cache: "no-store",
  });
  if (res.status === 401) {
    window.location.assign("/admin/login");
    throw new ApiError(401, "UNAUTHORIZED", {});
  }
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, String(j.code ?? "ERROR"), j);
  return j as T;
}

export const ERR_UK: Record<string, string> = {
  VALIDATION: "Перевірте заповнення полів.",
  DUPLICATE: "Такий код або slug уже існує.",
  SLOT_CONFLICT: "Конфлікт: ці одиниці техніки вже зайняті підтвердженою бронню на цей час.",
  INVALID_STATE: "Цю дію не можна виконати в поточному статусі.",
  NOT_FOUND: "Не знайдено.",
  FILE_TOO_LARGE: "Файл більший за 5 МБ.",
  UNSUPPORTED_TYPE: "Дозволені лише JPG, PNG або WebP.",
  INVALID_CREDENTIALS: "Невірні дані.",
  FORBIDDEN_ORIGIN: "Запит відхилено (origin).",
  ERROR: "Помилка. Спробуйте ще раз.",
};

export function errText(e: unknown): string {
  if (e instanceof ApiError) return ERR_UK[e.code] ?? ERR_UK.ERROR;
  return ERR_UK.ERROR;
}

export function Toast({ msg, kind }: { msg: string; kind: "ok" | "err" }) {
  if (!msg) return null;
  return (
    <p role={kind === "err" ? "alert" : "status"} className={`rounded-ctl border px-3 py-2 text-sm ${kind === "ok" ? "border-ok/50 text-ok" : "border-danger/60 text-danger"}`}>
      {msg}
    </p>
  );
}

export function useToast() {
  const [t, setT] = useState<{ msg: string; kind: "ok" | "err" }>({ msg: "", kind: "ok" });
  return { t, ok: (m: string) => setT({ msg: m, kind: "ok" }), fail: (e: unknown) => setT({ msg: errText(e), kind: "err" }), clear: () => setT({ msg: "", kind: "ok" }) };
}

export function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function L3Inputs({ label, value, onChange, multiline = false }: { label: string; value: L3; onChange: (v: L3) => void; multiline?: boolean }) {
  return (
    <fieldset className="grid gap-2 sm:grid-cols-3">
      <legend className="label">{label}</legend>
      {L3_KEYS.map((k) => (
        <label key={k} className="block">
          <span className="sr-only">{`${label} ${k.toUpperCase()}`}</span>
          {multiline ? (
            <textarea rows={3} className="field" placeholder={k.toUpperCase()} value={value[k]} onChange={(e) => onChange({ ...value, [k]: e.target.value })} />
          ) : (
            <input className="field" placeholder={k.toUpperCase()} value={value[k]} onChange={(e) => onChange({ ...value, [k]: e.target.value })} />
          )}
        </label>
      ))}
    </fieldset>
  );
}

export function UploadButton({ onUploaded, label = "Завантажити фото" }: { onUploaded: (url: string) => void; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div>
      <label className="btn btn-ghost cursor-pointer">
        {busy ? "Завантаження…" : label}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={busy}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true); setErr("");
            try {
              const fd = new FormData();
              fd.append("file", f);
              const r = await api<{ url: string }>("POST", "/api/admin/upload", fd);
              onUploaded(r.url);
            } catch (x) { setErr(errText(x)); }
            setBusy(false);
            e.target.value = "";
          }}
        />
      </label>
      {err && <p role="alert" className="err">{err}</p>}
    </div>
  );
}


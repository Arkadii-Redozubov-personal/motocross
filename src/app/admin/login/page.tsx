"use client";

import Link from "next/link";
import { useState } from "react";
import { Lock } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.ok) {
        window.location.assign("/admin");
        return;
      }
      setErr(j.code === "RATE_LIMITED" ? "Забагато спроб. Спробуйте пізніше." : "Невірний e-mail або пароль.");
    } catch {
      setErr("Помилка з'єднання. Спробуйте ще раз.");
    }
    setBusy(false);
  }

  return (
    <main className="admin flex min-h-screen items-center justify-center bg-obsidian px-4 py-12 text-fg">
      <div className="w-full max-w-md rounded-card border border-line bg-card p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-ctl bg-amber text-ink">
            <Lock size={20} aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-xl font-bold">Вхід у панель власника</h1>
            <p className="text-sm text-fg-3">MOTO/QUAD TEREN</p>
          </div>
        </div>
        {err && (
          <p role="alert" className="mb-4 rounded-ctl border border-danger/60 px-3 py-2 text-sm text-danger">
            {err}
          </p>
        )}
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="label">E-mail</span>
            <input
              type="email"
              required
              autoComplete="username"
              className="field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="label">Пароль</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button type="submit" disabled={busy} className="btn btn-amber w-full">
            {busy ? "Вхід…" : "Увійти"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-fg-3">
          <Link href="/" className="underline underline-offset-4 hover:text-amber">
            Повернутися на сайт
          </Link>
        </p>
      </div>
    </main>
  );
}


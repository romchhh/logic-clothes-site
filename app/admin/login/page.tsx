"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MINT = "#B7E1DF";
const INK = "#111111";

const inputClass =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] text-[#111] placeholder-black/35 outline-none transition focus:border-[#111] focus:ring-4 focus:ring-[#B7E1DF]/60";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || "Невірний логін або пароль");
      }
    } catch {
      setError("Помилка з'єднання. Спробуйте ще раз.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12"
      style={{
        background: `radial-gradient(900px 520px at 12% 8%, ${MINT}99 0%, transparent 62%), radial-gradient(760px 480px at 92% 96%, ${MINT}66 0%, transparent 60%), #F6FBFA`,
      }}
    >
      <div className="relative w-full max-w-[420px]">
        <div className="rounded-3xl border border-black/[0.06] bg-white p-8 shadow-[0_24px_60px_-24px_rgba(17,17,17,0.22)] sm:p-10">
          {/* Brand */}
          <div className="mb-9 flex flex-col items-center text-center">
            <span
              className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl text-[15px] font-semibold tracking-tight"
              style={{ background: MINT, color: INK }}
            >
              LC
            </span>
            <h1
              className="text-[28px] font-medium leading-none tracking-tight"
              style={{ color: INK }}
            >
              Logic Clothes
            </h1>
            <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.22em] text-black/45">
              Адмін-панель
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-[13px] font-medium text-black/70"
              >
                Логін
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className={inputClass}
                placeholder="Введіть логін"
                autoComplete="username"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-[13px] font-medium text-black/70"
              >
                Пароль
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={inputClass}
                placeholder="Введіть пароль"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full rounded-xl px-4 py-3.5 text-[15px] font-medium text-white transition hover:bg-black focus:outline-none focus:ring-4 focus:ring-[#B7E1DF]/70 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: INK }}
            >
              {isLoading ? "Вхід..." : "Увійти"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-black/40">
          © {new Date().getFullYear()} Logic Clothes
        </p>
      </div>
    </div>
  );
}

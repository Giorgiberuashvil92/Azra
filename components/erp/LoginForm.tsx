"use client";

import { useEffect, useState } from "react";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

const rememberedCredentialsKey = "azla_remembered_credentials";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@azla.ge");
  const [password, setPassword] = useState("admin123");
  const [rememberCredentials, setRememberCredentials] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const remembered = readRememberedCredentials();
      if (!remembered) return;

      setEmail(remembered.email);
      setPassword(remembered.password);
      setRememberCredentials(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/erp/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("ელფოსტა ან პაროლი არასწორია.");
      }

      const session = await response.json();
      localStorage.setItem("azla_access_token", session.accessToken);
      localStorage.setItem("azla_session", JSON.stringify(session));

      if (rememberCredentials) {
        localStorage.setItem(rememberedCredentialsKey, JSON.stringify({ email, password }));
      } else {
        localStorage.removeItem(rememberedCredentialsKey);
      }

      router.push(
        session.user?.mustChangePassword
          ? "/erp/change-password"
          : "/erp/dashboard",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "შესვლა ვერ შესრულდა.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-indigo-950/8 bg-white p-6 shadow-2xl shadow-[#6857ff]/12 sm:p-8">
      <div className="mb-7 flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-[#f0edff] text-[#5e5bff]">
          <LockKeyhole size={22} />
        </span>
        <div>
          <h2 className="text-2xl font-semibold">სისტემაში შესვლა</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">არსებული მომხმარებლებისთვის</p>
        </div>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-medium text-slate-600">
          ელფოსტა
          <span className="flex items-center gap-3 rounded-2xl border border-indigo-950/8 bg-[#fbfcff] px-4 py-3">
            <Mail className="text-slate-400" size={18} />
            <input
              className="w-full bg-transparent text-[#101936] outline-none placeholder:text-slate-400"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.ge"
              type="email"
              value={email}
            />
          </span>
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-600">
          პაროლი
          <span className="flex items-center gap-3 rounded-2xl border border-indigo-950/8 bg-[#fbfcff] px-4 py-3">
            <ShieldCheck className="text-slate-400" size={18} />
            <input
              className="w-full bg-transparent text-[#101936] outline-none placeholder:text-slate-400"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              type="password"
              value={password}
            />
          </span>
        </label>
        <label className="flex items-center justify-between gap-3 rounded-2xl border border-indigo-950/8 bg-[#fbfcff] px-4 py-3 text-sm font-semibold text-slate-600">
          <span>ელფოსტის და პაროლის დამახსოვრება</span>
          <input
            checked={rememberCredentials}
            className="size-5 accent-[#5e5bff]"
            onChange={(event) => setRememberCredentials(event.target.checked)}
            type="checkbox"
          />
        </label>
        {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
        <button
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#5e5bff] to-[#8d55f7] px-5 py-4 font-semibold text-white shadow-xl shadow-[#6857ff]/20 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? "მოწმდება..." : "სისტემაში შესვლა"}
          <ArrowRight size={18} />
        </button>
      </form>
    </section>
  );
}

function readRememberedCredentials() {
  try {
    const stored = localStorage.getItem(rememberedCredentialsKey);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as { email?: unknown; password?: unknown };
    if (typeof parsed.email !== "string" || typeof parsed.password !== "string") return null;

    return { email: parsed.email, password: parsed.password };
  } catch {
    return null;
  }
}

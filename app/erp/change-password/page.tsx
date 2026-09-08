"use client";

import { useState } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("12345678");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("ახალი პაროლები ერთმანეთს არ ემთხვევა.");
      return;
    }

    if (newPassword === currentPassword) {
      setError("ახალი პაროლი დროებითი პაროლისგან უნდა განსხვავდებოდეს.");
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("azla_access_token");
      const response = await fetch("/api/erp/auth/change-password", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        throw new Error("პაროლის შეცვლა ვერ მოხერხდა.");
      }

      const session = JSON.parse(localStorage.getItem("azla_session") ?? "{}");
      localStorage.setItem(
        "azla_session",
        JSON.stringify({
          ...session,
          user: { ...session.user, mustChangePassword: false },
        }),
      );
      router.push("/erp/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "პაროლის შეცვლა ვერ მოხერხდა.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f8ff] px-5 py-8 text-[#101936]">
      <section className="w-full max-w-xl rounded-[28px] border border-indigo-950/8 bg-white p-6 shadow-2xl shadow-[#6857ff]/12 sm:p-8">
        <span className="grid size-14 place-items-center rounded-2xl bg-[#f0edff] text-[#5e5bff]">
          <LockKeyhole size={26} />
        </span>
        <h1 className="mt-6 text-3xl font-bold">პაროლის შეცვლა</h1>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
          დროებითი პაროლით შესვლის შემდეგ ახალი პაროლის დაყენება აუცილებელია.
        </p>

        <form className="mt-7 grid gap-4" onSubmit={handleSubmit}>
          <PasswordField
            label="დროებითი პაროლი"
            onChange={setCurrentPassword}
            value={currentPassword}
          />
          <PasswordField
            label="ახალი პაროლი"
            onChange={setNewPassword}
            value={newPassword}
          />
          <PasswordField
            label="გაიმეორე ახალი პაროლი"
            onChange={setConfirmPassword}
            value={confirmPassword}
          />

          {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

          <button
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#5e5bff] to-[#8d55f7] px-5 py-4 font-semibold text-white shadow-xl shadow-[#6857ff]/20 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "იცვლება..." : "პაროლის შენახვა"}
            <ArrowRight size={18} />
          </button>
        </form>
      </section>
    </main>
  );
}

function PasswordField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-600">
      {label}
      <span className="flex items-center gap-3 rounded-2xl border border-indigo-950/8 bg-[#fbfcff] px-4 py-3">
        <ShieldCheck className="text-slate-400" size={18} />
        <input
          className="w-full bg-transparent text-[#101936] outline-none placeholder:text-slate-400"
          minLength={8}
          onChange={(event) => onChange(event.target.value)}
          type="password"
          value={value}
        />
      </span>
    </label>
  );
}

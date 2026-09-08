"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const navItems = [
  "მთავარი",
  "შესაძლებლობები",
  "მოდულები",
  "ფასები",
  "რესურსები",
  "ჩვენ შესახებ",
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-indigo-950/5 bg-white/82 text-[#101936] backdrop-blur-xl">
      <div className="mx-auto flex h-18 w-full max-w-[1800px] items-center justify-between px-5 sm:px-8 lg:px-12 2xl:px-16">
        <a href="#" className="flex items-center gap-3" aria-label="AZLA მთავარი">
          <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#5f63ff] to-[#d968e8] text-lg font-black text-white shadow-lg shadow-violet-500/25">
            A
          </span>
          <span className="text-xl font-black tracking-[0.16em]">AZLA</span>
        </a>

        <nav className="hidden items-center gap-7 text-sm font-bold text-[#101936] lg:flex">
          {navItems.map((item) => (
            <a key={item} href="#" className="transition hover:text-[#6857ff]">
              {item}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/erp"
            className="rounded-xl bg-gradient-to-r from-[#5e5bff] to-[#8d55f7] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#6857ff]/25 transition hover:brightness-110"
          >
            სისტემაში შესვლა
          </Link>
        </div>

        <button
          className="grid size-11 place-items-center rounded-xl border border-indigo-950/10 text-[#101936] lg:hidden"
          type="button"
          aria-label="მენიუს გახსნა"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((value) => !value)}
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {isOpen ? (
        <div className="border-t border-indigo-950/5 bg-white px-5 py-5 lg:hidden">
          <nav className="mx-auto flex w-full max-w-[1800px] flex-col gap-4 text-sm font-bold text-[#101936]">
            {navItems.map((item) => (
              <a key={item} href="#" className="rounded-lg px-2 py-2 hover:bg-indigo-50">
                {item}
              </a>
            ))}
            <div className="mt-2 grid gap-3">
              <Link className="rounded-xl bg-gradient-to-r from-[#5e5bff] to-[#8d55f7] px-4 py-3 text-center font-bold text-white" href="/erp">
                სისტემაში შესვლა
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  AlertTriangle,
  Container,
  ArrowLeftRight,
  Wrench,
  PenSquare,
  Users,
  FileText,
  ScrollText,
  Smartphone,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { LogoutButton } from "./logout-button";

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const SECTIONS: NavSection[] = [
  {
    title: "Principal",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ],
  },
  {
    title: "Operação",
    items: [
      { href: "/estoque", icon: Package, label: "Estoque" },
      { href: "/atrasados", icon: AlertTriangle, label: "Atrasados" },
      { href: "/containers", icon: Container, label: "Containers" },
      { href: "/trocas", icon: ArrowLeftRight, label: "Troca" },
      { href: "/manutencao", icon: Wrench, label: "Manutenção" },
      { href: "/manutencao/nova", icon: PenSquare, label: "Lançar Manut." },
    ],
  },
  {
    title: "Gestão",
    items: [
      { href: "/clientes", icon: Users, label: "Clientes" },
      { href: "/relatorios", icon: FileText, label: "Relatórios" },
      { href: "/logs", icon: ScrollText, label: "Logs" },
      { href: "/motoristas", icon: Smartphone, label: "App Motoristas" },
    ],
  },
];

type SidebarProps = {
  profile: {
    nome: string | null;
    role: string;
  };
  userEmail: string;
};

export function Sidebar({ profile, userEmail }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);

  const displayName = profile.nome?.trim() || userEmail;

  return (
    <>
      {/* Botão hambúrguer (só mobile, escondido quando sidebar aberta) */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="fixed left-4 top-4 z-30 rounded-lg border border-border bg-surface p-2 text-text shadow-lg md:hidden"
        >
          <Menu className="size-5" />
        </button>
      )}

      {/* Backdrop mobile */}
      {open && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={close}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col border-r border-border bg-surface transition-transform md:transition-none ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <h1 className="text-lg font-bold leading-tight">
              Caçamba <span className="text-accent">Smart</span>
            </h1>
            <p className="mt-0.5 text-xs text-text-muted">
              Controle de Containers
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Fechar menu"
            className="rounded-md p-1 text-text-muted transition-colors hover:text-text md:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {SECTIONS.map((section) => (
            <div key={section.title} className="mb-6 last:mb-0">
              <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                {section.title}
              </h2>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={close}
                        className={`flex items-center gap-3 rounded-md border-l-2 px-3 py-2 text-sm transition-colors ${
                          active
                            ? "border-accent bg-surface-elevated text-text"
                            : "border-transparent text-text-muted hover:bg-surface-elevated hover:text-text"
                        }`}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer: usuário + logout */}
        <div className="border-t border-border px-4 py-4">
          <div className="mb-3">
            <p className="truncate text-sm font-medium text-text">
              {displayName}
            </p>
            <span className="mt-1 inline-block rounded bg-accent/15 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-accent">
              {profile.role}
            </span>
          </div>
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}

"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useThemePreference, type ThemePreference } from "./theme-store";

const OPCOES: ReadonlyArray<{
  id: ThemePreference;
  label: string;
  icon: typeof Monitor;
}> = [
  { id: "system", label: "Sistema", icon: Monitor },
  { id: "light", label: "Claro", icon: Sun },
  { id: "dark", label: "Escuro", icon: Moon },
];

export function SeletorTema() {
  const { preference, setPreference } = useThemePreference();

  return (
    <div
      role="group"
      aria-label="Aparência do painel"
      className="grid grid-cols-3 gap-1 rounded-[6px] border border-[var(--nx-border)] bg-[var(--nx-surface-subtle)] p-1"
    >
      {OPCOES.map((item) => {
        const ativo = preference === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={ativo}
            onClick={() => setPreference(item.id)}
            className={`inline-flex min-h-[32px] cursor-pointer items-center justify-center gap-1 rounded-[4px] px-2 text-[12px] font-medium transition ${
              ativo
                ? "bg-[var(--nx-bg)] text-[var(--nx-text)] shadow-xs"
                : "text-[var(--nx-text-muted)] hover:text-[var(--nx-text)]"
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

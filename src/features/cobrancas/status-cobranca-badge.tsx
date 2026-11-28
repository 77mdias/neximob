import { AlertCircle, Calendar, CheckCircle2, Clock } from "lucide-react";
import type { SituacaoCobranca } from "@/lib/database.types";
import { formatStatusCobranca } from "@/lib/format";

interface StatusCobrancaBadgeProps {
  situacao: SituacaoCobranca;
  vencimentoIso: string;
  diasAtraso: number;
}

export function StatusCobrancaBadge({
  situacao,
  vencimentoIso,
  diasAtraso,
}: StatusCobrancaBadgeProps) {
  const texto = formatStatusCobranca(situacao, vencimentoIso, diasAtraso);

  const estilo =
    situacao === "pago"
      ? {
          icon: CheckCircle2,
          classes:
            "border-[var(--nx-status-paid-border)] bg-[var(--nx-status-paid-bg)] text-[var(--nx-status-paid-fg)]",
        }
      : situacao === "atrasado"
        ? {
            icon: AlertCircle,
            classes:
              "border-[var(--nx-status-overdue-border)] bg-[var(--nx-status-overdue-bg)] text-[var(--nx-status-overdue-fg)]",
          }
        : situacao === "vence_hoje"
          ? {
              icon: Clock,
              classes:
                "border-[var(--nx-status-today-border)] bg-[var(--nx-status-today-bg)] text-[var(--nx-status-today-fg)]",
            }
          : {
              icon: Calendar,
              classes:
                "border-[var(--nx-status-upcoming-border)] bg-[var(--nx-status-upcoming-bg)] text-[var(--nx-status-upcoming-fg)]",
            };

  const Icon = estilo.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] font-medium whitespace-nowrap ${estilo.classes}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{texto}</span>
    </span>
  );
}

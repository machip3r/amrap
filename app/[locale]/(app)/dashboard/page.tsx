import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Users, UserCheck, AlertTriangle, CreditCard, ArrowRight, MoreVertical } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  const profile = await getProfile();
  if (!profile) redirect(`/${locale}/login`);

  const d = getDictionary(locale);
  const supabase = await createClient();
  const tid = profile.tenant_id;
  const now = new Date().toISOString();

  const { count: total } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tid);

  const { count: active } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tid)
    .gte("membership_expires_at", now);

  const { count: expired } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tid)
    .lt("membership_expires_at", now);

  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const { count: paymentsToday } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tid)
    .gte("created_at", start.toISOString());

  // Format date for the header
  const todayDate = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--color-border)] pb-6">
        <div>
          <h1 className="text-3xl font-title font-bold text-[var(--color-text)]">Resumen Diario</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Métricas de rendimiento y actividad reciente del gimnasio.</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">FECHA</p>
          <p className="text-sm font-medium text-[var(--color-text)]">{todayDate}</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Socios Totales */}
        <div className="glass-panel rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--color-muted)]">
            <span className="text-xs font-bold tracking-wider uppercase">SOCIOS TOTALES</span>
            <Users className="h-4 w-4" />
          </div>
          <div className="mt-4 text-4xl font-title font-bold">{total ?? 0}</div>
        </div>

        {/* Activos */}
        <div className="glass-panel rounded-lg p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-[var(--color-success-bg)] to-transparent pointer-events-none" />
          <div className="flex items-center justify-between text-[var(--color-muted)] relative z-10">
            <span className="text-xs font-bold tracking-wider uppercase">ACTIVOS</span>
            <UserCheck className="h-4 w-4 text-[var(--color-success)]" />
          </div>
          <div className="mt-4 text-4xl font-title font-bold text-[var(--color-success)] relative z-10">{active ?? 0}</div>
        </div>

        {/* Vencidos */}
        <div className="glass-panel rounded-lg p-5 flex flex-col justify-between relative overflow-hidden border-b-2 border-b-[var(--color-primary)]">
          <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-[var(--color-danger-bg)] to-transparent pointer-events-none" />
          <div className="flex items-center justify-between text-[var(--color-muted)] relative z-10">
            <span className="text-xs font-bold tracking-wider uppercase">VENCIDOS</span>
            <AlertTriangle className="h-4 w-4 text-[var(--color-primary)]" />
          </div>
          <div className="mt-4 text-4xl font-title font-bold text-[var(--color-primary)] relative z-10">{expired ?? 0}</div>
        </div>

        {/* Pagos Hoy */}
        <div className="glass-panel rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--color-muted)]">
            <span className="text-xs font-bold tracking-wider uppercase">PAGOS HOY</span>
            <CreditCard className="h-4 w-4" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <div className="text-4xl font-title font-bold">{paymentsToday ?? 0}</div>
            <div className="text-sm text-[var(--color-muted)]">renovaciones</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 glass-panel rounded-lg flex flex-col">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] p-5">
            <h2 className="text-lg font-title font-bold text-[var(--color-text)]">Registro de Accesos</h2>
            <Link href={`/${locale}/checkin`} className="text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] flex items-center gap-1 transition-colors">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          
          <div className="flex-1 p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--color-border)] text-xs uppercase tracking-wider text-[var(--color-muted)]">
                <tr>
                  <th className="p-4 font-medium">SOCIO</th>
                  <th className="p-4 font-medium">HORA</th>
                  <th className="p-4 font-medium">ESTADO DE MEMBRESÍA</th>
                  <th className="p-4 font-medium text-right">ACCIÓN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {/* Mock Row 1 */}
                <tr className="hover:bg-[var(--color-surface-hover)] transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-border)] text-xs font-bold text-[var(--color-muted)]">MR</div>
                    <div className="font-medium text-[var(--color-text)]">Mateo Rojas</div>
                  </td>
                  <td className="p-4 text-[var(--color-muted)]">08:42 AM</td>
                  <td className="p-4">
                    <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-[var(--color-success)]/20 text-[var(--color-success)]">
                      ACTIVO
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-[var(--color-muted)] hover:text-[var(--color-text)]">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
                {/* Mock Row 2 */}
                <tr className="hover:bg-[var(--color-surface-hover)] transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-border)] text-xs font-bold text-[var(--color-muted)]">SL</div>
                    <div className="font-medium text-[var(--color-text)]">Sofía Luna</div>
                  </td>
                  <td className="p-4 text-[var(--color-muted)]">08:35 AM</td>
                  <td className="p-4">
                    <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-[var(--color-primary)] text-white">
                      VENCIDO
                    </span>
                  </td>
                  <td className="p-4 text-right flex items-center justify-end gap-3">
                    <button className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)] border border-[var(--color-border)] rounded px-3 py-1 hover:bg-[var(--color-surface-hover)] transition-colors">
                      RENOVAR
                    </button>
                  </td>
                </tr>
                {/* Mock Row 3 */}
                <tr className="hover:bg-[var(--color-surface-hover)] transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-border)] text-xs font-bold text-[var(--color-muted)]">JG</div>
                    <div className="font-medium text-[var(--color-text)]">Javier Gómez</div>
                  </td>
                  <td className="p-4 text-[var(--color-muted)]">08:15 AM</td>
                  <td className="p-4">
                    <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-[var(--color-success)]/20 text-[var(--color-success)]">
                      ACTIVO
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-[var(--color-muted)] hover:text-[var(--color-text)]">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel rounded-lg flex flex-col">
          <div className="border-b border-[var(--color-border)] p-5">
            <h2 className="text-lg font-title font-bold text-[var(--color-text)]">Capacidad Actual</h2>
          </div>
          
          <div className="flex-1 p-6 flex flex-col items-center justify-center">
            {/* Mock Chart Area */}
            <div className="relative flex h-48 w-48 items-center justify-center rounded-lg bg-[var(--color-surface-hover)] border-4 border-t-[var(--color-primary)] border-r-[var(--color-primary)] border-b-[var(--color-primary)] border-l-transparent mb-6 shadow-inner">
              <div className="text-center">
                <div className="text-5xl font-title font-bold text-[var(--color-text)]">65%</div>
                <div className="mt-1 text-xs font-bold tracking-widest uppercase text-[var(--color-muted)]">OCUPACIÓN</div>
              </div>
            </div>
            
            <div className="w-full border border-[var(--color-border)] rounded-md p-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--color-text)] font-medium">Aforo Máximo</span>
                <span className="text-[var(--color-text)] font-bold">120 personas</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--color-text)] font-medium">Presentes</span>
                <span className="text-[var(--color-primary)] font-bold">78 personas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

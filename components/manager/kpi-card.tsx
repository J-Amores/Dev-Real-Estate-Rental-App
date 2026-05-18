import { priceFormatter } from "@/lib/format";
import type { ManagerKpi } from "@/lib/manager-overview";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function prevMonthShort(now = new Date()): string {
  return MONTHS[(now.getMonth() + 11) % 12];
}

function compactCurrency(n: number): string {
  if (Math.abs(n) >= 1000) {
    const sign = n < 0 ? "-" : "";
    return `${sign}$${(Math.abs(n) / 1000).toFixed(1)}k`;
  }
  return priceFormatter.format(n);
}

export function KpiCard({ kpi }: { kpi: ManagerKpi }) {
  const occupancyPct = kpi.total === 0 ? 0 : Math.round((kpi.occupied / kpi.total) * 100);
  const delta = kpi.mrrDeltaVsPrevMonth;

  return (
    <section className="rounded-lg border border-hairline bg-surface-panel p-5">
      <h2 className="text-title text-ink">This month</h2>
      <p className="text-caption text-ink-soft">Revenue and occupancy at a glance</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-sm bg-accent-evergreen-soft p-4">
          <div className="text-caption font-medium tracking-[0.005em] text-accent-evergreen-deep">
            Monthly rent roll
          </div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-accent-evergreen-deep">
            {compactCurrency(kpi.mrr)}
          </div>
          {delta !== null && (
            <div className="mt-0.5 text-caption tabular-nums text-accent-evergreen-deep/80">
              {delta >= 0 ? "+" : ""}
              {compactCurrency(delta)} vs {prevMonthShort()}
            </div>
          )}
        </div>
        <div className="rounded-sm bg-surface-sunk p-4">
          <div className="text-caption font-medium tracking-[0.005em] text-ink-soft">Occupied</div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-ink">
            {kpi.occupied}/{kpi.total}
          </div>
          <div className="mt-0.5 text-caption tabular-nums text-ink-soft">{occupancyPct}%</div>
        </div>
      </div>

      <dl className="mt-4 divide-y divide-hairline">
        <Row label="Collected" value={priceFormatter.format(kpi.collectedMtd)} />
        <Row label="Outstanding" value={priceFormatter.format(kpi.outstandingMtd)} />
        <Row label="Vacant units" value={kpi.vacantCount === 0 ? "—" : String(kpi.vacantCount)} />
        <Row
          label="Open applications"
          value={kpi.openAppsCount === 0 ? "—" : String(kpi.openAppsCount)}
        />
        <Row
          label="Expiring within 60 days"
          value={kpi.expiringSoonCount === 0 ? "—" : String(kpi.expiringSoonCount)}
        />
      </dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className="text-caption text-ink-soft">{label}</dt>
      <dd className="text-label font-medium tabular-nums text-ink">{value}</dd>
    </div>
  );
}

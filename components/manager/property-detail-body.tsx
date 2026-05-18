import Link from "next/link";

import { DeletePropertyButton } from "@/components/delete-property-button";
import { StatusChip } from "@/components/manager/status-chip";
import { buttonClassName } from "@/components/ui/button";
import { dateFormatter, priceFormatter } from "@/lib/format";
import { PLACEHOLDER } from "@/lib/images";
import type { PropertyDetail } from "@/lib/manager-overview";
import { humanize } from "@/lib/utils";

const MONTH_DAY = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

type LedgerPill = { cls: string; text: string };

function pillFor(
  status: PropertyDetail["payments"][number]["status"],
  dueDate: Date,
  paymentDate: Date | null,
): LedgerPill {
  if (status === "Paid" || status === "PartiallyPaid") {
    const label = status === "Paid" ? "Paid" : "Partial";
    return {
      cls: "bg-accent-evergreen-soft text-accent-evergreen-deep",
      text: `${label} · ${MONTH_DAY.format(paymentDate ?? dueDate)}`,
    };
  }
  if (status === "Overdue") {
    return {
      cls: "bg-signal-danger/15 text-signal-danger",
      text: `Late · ${MONTH_DAY.format(dueDate)}`,
    };
  }
  return {
    cls: "bg-surface-sunk text-ink-soft",
    text: `Due · ${MONTH_DAY.format(dueDate)}`,
  };
}

export function PropertyDetailBody({
  detail,
  hideViewFullLease = false,
}: {
  detail: PropertyDetail;
  hideViewFullLease?: boolean;
}) {
  const cover = detail.photoUrls[0] ?? PLACEHOLDER;

  return (
    <div className="overflow-hidden rounded-lg border border-hairline bg-surface-paper">
      <div className="relative aspect-[21/8] overflow-hidden bg-surface-sunk">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cover} alt="" className="h-full w-full object-cover" />
        <span className="absolute top-3 left-3">
          <StatusChip status={detail.status} size="md" />
        </span>
      </div>

      <div className="px-6 py-5">
        <h2 className="text-headline text-ink">{detail.name}</h2>
        <p className="text-caption text-ink-soft">
          {humanize(detail.type)} · {detail.location.city}, {detail.location.state} · Listed{" "}
          {dateFormatter.format(detail.postedDate)}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {detail.activeLease ? (
            <>
              <Stat label="Monthly rent" value={priceFormatter.format(detail.monthlyRent)} />
              <Stat label="Lease ends" value={dateFormatter.format(detail.activeLease.endDate)} />
              <Stat label="Collected YTD" value={priceFormatter.format(detail.collectedYtd)} />
            </>
          ) : (
            <>
              <Stat label="Ask price" value={priceFormatter.format(detail.pricePerMonth)} />
              <Stat label="Listed" value={dateFormatter.format(detail.postedDate)} />
              <Stat label="Applications" value={String(detail.applicationsCount)} />
            </>
          )}
        </div>

        {detail.overdue && (
          <div className="mt-4 rounded-sm bg-signal-danger/10 px-4 py-3 text-caption text-signal-danger">
            Overdue: {priceFormatter.format(detail.overdue.totalAmount)} ·{" "}
            {detail.overdue.oldestDaysLate} day{detail.overdue.oldestDaysLate === 1 ? "" : "s"}
          </div>
        )}

        {detail.activeLease ? (
          <div className="mt-4 flex items-center gap-3 rounded-sm border border-hairline bg-surface-panel p-4">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent-evergreen-soft text-label font-semibold text-accent-evergreen-deep">
              {initials(detail.activeLease.tenant.name)}
            </span>
            <div className="flex-1">
              <div className="text-label font-medium text-ink">{detail.activeLease.tenant.name}</div>
              <div className="text-caption text-ink-soft">
                {detail.activeLease.tenant.email} · {detail.activeLease.tenant.phoneNumber} · since{" "}
                {dateFormatter.format(detail.activeLease.startDate)}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-sm border border-hairline bg-surface-panel p-4">
            <div className="text-label font-medium text-ink">No active lease.</div>
            <div className="mt-1 text-caption text-ink-soft">
              {detail.applicationsCount === 0
                ? "No applications yet."
                : `${detail.applicationsCount} application${detail.applicationsCount === 1 ? "" : "s"} received.`}
            </div>
            {detail.applicationsCount > 0 && (
              <div className="mt-3">
                <Link
                  href={`/dashboard/applications?propertyId=${detail.id}`}
                  className={buttonClassName({ variant: "secondary" })}
                >
                  View applications
                </Link>
              </div>
            )}
          </div>
        )}

        {detail.activeLease && (
          <>
            <div className="mt-5 text-caption uppercase tracking-[0.05em] text-ink-soft">
              Payment history
            </div>
            {detail.payments.length === 0 ? (
              <p className="mt-2 text-caption text-ink-soft">No payments yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-hairline">
                {detail.payments.map((pay, i) => {
                  const pill = pillFor(pay.status, pay.dueDate, pay.paymentDate);
                  return (
                    <li
                      key={i}
                      className="flex items-center justify-between py-2 text-label"
                    >
                      <span className="tabular-nums text-ink">
                        {pay.dueDate.toLocaleString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <span
                        className={`rounded-xs px-2 py-1 text-caption font-medium ${pill.cls}`}
                      >
                        {pill.text}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {!hideViewFullLease && (
            <Link
              href={`/dashboard/properties/${detail.id}`}
              className={buttonClassName({ variant: "primary" })}
            >
              View full page
            </Link>
          )}
          <Link
            href={`/dashboard/properties/${detail.id}/edit`}
            className={buttonClassName({ variant: "secondary" })}
          >
            Edit listing
          </Link>
          <span
            title="Coming soon. Distinct from delete property."
            className={`${buttonClassName({ variant: "ghost" })} cursor-not-allowed opacity-50`}
            aria-disabled
          >
            End lease
          </span>
          <DeletePropertyButton propertyId={detail.id} variant="page" />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm bg-surface-sunk p-3">
      <div className="text-caption text-ink-soft">{label}</div>
      <div className="mt-1 text-label font-semibold tabular-nums text-ink">{value}</div>
    </div>
  );
}

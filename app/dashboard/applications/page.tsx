import { ApplicationStatus } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ApplicationCard } from "@/components/application-card";
import { EmptyState } from "@/components/empty-state";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUS_ORDER: ApplicationStatus[] = [
  ApplicationStatus.Pending,
  ApplicationStatus.Approved,
  ApplicationStatus.Denied,
];

type SearchParams = Promise<{ status?: string }>;

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  if (session.user.role === "tenant") {
    return <TenantView tenantId={session.user.id} />;
  }
  const params = await searchParams;
  return <ManagerView managerId={session.user.id} statusParam={params.status} />;
}

async function TenantView({ tenantId }: { tenantId: string }) {
  const rows = await prisma.application.findMany({
    where: { tenantId },
    orderBy: { applicationDate: "desc" },
    include: {
      property: { include: { location: true } },
      lease: { select: { startDate: true, endDate: true } },
    },
  });

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<DocumentIcon />}
        title="No applications yet"
        description="Apply to a listing and your applications will show up here."
        cta={{ href: "/search", label: "Browse listings" }}
      />
    );
  }

  const byStatus = new Map<ApplicationStatus, typeof rows>();
  for (const status of STATUS_ORDER) byStatus.set(status, []);
  for (const row of rows) byStatus.get(row.status)!.push(row);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-headline text-ink">Your applications</h1>
        <p className="text-body text-ink-soft">
          Track where each application stands.
        </p>
      </header>

      {STATUS_ORDER.map((status) => {
        const group = byStatus.get(status)!;
        if (group.length === 0) return null;
        return (
          <section key={status} className="flex flex-col gap-3">
            <h2 className="text-title text-ink">
              {status}{" "}
              <span className="text-ink-faint tabular-nums">({group.length})</span>
            </h2>
            <ul className="flex flex-col gap-3">
              {group.map((row) => (
                <li key={row.id}>
                  <ApplicationCard
                    role="tenant"
                    application={{
                      id: row.id,
                      status: row.status,
                      applicationDate: row.applicationDate,
                      name: row.name,
                      email: row.email,
                      phoneNumber: row.phoneNumber,
                      message: row.message,
                      property: {
                        id: row.property.id,
                        name: row.property.name,
                        pricePerMonth: row.property.pricePerMonth,
                        photoUrls: row.property.photoUrls,
                        location: {
                          city: row.property.location.city,
                          state: row.property.location.state,
                        },
                      },
                      lease: row.lease,
                    }}
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}

function parseStatus(raw: string | undefined): ApplicationStatus {
  if (!raw) return ApplicationStatus.Pending;
  const match = STATUS_ORDER.find((s) => s.toLowerCase() === raw.toLowerCase());
  return match ?? ApplicationStatus.Pending;
}

async function ManagerView({
  managerId,
  statusParam,
}: {
  managerId: string;
  statusParam: string | undefined;
}) {
  const status = parseStatus(statusParam);

  const [rows, counts] = await Promise.all([
    prisma.application.findMany({
      where: { status, property: { managerId } },
      orderBy: { applicationDate: "desc" },
      include: {
        property: { include: { location: true } },
        lease: { select: { startDate: true, endDate: true } },
      },
    }),
    prisma.application.groupBy({
      by: ["status"],
      where: { property: { managerId } },
      _count: { _all: true },
    }),
  ]);

  const countByStatus = new Map<ApplicationStatus, number>(
    STATUS_ORDER.map((s) => [s, 0]),
  );
  for (const row of counts) countByStatus.set(row.status, row._count._all);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-headline text-ink">Applications</h1>
        <p className="text-body text-ink-soft">
          Review applications across your properties.
        </p>
      </header>

      <nav
        aria-label="Filter by status"
        className="flex items-center gap-1 border-b border-hairline"
      >
        {STATUS_ORDER.map((s) => {
          const active = s === status;
          const count = countByStatus.get(s) ?? 0;
          return (
            <Link
              key={s}
              href={`/dashboard/applications?status=${s}`}
              aria-current={active ? "page" : undefined}
              className={`-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2 text-label font-medium tracking-[0.005em] transition-colors ${
                active
                  ? "border-accent-evergreen text-ink"
                  : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              <span>{s}</span>
              <span className="text-ink-faint tabular-nums">({count})</span>
            </Link>
          );
        })}
      </nav>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-hairline bg-surface-paper p-10 text-center">
          <p className="text-body text-ink-soft">
            No {status.toLowerCase()} applications.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.id}>
              <ApplicationCard
                role="manager"
                application={{
                  id: row.id,
                  status: row.status,
                  applicationDate: row.applicationDate,
                  name: row.name,
                  email: row.email,
                  phoneNumber: row.phoneNumber,
                  message: row.message,
                  property: {
                    id: row.property.id,
                    name: row.property.name,
                    pricePerMonth: row.property.pricePerMonth,
                    photoUrls: row.property.photoUrls,
                    location: {
                      city: row.property.location.city,
                      state: row.property.location.state,
                    },
                  },
                  lease: row.lease,
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function DocumentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7"
      aria-hidden
    >
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  );
}

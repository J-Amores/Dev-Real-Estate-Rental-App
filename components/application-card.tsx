import type { ApplicationStatus } from "@prisma/client";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { updateApplicationStatusAction } from "@/lib/actions";
import { APPLICATION_STATUS_COLOR } from "@/lib/application-status";
import { dateFormatter, priceFormatter } from "@/lib/format";
import { PLACEHOLDER } from "@/lib/images";

type ApplicationView = {
  id: number;
  status: ApplicationStatus;
  applicationDate: Date;
  name: string;
  email: string;
  phoneNumber: string;
  message: string | null;
  property: {
    id: number;
    name: string;
    pricePerMonth: number;
    photoUrls: string[];
    location: { city: string; state: string };
  };
  lease: { startDate: Date; endDate: Date } | null;
};

type Props = {
  application: ApplicationView;
  role: "tenant" | "manager";
};

export function ApplicationCard({ application, role }: Props) {
  const { property } = application;
  const cover = property.photoUrls[0] ?? PLACEHOLDER;

  return (
    <Card variant="listing" className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Link
          href={`/properties/${property.id}`}
          className="block w-full shrink-0 overflow-hidden rounded-photo bg-surface-sunk sm:w-40"
          aria-label={`View ${property.name}`}
        >
          <div className="relative aspect-[16/10] sm:aspect-[4/3]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        </Link>

        <div className="flex w-full flex-col gap-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <Link
                href={`/properties/${property.id}`}
                className="text-title text-ink hover:underline"
              >
                {property.name}
              </Link>
              <p className="text-caption text-ink-soft tabular-nums">
                <span className="font-medium text-ink">
                  {priceFormatter.format(property.pricePerMonth)} / mo
                </span>
                <span className="mx-1.5 text-ink-faint" aria-hidden>·</span>
                <span>
                  {property.location.city}, {property.location.state}
                </span>
              </p>
            </div>
            <StatusPill status={application.status} />
          </div>

          <p className="text-caption text-ink-soft">
            Applied {dateFormatter.format(application.applicationDate)}
          </p>

          {role === "manager" && (
            <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-caption text-ink-soft sm:grid-cols-[auto_1fr]">
              <dt className="text-ink-faint">Applicant</dt>
              <dd className="text-ink">{application.name}</dd>
              <dt className="text-ink-faint">Email</dt>
              <dd>
                <a
                  href={`mailto:${application.email}`}
                  className="text-accent-evergreen hover:underline"
                >
                  {application.email}
                </a>
              </dd>
              <dt className="text-ink-faint">Phone</dt>
              <dd className="tabular-nums">{application.phoneNumber}</dd>
            </dl>
          )}

          {application.message && (
            <p className="rounded-sm bg-surface-sunk p-3 text-caption text-ink whitespace-pre-line">
              {application.message}
            </p>
          )}

          {application.lease && (
            <p className="text-caption text-ink-soft tabular-nums">
              Lease {dateFormatter.format(application.lease.startDate)} –{" "}
              {dateFormatter.format(application.lease.endDate)}
            </p>
          )}
        </div>
      </div>

      {role === "manager" && application.status === "Pending" && (
        <div className="flex items-center justify-end gap-2 border-t border-hairline pt-3">
          <form action={updateApplicationStatusAction.bind(null, application.id)}>
            <input type="hidden" name="status" value="Denied" />
            <Button type="submit" variant="ghost">
              Deny
            </Button>
          </form>
          <form action={updateApplicationStatusAction.bind(null, application.id)}>
            <input type="hidden" name="status" value="Approved" />
            <Button type="submit" variant="primary">
              Approve
            </Button>
          </form>
        </div>
      )}
    </Card>
  );
}

function StatusPill({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-xs px-2 py-1 text-caption font-medium ${APPLICATION_STATUS_COLOR[status]}`}
    >
      {status}
    </span>
  );
}

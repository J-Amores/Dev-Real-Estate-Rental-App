import Link from "next/link";

type FooterLink = { label: string; href: string };

const FOR_RENTERS: FooterLink[] = [
  { label: "Browse properties", href: "/search" },
  { label: "Sign in", href: "/signin" },
];

const FOR_HOSTS: FooterLink[] = [
  { label: "Become a host", href: "/signup" },
  { label: "Sign in", href: "/signin" },
];

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-surface-paper">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper"
              aria-label="Real Estate App, home"
            >
              <span className="block size-7 text-accent-evergreen">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.svg" alt="" className="h-full w-full" />
              </span>
              <span className="text-title text-ink">Real Estate App</span>
            </Link>
            <p className="mt-4 max-w-[40ch] text-body text-ink-soft">
              A calmer way to rent. Built for hosts with three properties, not
              three hundred.
            </p>
          </div>

          <FooterColumn heading="For renters" links={FOR_RENTERS} />
          <FooterColumn heading="For hosts" links={FOR_HOSTS} />
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-caption text-ink-faint">
            © {new Date().getFullYear()} Real Estate App. Built as an MVP.
          </p>
          <p className="text-caption text-ink-faint">
            Crafted in the spirit of small-scale hosts.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: FooterLink[];
}) {
  return (
    <div>
      <h3 className="text-label font-medium text-ink">{heading}</h3>
      <ul className="mt-4 space-y-2">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link
              href={l.href}
              className="text-body text-ink-soft transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-ink focus-visible:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper motion-reduce:transition-none"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

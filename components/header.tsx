import Link from "next/link";

import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions";

export function Header({ email }: { email: string }) {
  return (
    <header className="flex items-center justify-between border-b border-hairline bg-surface-paper px-6 py-3">
      <Link href="/" className="text-label font-semibold text-ink">
        Real Estate App
      </Link>
      <div className="flex items-center gap-4">
        <span className="text-label text-ink-soft">{email}</span>
        <form action={signOutAction}>
          <Button type="submit" variant="ghost">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}

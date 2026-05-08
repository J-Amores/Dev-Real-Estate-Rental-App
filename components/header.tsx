import Link from "next/link";

import { signOutAction } from "@/lib/actions";

export function Header({ email }: { email: string }) {
  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-3">
      <Link href="/" className="text-sm font-semibold">
        Real Estate App
      </Link>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{email}</span>
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}

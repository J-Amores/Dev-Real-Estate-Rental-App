import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  let status: string;
  let detail: string | null = null;

  try {
    const count = await prisma.property.count();
    status = `DB OK — ${count} properties seeded`;
  } catch (err) {
    status = "DB error";
    detail = err instanceof Error ? err.message : String(err);
  }

  return (
    <main className="min-h-screen flex items-center justify-center font-mono p-8">
      <div className="max-w-2xl w-full">
        <h1 className="text-headline text-ink mb-2">Real Estate App</h1>
        <p className="text-body text-ink-soft mb-6">Phase 1 walking skeleton</p>
        <div className="rounded-md border border-hairline bg-surface-paper p-4">
          <p className="text-body font-medium text-ink">{status}</p>
          {detail && (
            <pre className="mt-3 text-caption whitespace-pre-wrap text-signal-danger">
              {detail}
            </pre>
          )}
        </div>
      </div>
    </main>
  );
}

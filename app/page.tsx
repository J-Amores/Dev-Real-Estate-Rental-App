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
        <h1 className="text-2xl font-semibold mb-2">Real Estate App</h1>
        <p className="text-sm text-gray-500 mb-6">Phase 1 walking skeleton</p>
        <div className="border rounded-md p-4">
          <p className="font-medium">{status}</p>
          {detail && (
            <pre className="mt-3 text-xs whitespace-pre-wrap text-red-600">
              {detail}
            </pre>
          )}
        </div>
      </div>
    </main>
  );
}

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-7 w-48 rounded-sm bg-surface-sunk motion-safe:animate-pulse" />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-3 rounded-lg border border-hairline bg-surface-panel p-5">
          <div className="h-5 w-32 rounded-sm bg-surface-sunk motion-safe:animate-pulse" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-24 rounded-sm bg-surface-sunk motion-safe:animate-pulse" />
            <div className="h-24 rounded-sm bg-surface-sunk motion-safe:animate-pulse" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-5 w-full rounded-sm bg-surface-sunk motion-safe:animate-pulse"
            />
          ))}
        </div>
        <div className="space-y-4">
          <div className="aspect-[16/7] rounded-lg bg-surface-sunk motion-safe:animate-pulse" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[16/10] rounded-lg bg-surface-sunk motion-safe:animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

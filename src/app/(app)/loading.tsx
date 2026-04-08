export default function AppLoading() {
  return (
    <div className="grid gap-6">
      <div className="h-40 animate-pulse rounded-[var(--radius)] bg-white/60" />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-[var(--radius)] bg-white/60"
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="h-[420px] animate-pulse rounded-[var(--radius)] bg-white/60" />
        <div className="h-[420px] animate-pulse rounded-[var(--radius)] bg-white/60" />
      </div>
    </div>
  );
}

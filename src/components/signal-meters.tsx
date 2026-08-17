import type { Signal } from "@/lib/forensics";
import { cn } from "@/lib/utils";

export function SignalMeters({
  signals,
  dimmed,
}: {
  signals: Signal[];
  dimmed?: boolean;
}) {
  if (!signals.length) return null;
  return (
    <ul
      className={cn(
        "grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2",
        dimmed && "opacity-60",
      )}
    >
      {signals.map((s) => (
        <li key={s.id} className="min-w-0">
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="text-xs font-medium tracking-wide text-fg">{s.label}</span>
            <span className="font-mono text-[11px] tabular-nums text-subtle">
              {s.humanEnd}
              <span className="mx-1.5 text-faint">/</span>
              {s.machineEnd}
            </span>
          </div>
          <div className="relative h-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-accent/80 transition-[width] duration-300 ease-out"
              style={{ width: `${Math.round(s.value * 100)}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs leading-snug text-subtle">{s.note}</p>
        </li>
      ))}
    </ul>
  );
}

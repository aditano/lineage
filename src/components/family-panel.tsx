import { FAMILY_META, type FamilyScore, type ModelFamily } from "@/lib/forensics";
import { cn } from "@/lib/utils";

export function FamilyPanel({
  family,
  scores,
}: {
  family: ModelFamily;
  scores: FamilyScore[];
}) {
  const shown = scores.filter((s) => s.id !== "other" || s.score > 0.08);
  const meta = family in FAMILY_META ? FAMILY_META[family as keyof typeof FAMILY_META] : null;

  return (
    <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] md:p-6">
      <div className="mb-5">
        <p className="text-xs font-medium tracking-wide text-subtle uppercase">House style</p>
        <h3 className="mt-1 font-display text-2xl tracking-tight text-fg italic">
          {meta?.label ?? "Unclear"}
        </h3>
        <p className="mt-1.5 max-w-prose text-sm text-muted">{meta?.blurb}</p>
      </div>
      <ul className="space-y-3">
        {shown.map((s) => {
          const active = s.id === family || (family === "mixed" && s.score > 0.2);
          return (
            <li key={s.id}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className={cn("text-sm", active ? "text-fg" : "text-muted")}>{s.label}</span>
                <span className="font-mono text-xs tabular-nums text-subtle">
                  {Math.round(s.score * 100)}
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-300 ease-out",
                    active ? "bg-accent" : "bg-accent/35",
                  )}
                  style={{ width: `${Math.round(s.score * 100)}%` }}
                />
              </div>
              {s.reasons.length > 0 && (
                <p className="mt-1 text-xs text-subtle">{s.reasons.slice(0, 2).join(" · ")}</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

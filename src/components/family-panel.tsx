import { FAMILY_META, type FamilyScore, type ModelCall, type ModelFamily } from "@/lib/forensics";
import { cn } from "@/lib/utils";

export function FamilyPanel({
  family,
  scores,
  modelCall,
}: {
  family: ModelFamily;
  scores: FamilyScore[];
  modelCall: ModelCall;
}) {
  const ranked = [...scores].sort((a, b) => b.score - a.score);
  const shown = ranked.filter((score, index) => index < 5 || score.id === family);
  const meta = family in FAMILY_META ? FAMILY_META[family as keyof typeof FAMILY_META] : null;

  return (
    <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] md:p-6">
      <div className="mb-5">
        <p className="text-xs font-medium tracking-wide text-subtle uppercase">House style</p>
        <h3 className="mt-1 font-display text-2xl tracking-tight text-fg italic">
          {meta?.label ?? "Unclear"}
        </h3>
        <p className="mt-1.5 max-w-prose text-sm text-muted">{meta?.blurb}</p>
        <ModelLine family={family} call={modelCall} />
      </div>
      <ul className="space-y-3">
        {shown.map((score) => {
          const active = score.id === family || (family === "mixed" && score.score > 0.2);
          return (
            <li key={score.id}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className={cn("text-sm", active ? "text-fg" : "text-muted")}>
                  {score.label}
                </span>
                <span className="font-mono text-xs tabular-nums text-subtle">
                  {Math.round(score.score * 100)}
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-300 ease-out",
                    active ? "bg-accent" : "bg-accent/35",
                  )}
                  style={{ width: `${Math.round(score.score * 100)}%` }}
                />
              </div>
              {score.reasons.length > 0 && (
                <p className="mt-1 text-xs text-subtle">{score.reasons.slice(0, 2).join(" · ")}</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ModelLine({ family, call }: { family: ModelFamily; call: ModelCall }) {
  if (call.resolution === "exact") {
    return (
      <div className="mt-4 border-t border-border pt-3" data-testid="model-call">
        <p className="font-mono text-[11px] tracking-wide text-subtle uppercase">
          Named in the text
        </p>
        <p className="mt-1 font-display text-xl italic tracking-tight text-fg">{call.exactName}</p>
        {call.evidence[0] ? <p className="mt-1 text-xs text-subtle">{call.evidence[0]}</p> : null}
      </div>
    );
  }
  if (call.resolution === "generation") {
    return (
      <div className="mt-4 border-t border-border pt-3" data-testid="model-call">
        <p className="font-mono text-[11px] tracking-wide text-subtle uppercase">
          Closest generation
        </p>
        <p className="mt-1 font-display text-xl italic tracking-tight text-fg">{call.label}</p>
        {call.evidence.length > 0 ? (
          <p className="mt-1 text-xs text-subtle">{call.evidence.slice(0, 2).join(" · ")}</p>
        ) : null}
      </div>
    );
  }
  if (family === "human" || call.resolution === "unresolved") {
    return family === "human" ? null : (
      <p className="mt-3 text-xs text-subtle" data-testid="model-call">
        No house style strong enough to name a model.
      </p>
    );
  }
  return (
    <p className="mt-3 text-xs text-subtle" data-testid="model-call">
      Checkpoint unresolved. The house style is the claim.
    </p>
  );
}

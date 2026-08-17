import type { ForensicReport } from "@/lib/forensics";
import { cn } from "@/lib/utils";

const VERDICT_COPY: Record<ForensicReport["verdict"], string> = {
  "likely-human": "Likely human",
  "leaning-human": "Leaning human",
  mixed: "Mixed signals",
  "leaning-ai": "Leaning machine",
  "likely-ai": "Likely machine",
};

export function VerdictCard({ report }: { report: ForensicReport }) {
  const machine = report.aiLikelihood >= 50;
  const band = VERDICT_COPY[report.verdict];

  return (
    <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] md:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-subtle uppercase">Machine likelihood</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={cn(
                "font-display text-6xl leading-none tracking-tight tabular-nums md:text-7xl",
                machine ? "text-machine" : "text-human",
              )}
            >
              {report.aiLikelihood}
            </span>
            <span className="font-mono text-sm text-subtle">/100</span>
          </div>
          <p className="mt-3 font-display text-xl italic tracking-tight text-fg">{band}</p>
        </div>
        <ConfidenceRing value={report.confidence} />
      </div>

      <p className="mt-5 max-w-prose text-sm leading-relaxed text-muted">{report.summary}</p>

      {report.briefing ? (
        <blockquote className="mt-5 border-l border-border-strong pl-4 text-sm leading-relaxed text-fg">
          {report.briefing}
        </blockquote>
      ) : null}

      <p className="mt-4 font-mono text-[11px] tabular-nums text-subtle">
        {report.wordCount} words · {report.sentenceCount} sentences · avg{" "}
        {report.avgSentence} w/sent · confidence {report.confidence}
        {report.source === "merged" ? " · briefed" : " · local read"}
      </p>
    </section>
  );
}

function ConfidenceRing({ value }: { value: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
        <circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-surface-2"
          strokeWidth="3"
        />
        <circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-accent"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 26 26)"
        />
      </svg>
      <span className="font-mono text-[10px] tracking-wide text-subtle uppercase">conf.</span>
    </div>
  );
}

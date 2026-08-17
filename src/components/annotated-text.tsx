import type { ReactNode } from "react";
import type { Tell } from "@/lib/forensics";
import { cn } from "@/lib/utils";

export function AnnotatedText({ text, tells }: { text: string; tells: Tell[] }) {
  if (!text) return null;
  const sorted = [...tells].sort((a, b) => a.start - b.start);
  const nodes: ReactNode[] = [];
  let cursor = 0;
  sorted.forEach((t, i) => {
    const start = Math.max(0, Math.min(text.length, t.start));
    const end = Math.max(start, Math.min(text.length, t.end));
    if (start < cursor) return;
    if (start > cursor) {
      nodes.push(<span key={`p-${i}`}>{text.slice(cursor, start)}</span>);
    }
    nodes.push(
      <mark
        key={`m-${i}`}
        title={t.note}
        className={cn(
          "rounded-xs px-0.5 py-px",
          t.leans === "human"
            ? "bg-human/20 text-fg"
            : t.leans === "grok"
              ? "bg-accent/15 text-fg"
              : "bg-machine/20 text-fg",
        )}
      >
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  });
  if (cursor < text.length) {
    nodes.push(<span key="tail">{text.slice(cursor)}</span>);
  }

  return (
    <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] md:p-6">
      <p className="text-xs font-medium tracking-wide text-subtle uppercase">Marked phrases</p>
      <p className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap font-display text-base leading-relaxed text-fg">
        {nodes}
      </p>
      {tells.length > 0 ? (
        <ul className="mt-4 space-y-2 border-t border-border pt-4">
          {tells.slice(0, 8).map((t, i) => (
            <li key={`${t.start}-${i}`} className="flex gap-3 text-sm">
              <span className="shrink-0 font-mono text-[11px] tracking-wide text-subtle uppercase">
                {t.leans === "ai" ? "ai" : t.leans}
              </span>
              <span className="text-muted">
                <span className="text-fg">“{t.phrase.trim()}”</span>
                <span className="text-subtle"> — {t.note}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-subtle">No stock phrases jumped out. Rhythm still counts.</p>
      )}
    </section>
  );
}

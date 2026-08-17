import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Eraser, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SignalMeters } from "@/components/signal-meters";
import { VerdictCard } from "@/components/verdict-card";
import { FamilyPanel } from "@/components/family-panel";
import { AnnotatedText } from "@/components/annotated-text";
import { analyzeText, type ForensicReport } from "@/lib/forensics";
import { runDeepAnalysis } from "@/lib/analyze";
import { SAMPLES } from "@/lib/samples";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [text, setText] = useState("");
  const [committed, setCommitted] = useState<ForensicReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [usedModel, setUsedModel] = useState<boolean | null>(null);

  const live = useMemo(() => (text.trim().length >= 8 ? analyzeText(text) : null), [text]);

  useEffect(() => {
    setCommitted(null);
    setUsedModel(null);
  }, [text]);

  const wordCount = live?.wordCount ?? 0;

  async function analyze() {
    const trimmed = text.trim();
    if (trimmed.length < 24) {
      toast("Need a short paragraph at least — about twenty words.");
      return;
    }
    setBusy(true);
    setCommitted(analyzeText(trimmed));
    try {
      const result = await runDeepAnalysis({ data: { text: trimmed } });
      if (result.ok) {
        setCommitted(result.report);
        setUsedModel(result.usedModel);
      } else {
        toast(result.error);
        setUsedModel(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed.";
      toast(message);
      setUsedModel(false);
    } finally {
      setBusy(false);
    }
  }

  function loadSample(id: string) {
    const sample = SAMPLES.find((s) => s.id === id);
    if (!sample) return;
    setText(sample.text);
    setCommitted(analyzeText(sample.text));
    setUsedModel(false);
  }

  const report = committed ?? (wordCount >= 20 ? live : null);

  return (
    <main className="flex-1 px-5 pb-20 pt-10 md:px-8 md:pt-14">
      <div className="mx-auto max-w-6xl">
        <header className="stagger-in mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] tracking-[0.18em] text-subtle uppercase">
            Forensic read · not a verdict
          </p>
          <h1 className="mt-4 font-display text-[2.35rem] leading-[1.08] tracking-tight text-fg italic sm:text-5xl md:text-6xl">
            Where did this writing come from?
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-sm leading-relaxed text-muted md:text-base">
            Paste a paragraph. Lineage measures cadence and stock phrasing, then names the
            closest house style — Claude, ChatGPT, Gemini, or Grok — and says when it cannot.
          </p>
        </header>

        <div className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-2">
          {SAMPLES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => loadSample(s.id)}
              className="h-10 rounded-md px-3 text-xs tracking-wide text-muted shadow-[var(--shadow-border)] transition-[color,box-shadow,background-color] duration-150 hover:bg-surface hover:text-fg hover:shadow-[var(--shadow-border-hover)]"
            >
              Try {s.title}
            </button>
          ))}
        </div>

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <div className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)] md:p-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <label htmlFor="source" className="text-xs font-medium tracking-wide text-subtle uppercase">
                  Source
                </label>
                {text ? (
                  <button
                    type="button"
                    onClick={() => {
                      setText("");
                      setCommitted(null);
                    }}
                    className="inline-flex h-8 items-center gap-1.5 text-xs text-subtle transition-colors hover:text-fg"
                  >
                    <Eraser className="size-3.5" />
                    Clear
                  </button>
                ) : null}
              </div>
              <Textarea
                id="source"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste the writing here. A paragraph is enough. A page is better."
                spellCheck={false}
              />
              <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-mono text-[11px] tabular-nums text-subtle">
                  {wordCount} words
                  {live ? ` · ${live.sentenceCount} sentences` : ""}
                  {text.length >= 8000 ? " · truncated at 8k" : ""}
                </p>
                <Button
                  type="button"
                  onClick={() => void analyze()}
                  disabled={busy}
                  className="w-full sm:w-auto"
                >
                  {busy ? (
                    <>
                      <LoaderCircle className="animate-spin" />
                      Reading
                    </>
                  ) : (
                    <>
                      Run full read
                      <ArrowRight />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {live && wordCount >= 8 ? (
              <div className="mt-6 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] md:p-6">
                <div className="mb-4 flex items-baseline justify-between gap-3">
                  <p className="text-xs font-medium tracking-wide text-subtle uppercase">
                    Live signals
                  </p>
                  <p className="text-xs text-subtle">Updates as you type</p>
                </div>
                <SignalMeters signals={live.signals} dimmed={busy} />
              </div>
            ) : (
              <p className="mt-5 px-1 text-sm text-subtle">
                Signals appear after a sentence or two. Full read asks a second opinion and
                writes a short briefing.
              </p>
            )}
          </div>

          <div className="lg:col-span-5">
            {report && (committed || wordCount >= 20) ? (
              <div className={cn("stagger-in space-y-4", busy && "opacity-80")}>
                <VerdictCard report={report} />
                <FamilyPanel family={report.family} scores={report.familyScores} />
                <AnnotatedText text={text} tells={report.tells} />
                {usedModel === false && committed ? (
                  <p className="px-1 text-xs text-subtle">
                    Briefing model unavailable — this is the local forensic read only.
                  </p>
                ) : null}
                <ul className="space-y-2 px-1">
                  {report.caveats.map((c) => (
                    <li key={c} className="text-xs leading-relaxed text-subtle">
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <aside className="rounded-xl bg-surface p-5 text-sm leading-relaxed text-muted shadow-[var(--shadow-border)] md:p-6">
                <p className="font-display text-lg italic text-fg">What you get that the cheap sites skip</p>
                <ul className="mt-4 space-y-3">
                  <li>A family guess — not just “87% AI.”</li>
                  <li>The phrases that triggered it, marked in the text.</li>
                  <li>An honest confidence band. Short samples stay humble.</li>
                  <li>No 99.9. Formal humans and edited drafts look alike, and we say so.</li>
                </ul>
              </aside>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/method")({ component: Method });

function Method() {
  return (
    <main className="flex-1 px-5 py-12 md:px-8 md:py-16">
      <article className="mx-auto max-w-2xl">
        <p className="font-mono text-[11px] tracking-[0.18em] text-subtle uppercase">Method</p>
        <h1 className="mt-3 font-display text-4xl tracking-tight text-fg italic md:text-5xl">
          How Lineage actually reads
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted">
          Most detectors sell a single percentage and hide the work. Lineage is a forensic
          desk: local linguistic signals first, a model briefing second, and a house-style
          guess when the evidence is there.
        </p>

        <section className="mt-12">
          <h2 className="font-display text-2xl italic tracking-tight text-fg">Two passes</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Typing is enough for the first pass. Burstiness, stock phrases, outline bones,
            register, and lived detail update on the page.{" "}
            <span className="text-fg">Run full read</span> sends the text to a second opinion
            (Grok) with those stats as a prior. The two scores are blended. If the briefing
            is down, you still have the local read — not a spinner and a shrug.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl italic tracking-tight text-fg">The signals</h2>
          <dl className="mt-4 space-y-5">
            <Pair
              term="Burstiness"
              def="Variance in sentence length. Models often keep a metronome. People lurch — a six-word punch, then a long aside."
            />
            <Pair
              term="Stock phrasing"
              def="A phrase bank of assistant manners: Certainly, delve, tapestry, I hope this helps, here’s a breakdown, I want to be careful, look, honestly."
            />
            <Pair
              term="Register"
              def="Contractions, heat, and spoken reductions versus pressed-suit diction."
            />
            <Pair
              term="Outline bones"
              def="Markdown headings, numbered thirds, key-takeaway scaffolding."
            />
            <Pair
              term="Lexical weave"
              def="A moving type-token ratio. Mid and even is a common default. Idiosyncratic peaks are not."
            />
            <Pair
              term="Lived detail"
              def="Names, numbers, places, wet shoes. Generators can invent them; they usually don’t, not like this."
            />
          </dl>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl italic tracking-tight text-fg">House styles</h2>
          <dl className="mt-4 space-y-5">
            <Pair
              term="ChatGPT"
              def="Polite scaffolding. Brochure verbs. Tidy lists of three. Closers that offer more help."
            />
            <Pair
              term="Claude"
              def="Em-dashes, hypotaxis, collaborative hedging, and a habit of naming the tension before the answer."
            />
            <Pair
              term="Gemini"
              def="Breakdowns, takeaways, restated questions, and a tour-guide “let’s explore.”"
            />
            <Pair
              term="Grok"
              def="Punchy, sided, contracted. Will call the offsite expensive group therapy."
            />
          </dl>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl italic tracking-tight text-fg">What we will not claim</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
            <li>No 99.9. The cap is honest because the overlap is real.</li>
            <li>A family name is the closest house style, not a watermark from the lab.</li>
            <li>Heavily edited drafts, style prompts, and formal essays will muddy the read.</li>
            <li>Short samples stay low-confidence on purpose.</li>
          </ul>
        </section>

        <p className="mt-12 text-sm text-subtle">
          <Link to="/" className="text-fg underline-offset-4 hover:underline">
            Back to the desk
          </Link>
        </p>
      </article>
    </main>
  );
}

function Pair({ term, def }: { term: string; def: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-fg">{term}</dt>
      <dd className="mt-1 text-sm leading-relaxed text-muted">{def}</dd>
    </div>
  );
}

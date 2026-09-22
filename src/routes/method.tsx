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
          Most detectors sell a single percentage and hide the work. Lineage is a forensic desk:
          local linguistic signals first, a model briefing second, and a name — family, generation,
          or exact — only as far as the evidence reaches.
        </p>

        <section className="mt-12">
          <h2 className="font-display text-2xl italic tracking-tight text-fg">Two passes</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Typing is enough for the first pass. Burstiness, stock phrases, outline bones, register,
            and lived detail update on the page. <span className="text-fg">Run full read</span>{" "}
            sends the text to a second opinion (Grok) with those stats as a prior. The two scores
            are blended. If the briefing is down, you still have the local read — not a spinner and
            a shrug.
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
          <h2 className="font-display text-2xl italic tracking-tight text-fg">
            How far the name goes
          </h2>
          <dl className="mt-4 space-y-5">
            <Pair
              term="Exact"
              def="Only when the writing identifies a version in its own voice: “I am GPT-4o, a language model trained by OpenAI,” “Claude 3.5 Sonnet,” “Grok 4.7.” A sticker, a quote, or “she announced” does not count. “I’m ChatGPT” names the product, not a checkpoint."
            />
            <Pair
              term="Generation"
              def="A style band inside the house: GPT-3.5, GPT-4, GPT-4o, the o-series, Claude 3, Claude 4, Gemini 1.5, Gemini 2.5, Grok 3, Grok 4, DeepSeek V3, DeepSeek-R1, Llama 3. It takes at least two independent cues, or one signature as strong as a reasoning-trace tag. A later checkpoint that shares the voice — GPT-5.6, Claude Opus 5 — is exact only when named."
            />
            <Pair
              term="Family"
              def="The house is clear and the generation is not. ChatGPT, Claude, Gemini, Grok, DeepSeek, Llama."
            />
            <Pair
              term="Unresolved"
              def="Short text, a single borrowed word, or two houses at once. One “delve” in a diary stays a diary."
            />
          </dl>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl italic tracking-tight text-fg">House styles</h2>
          <dl className="mt-4 space-y-5">
            <Pair
              term="ChatGPT"
              def="Early ChatGPT still says certainly and hopes this helps. GPT-4 writes brochure. Later ChatGPT gets shorter: short version, quick take, want me to. The o-series shows its work."
            />
            <Pair
              term="Claude"
              def="Claude 3 hedges, names the tension, and reaches for the em dash. Claude 4 is more direct: I’ll be direct, worth separating, skip the preamble."
            />
            <Pair
              term="Gemini"
              def="Gemini 1.5 gives you the breakdown and the takeaways. Gemini 2.5 leans on at-a-glance lines and inline bold."
            />
            <Pair
              term="Grok"
              def="Grok 3 will say look, here’s the thing, hot take. Grok 4 still picks a side, then talks about the actual constraint and what it would ship."
            />
            <Pair
              term="DeepSeek"
              def="V3 inventories key points. R1 leaves the reasoning trace in the page, including a think tag."
            />
            <Pair
              term="Llama"
              def="Opens with Sure and closes with Remember. Open-model helpfulness, without the brochure."
            />
          </dl>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl italic tracking-tight text-fg">
            What the tests lock
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            <span className="text-fg">npm test</span> runs the desk corpus and the policy
            invariants. On the clear set the family has to be right. On the model set the generation
            has to be the one we named, with no exact claim. Exact cases have to match the version
            string. Traps — a diary that says “delve,” a quoted “I am GPT-4o,” an academic paragraph
            with “in conclusion” — must not receive a model. Short text abstains. The briefing is
            not allowed to mint an exact name the local pass did not see, and a disagreement between
            the two passes drops the checkpoint.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            That suite is a regression lock on this desk, not a field accuracy for every model in
            the wild. Surface style cannot separate two checkpoints that were trained to sound
            alike. We stop at the generation when that is the truth.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl italic tracking-tight text-fg">
            What we will not claim
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
            <li>No 99.9. The cap is honest because the overlap is real.</li>
            <li>A generation is a style band, not a watermark from the lab.</li>
            <li>
              An exact model is a claim the text made about itself, checked against a quote and a
              sticker.
            </li>
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

# Lineage

Lineage is a writing-origin desk. Paste a paragraph and it estimates whether the writing reads as machine-made, then names a house style only as far as the evidence reaches.

Live site: [aditano.github.io/lineage](https://aditano.github.io/lineage/)

Source: [github.com/aditano/lineage](https://github.com/aditano/lineage)

The live site is the GitHub Pages build from `main`. That build is static. The local forensic pass runs in the browser. A second briefing needs a server and an xAI key, so the Pages site stays on the local read.

## Features

- Live signals as you type: burstiness, stock phrasing, register, outline bones, lexical weave, and lived detail.
- A human or machine read with an honest ceiling. One borrowed phrase is not a verdict.
- A house style when the cues agree: Claude, ChatGPT, Gemini, Grok, DeepSeek, or Llama.
- A generation when several cues separate it, such as GPT-4, Claude 3, the o-series, or DeepSeek-R1.
- An exact model only when the text identifies a version in its own voice.
- Abstention on short text, a single tell, or two houses at once.
- The triggering phrases marked in the passage, plus sample passages and a Method page.
- An optional Grok briefing that blends with the local read when `XAI_API_KEY` is set. If that briefing is down, the local read still stands.
- Attribution tests that fail the build if family, generation, exact-name, or trap cases slip.

## Run locally

Node.js 22, matching the GitHub Actions workflows.

```bash
npm install
npm run dev
```

Open [http://localhost:8080](http://localhost:8080).

```bash
npm test
npm run typecheck
npm run verify
```

`npm test` locks the attribution policy. `npm run verify` prints the confusion matrix.

Export `XAI_API_KEY` before `npm run dev` if you want the optional second-pass briefing. Without that key, Run full read uses the local forensic pass only. The Pages build does the same: `npm run build:pages` with `GITHUB_PAGES=1` and `VITE_AUTH_ENABLED=false`.

Sign-in is optional. The desk works without an account. With no `DATABASE_URL`, local auth uses an in-memory PGLite database.

## Tech stack

- TypeScript, React 19, and Vite
- TanStack Start and TanStack Router
- Tailwind CSS 4
- Nitro for the server build
- Node.js test runner
- Optional xAI API for the briefing, Better Auth, and PGLite or Postgres when you configure them

## License

Copyright (C) 2026 Anthony DiTano.

Lineage is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. The full license is in [LICENSE](LICENSE).

Third-party assets and code keep their own licenses. They are exceptions to this grant:

- `public/__grok/` holds Grok install artwork, the Grok logo, and icons. That material stays under its owners' terms.
- IBM Plex Sans, IBM Plex Mono, and Newsreader are loaded from Google Fonts under the SIL Open Font License 1.1. They are not bundled in this repository.
- Packages declared in `package.json` keep the licenses recorded in `package-lock.json` (including MIT, Apache-2.0, ISC, BSD, and MPL-2.0). This GPL does not relicense them.

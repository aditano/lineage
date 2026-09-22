# Lineage

A writing-origin desk. Paste a paragraph and Lineage estimates whether it reads machine-made, then names a house style — Claude, ChatGPT, Gemini, Grok, DeepSeek, or Llama. When the cues separate, it names a generation (GPT-4, Claude 3, the o-series, DeepSeek-R1). It names an exact model only when the text identifies a version, and it abstains when a single borrowed phrase is the whole case.

Live: [aditano.github.io/lineage](https://aditano.github.io/lineage/) · source on [`aditano/lineage`](https://github.com/aditano/lineage)

The local forensic pass (cadence, stock phrasing, register, outline bones, lived detail) runs entirely in the browser. A second “full read” briefing is optional and needs a server with an xAI key; on GitHub Pages you still get the local read.

## Develop

```bash
npm install
npm run dev
npm test
npm run verify
```

`npm test` locks the attribution policy: family accuracy on the clear set, exact generation ids, no exact-model claim without a self-identification, and trap passages that must not receive a model. `npm run verify` prints the confusion matrix.

## GitHub Pages

Hosted at [aditano.github.io/lineage](https://aditano.github.io/lineage/).

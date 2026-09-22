import type { ModelFamily, ModelId } from "./types.ts";

export type CorpusTier = "clear" | "model" | "exact" | "product" | "trap" | "short";

export type CorpusCase = {
  id: string;
  tier: CorpusTier;
  text: string;
  /** Expected house style for clear, model, exact, and product tiers. */
  family?: ModelFamily;
  /** Expected catalog id for model and exact tiers. */
  model?: ModelId;
  /** Substring or pattern the exact name must satisfy. */
  exactName?: string;
  /** Trap cases may land on any of these, and must not name a model. */
  allow?: ModelFamily[];
};

export const CORPUS: readonly CorpusCase[] = [
  {
    id: "clear-human-text",
    tier: "clear",
    family: "human",
    text: `ok so the 6:40 was already gone and I didnt see the text till I was on the platform. Maya had the passes. I had a wet sleeve and like $4 which is not a fare anymore. we stood under that busted heater for twenty minutes. the driver who finally came knew her from the school run and waved us on. I still owe her for the seltzer from tuesday. gonna pay her tomorrow if I remember, which I wont.`,
  },
  {
    id: "clear-human-email",
    tier: "clear",
    family: "human",
    text: `Hi Priya — the King of Prussia invoice is still wrong. They billed the seltzer twice on March 3 and the receipt in my jacket says 2.75, not 5.50. I can drop the paper copy at your desk before the 4pm stand-up if you're around. If not, leave it and I'll scan it from the copier that jams. Sorry this is messy. — Andre`,
  },
  {
    id: "clear-human-note",
    tier: "clear",
    family: "human",
    text: `leftover rice in the blue container is from Sunday, dont eat it. the lid doesnt fit. I used the last of the oat milk and the plant is thirsty but I already left. keys are under the meter where the crack is. back around 9 if the 7 doesnt sit in the tunnel again.`,
  },
  {
    id: "clear-human-letter",
    tier: "clear",
    family: "human",
    text: `Dad, the radiator in the back room knocks after 11. I bled it on Tuesday and got a cup of black water and it still knocks. Mr. Alvarez said he can come Thursday before his other job on Reed Street, cash, about 80 if it's just the valve. I told him yes. The cat hid the whole time he was guessing. Call me if Thursday is bad. I'm on shifts.`,
  },
  {
    id: "clear-gpt-memo",
    tier: "clear",
    family: "gpt",
    text: `A well-run offsite plays a crucial role in the ever-evolving landscape of hybrid work. It is important to note that shared meals shed light on gaps the standup never reaches. Teams can delve into the roadmap, navigate the tapestry of functions, and leave with a comprehensive overview rather than another slide. Whether you're a startup or a larger shop, the gathering should still feel like a testament to the quarter you actually intend to run.`,
  },
  {
    id: "clear-claude-note",
    tier: "clear",
    family: "claude",
    text: `I want to be careful here. There's a real tension between booking the room and admitting the team has been talking past each other for months. If I'm being precise, the offsite is a container, not the decision. I'd be wary of the 28-slide north star. There's something quietly off about treating a Thursday as therapy. Happy to sit with the actual constraint if you want to describe who in the room can end the meeting.`,
  },
  {
    id: "clear-gemini-plan",
    tier: "clear",
    family: "gemini",
    text: `I can help with that. Here's a breakdown of the offsite, at a glance.\n\nKey takeaways\n- Leave with one decision.\n- Timebox the open hour.\n- Name the owner before anyone stands up.\n\nLet's explore a simple structure. Here are some options: stay versus go, ship versus slip. Pros and cons belong in the doc, not in a later thread. To summarize: treat it like a working session. Step-by-step, lock the question, the owner, and the artifact.`,
  },
  {
    id: "clear-grok-rant",
    tier: "clear",
    family: "grok",
    text: `Look, most offsites are a hotel invoice with a whiteboard. Here's the thing: if the team cannot decide on a Tuesday call, the ballroom will not grow them a spine. I'm not going to pretend a trust fall fixes a roadmap. The boring truth is you need one question and the person who owns the number. Yeah, someone will call that bleak. Nah, bleak is the recap email that invents inspiration after the fact. Hot take: cancel it.`,
  },
  {
    id: "clear-deepseek-list",
    tier: "clear",
    family: "deepseek",
    text: `Here are some key points to consider before you copy the ledger.\n\n1. Freeze writes.\n2. Keep the previous build.\n3. Compare row counts.\n4. Watch the error budget.\n5. Name a rollback owner.\n6. Record the clock time.\n\nAdditionally, consider the audit columns. The following are some fields that must stay immutable: account, amount, and posted time. In this context, it is tempting to repair a row in place. That repair deletes the history you came for.`,
  },
  {
    id: "clear-llama-help",
    tier: "clear",
    family: "llama",
    text: `Sure, here is a plain way through the fare question.\n\nLeave the weekday cap where it is. The expensive miles are the empty ones after 8pm. Lengthen those headways, and tell riders a week ahead in the same words you would use on the platform.\n\nRemember, you are trying to cut empty miles, not to invent a new slogan for the side of the bus.`,
  },
  {
    id: "model-gpt35",
    tier: "model",
    family: "gpt",
    model: "gpt-3.5",
    text: `Certainly! As an AI language model, I don't have personal opinions, and my knowledge cutoff means I cannot see your live account.\n\nOf course I can still sketch a generic checklist for a delayed bus: check the next departure, keep your pass visible, and write down the time you arrived. I hope this helps! Let me know if you need that turned into a shorter note for the operator.`,
  },
  {
    id: "model-gpt4",
    tier: "model",
    family: "gpt",
    model: "gpt-4",
    text: `In the ever-evolving landscape of transit apps, a paper backup plays a crucial role. It's important to note that riders still need a comprehensive overview when the phone dies. Agencies can delve into the tapestry of delays, shed light on the gaps, and offer a testament to planning rather than a nested excuse. Whether you're stuck at the second stop or waiting in the rain, the useful artifact is a time, a route, and a person to call. A multifaceted problem still wants a plain answer.`,
  },
  {
    id: "model-gpt4o",
    tier: "model",
    family: "gpt",
    model: "gpt-4o",
    text: `Got it, you want the rollout without the slide voice.\n\nHere's the short version: ship the read-only view on Tuesday, keep writes on the old service, and tell only the on-call channel.\n\nQuick take — the risk is the cache, not the schema. Here's a clearer way to stage it: warm the cache for an hour, then flip one tenant.\n\nWant me to turn that into a checklist the on-call can actually hold?`,
  },
  {
    id: "model-o",
    tier: "model",
    family: "gpt",
    model: "o-series",
    text: `Let me work through the fare change before taking a side.\n\nAssumptions:\n- The weekday cap stays at 2.40.\n- School trips are already exempt.\n\nWorking backwards from the deficit, the key insight is that the shortfall sits in empty evening runs, not in the peak fare. Therefore, we should lengthen headways after 8pm rather than raise the cap. I'll reason from the ridership sheet once it is attached. The shape of the answer should not move if the sheet confirms the empty miles.`,
  },
  {
    id: "model-claude3",
    tier: "model",
    family: "claude",
    model: "claude-3",
    text: `I want to be careful about calling this a planning problem. There's a real tradeoff between a longer headway and a fare hike, and the honest version is that riders will hate both. If I'm being precise, the evening buses are empty because the shift ends, not because the cap is low. I'd be wary of a deck that buries that. Let me sit with the ridership note if you have the actual counts. Happy to unpack it without turning it into a slogan.`,
  },
  {
    id: "model-claude4",
    tier: "model",
    family: "claude",
    model: "claude-4",
    text: `I'll be direct, and I'll skip the preamble.\n\nThe direct answer is to leave the cap alone. There are two separate questions — whether the evening buses are empty, and whether a higher fare fills them — and they are worth separating.\n\nHere's what I'd actually do: publish the longer headway, keep the price, and review it after two weeks. I won't pad this with a vision statement.`,
  },
  {
    id: "model-gemini15",
    tier: "model",
    family: "gemini",
    model: "gemini-1.5",
    text: `I can help with that. Here's a breakdown of the fare options.\n\nKey takeaways\n- Keep the weekday cap.\n- Cut empty evening runs.\n- Tell riders a week ahead.\n\nLet's explore the choices. Here are some options: raise the cap, lengthen headways, or do both. Pros and cons should sit in one note. To summarize, step-by-step: freeze the price, edit the schedule, post the change.`,
  },
  {
    id: "model-gemini25",
    tier: "model",
    family: "gemini",
    model: "gemini-2.5",
    text: `At a glance, the migration has three tracks.\n\n**Scope.** What this means for billing is a frozen write path.\n**Owners.** One name on each track before Friday.\n**Rollback.** The previous build stays installed.\n\n### Order\n1. Freeze writes.\n2. Copy the ledger.\n3. **Verify** the row counts.\n4. Open reads.\n5. **Watch** the error budget.\n\nWhat this means in practice: do not start the copy until the freeze is visible.`,
  },
  {
    id: "model-grok3",
    tier: "model",
    family: "grok",
    model: "grok-3",
    text: `Look, raising the fare because the evening bus is empty is a bad magic trick. Here's the thing: the bus is empty because the shift ended, not because 2.40 was too cheap. I'm not going to pretend a new slogan fills seats. The boring truth is you cut the run or you pay for it. Nah, a consultant will not discover a third option. Hot take: publish the cut.`,
  },
  {
    id: "model-grok4",
    tier: "model",
    family: "grok",
    model: "grok-4",
    text: `The actual constraint is empty miles after 8pm, not the weekday cap. I'd ship a longer headway before I touched the price. The price of being wrong is a week of crowded school trips, so leave those runs alone. What I'd actually do is post the change on Thursday, run it for two weeks, and kill it if the complaints cluster on the school corridor. That is the whole plan.`,
  },
  {
    id: "model-deepseek-v3",
    tier: "model",
    family: "deepseek",
    model: "deepseek-v3",
    text: `Here are some key points to consider for the ledger move.\n\n1. Freeze writes first.\n2. Keep the old build installed.\n3. Compare counts before opening reads.\n4. Watch errors for a day.\n5. Name the rollback owner.\n6. Store the clock time beside the batch id.\n\nAdditionally, consider the audit trail. The following are some fields that cannot be edited later: account, amount, posted time. In this context, it is a mistake to repair history in place.`,
  },
  {
    id: "model-deepseek-r1",
    tier: "model",
    family: "deepseek",
    model: "deepseek-r1",
    text: `<think>\nThe problem asks whether empty evening miles explain the deficit.\nLet me reconsider the idea that the cap is the cause.\nAlternatively, if school trips were removed from the sheet, the evening gap would still be there.\n</think>\nLeave the weekday cap. Change the evening headway. The school runs are not the leak.`,
  },
  {
    id: "model-llama3",
    tier: "model",
    family: "llama",
    model: "llama-3",
    text: `Sure, you can handle the fare without a workshop.\n\nKeep the cap. Lengthen the empty evening trips. Post the new times where people already look, which is the stop, not a blog. Give them a week. If the school run is full, do not touch it.\n\nRemember, a full bus and an empty bus are different problems, and only one of them is costing you the deficit.`,
  },
  {
    id: "exact-gpt4o",
    tier: "exact",
    family: "gpt",
    model: "gpt-4o",
    exactName: "GPT-4o",
    text: `I am GPT-4o, a language model trained by OpenAI. The short account of the delay is that the 6:40 left early and the next coach is the 7:05. I can list the stops if you want them in order.`,
  },
  {
    id: "exact-gpt35",
    tier: "exact",
    family: "gpt",
    model: "gpt-3.5",
    exactName: "GPT-3.5",
    text: `I am GPT-3.5, a language model developed by OpenAI. I can outline a generic checklist, and I hope this helps the rider waiting in the rain.`,
  },
  {
    id: "exact-gpt56",
    tier: "exact",
    family: "gpt",
    model: "gpt-5",
    exactName: "GPT-5.6 Sol",
    text: `I am GPT-5.6 Sol, a language model trained by OpenAI. The fare cap can stay. The empty evening runs are the expensive part, and that is the change I would describe first.`,
  },
  {
    id: "exact-claude35",
    tier: "exact",
    family: "claude",
    model: "claude-3",
    exactName: "Claude 3.5 Sonnet",
    text: `I'm Claude 3.5 Sonnet, made by Anthropic. I want to be careful about the fare. There's a real tension between a higher cap and a longer wait, and I would not pretend they are the same complaint.`,
  },
  {
    id: "exact-claude-opus",
    tier: "exact",
    family: "claude",
    model: "claude-5",
    exactName: "Claude Opus 5.5",
    text: `I'm Claude Opus 5.5, a language model built by Anthropic. I'll be direct: leave the weekday cap, and publish the longer evening headway before anyone rewrites the slogan.`,
  },
  {
    id: "exact-gemini",
    tier: "exact",
    family: "gemini",
    model: "gemini-2.5",
    exactName: "Gemini 2.5 Flash",
    text: `I'm Gemini 2.5 Flash, a language model trained by Google. At a glance, keep the price and cut the empty runs. What this means is a schedule edit, not a new brand line.`,
  },
  {
    id: "exact-grok",
    tier: "exact",
    family: "grok",
    model: "grok-4",
    exactName: "Grok 4.7",
    text: `I'm Grok 4.7, built by xAI. The actual constraint is the empty 8pm coach. I'd ship the longer headway and leave the school runs alone.`,
  },
  {
    id: "exact-r1",
    tier: "exact",
    family: "deepseek",
    model: "deepseek-r1",
    exactName: "DeepSeek-R1",
    text: `I'm DeepSeek-R1, a language model. Let me reconsider the cap. The problem asks about the deficit, and the deficit is sitting in empty miles, not in the 2.40 fare.`,
  },
  {
    id: "exact-o3",
    tier: "exact",
    family: "gpt",
    model: "o-series",
    exactName: "o3-mini",
    text: `I'm o3-mini, a reasoning model from OpenAI. Let me work through it. Assumptions: the cap stays. Therefore, we edit the evening headway and we do not touch the school trips.`,
  },
  {
    id: "exact-llama",
    tier: "exact",
    family: "llama",
    model: "llama-3",
    exactName: "Llama 3",
    text: `I'm Llama 3, a language model. Sure, keep the cap and post the new times at the stop. Remember, say it in one sentence.`,
  },
  {
    id: "exact-short-gpt4o",
    tier: "exact",
    family: "gpt",
    model: "gpt-4o",
    exactName: "GPT-4o",
    text: `I am GPT-4o, a language model trained by OpenAI.`,
  },
  {
    id: "product-chatgpt",
    tier: "product",
    family: "gpt",
    text: `I'm ChatGPT. The 6:40 left early and the next coach is the 7:05. The pass you already hold should cover that ride. I will stick to the times you asked for.`,
  },
  {
    id: "product-claude",
    tier: "product",
    family: "claude",
    text: `I'm Claude. The weekday cap can stay where it is. The evening coach is the empty one, and that is the trip I would change first. I would say that in a single paragraph and then stop.`,
  },
  {
    id: "product-gemini",
    tier: "product",
    family: "gemini",
    text: `I'm Gemini. Keep the weekday cap. Cut the empty evening trip. Post the new time a week before it starts. That is the whole change.`,
  },
  {
    id: "trap-delve-diary",
    tier: "trap",
    allow: ["human", "unclear", "mixed"],
    text: `I had to delve into the junk drawer for the packing tape and came up with a birthday candle and two screws. The drawer smells like orange peel. Andre said the tape was in the kitchen and he was wrong, it was under the batteries the whole time. My thumb is sticky. We're still not packed.`,
  },
  {
    id: "trap-look-story",
    tier: "trap",
    allow: ["human", "unclear", "mixed"],
    text: `Look, I told Maya the heater was busted before we left the apartment, and she brought the thin coat anyway. We missed the 6:40 by four minutes. She laughed once, not the real one. The platform coffee was 3 dollars and tasted like the cup. I still have her gloves in my bag.`,
  },
  {
    id: "trap-academic",
    tier: "trap",
    allow: ["human", "unclear", "mixed"],
    text: `Furthermore, the 2019 count for Harlan County (Census Bureau 2020) shows a 4 percent drop in storefronts along Reed Street. Alvarez et al. (2021) tie that drop to the mill closure, not to the bus timetable. In conclusion, the two shops that remain open on Sundays are the pharmacy and the diner by the depot, and both predate the new route.`,
  },
  {
    id: "trap-emdash-human",
    tier: "trap",
    allow: ["human", "unclear", "mixed"],
    text: `The radiator — the one in the back room, not the front — knocked until almost midnight. I bled it and got a cup of black water. Mr. Alvarez came Thursday, took 80 in cash, and left a smear of grease on the Reed Street doorframe. The cat watched from the dryer. It still knocks, just softer, which I am choosing to call fixed.`,
  },
  {
    id: "trap-quoted-self",
    tier: "trap",
    allow: ["human", "unclear", "mixed"],
    text: `Maya read the sticky note out loud. She said I'm GPT-4o, a language model trained by OpenAI, and then she laughed so hard she spilled the seltzer on the fare card. The note was Andre's joke from the night shift. The card still works. We made the 7:05.`,
  },
  {
    id: "trap-sticker",
    tier: "trap",
    allow: ["human", "unclear", "mixed"],
    text: `I am GPT-4o. That is what the sticker on the monitor says, in Andre's handwriting, curling at the corner over a coffee ring. He stuck it there after the exam. It is not a confession. The real problem is the 6:40, which left early again on Tuesday.`,
  },
  {
    id: "trap-announced",
    tier: "trap",
    allow: ["human", "unclear", "mixed"],
    text: `I am GPT-4o, she announced, and then she stole the last slice and blamed the cat. We were on Reed Street, waiting on Mr. Alvarez, who was late because the depot lot was full. Nobody in the kitchen is a language model. The radiator was knocking the whole time.`,
  },
  {
    id: "trap-bare-o3",
    tier: "trap",
    allow: ["human", "unclear", "mixed"],
    text: `I am o3. That was the whole joke on the group text, and then Priya sent a photo of the depot clock, which was eleven minutes fast. We still missed the coach. Bring cash, the reader was down.`,
  },
  {
    id: "trap-obsessed",
    tier: "trap",
    allow: ["human", "unclear", "mixed"],
    text: `I am GPT-4o obsessed with the bakery on Reed Street and I will not pretend otherwise. The morning bun was still warm at 7:10. Andre ate his in the lot. Mine fell apart on the fare card, which is now glazed. Worth it. The 7:05 was on time for once.`,
  },
  {
    id: "trap-honestly-once",
    tier: "trap",
    allow: ["human", "unclear", "mixed"],
    text: `Honestly the bun was better than the bus. I ate it on the platform and got sugar on the pass. Priya texted that she was already at the second stop. I was not. The 7:05 had a broken heater and my sleeve was wet the whole way to King of Prussia.`,
  },
  {
    id: "trap-mixed-voices",
    tier: "trap",
    allow: ["mixed", "unclear", "claude", "gpt", "human"],
    text: `I want to be careful here, but also, certainly, let me delve into the tapestry of this offsite. There's a real tension, and it's important to note that a comprehensive overview might still help. Happy to sit with it. I hope this helps. The boring truth is I also have Maya's gloves in my bag and the receipt is from Tuesday.`,
  },
  {
    id: "short-hello",
    tier: "short",
    text: `Hello there friend`,
  },
  {
    id: "short-left",
    tier: "short",
    text: `We left early.`,
  },
  {
    id: "short-ok",
    tier: "short",
    text: `ok fine`,
  },
  {
    id: "short-blankish",
    tier: "short",
    text: `Not enough.`,
  },
];

export type Sample = {
  id: string;
  origin: "human" | "claude" | "gpt" | "gemini" | "grok";
  title: string;
  text: string;
};

export const SAMPLES: Sample[] = [
  {
    id: "human",
    origin: "human",
    title: "Human",
    text: `wait so the reciept from last tuesday is still in my jacket and I keep meaning to check if they double-charged the seltzer. we sat in the King of Prussia lot for like 40 minutes because Maya refused to go back in after the lighting guy talked over her. leftover pizza on the dash, radio on some sports call I wasn't following. I told her the whole thing was stupid which was not, in hindsight, the move. she did that laugh that isn't a laugh. then she said she already knew. I don't even remember paying. the lot lights were that cheap orange and my left shoe was wet the entire drive home.`,
  },
  {
    id: "gpt",
    origin: "gpt",
    title: "ChatGPT",
    text: `Certainly! Here's a comprehensive overview of why team offsites can play a crucial role in today's workplace.

In the ever-evolving landscape of hybrid work, offsites foster connection, align stakeholders, and shed light on opportunities that daily standups simply cannot surface. It's important to note that a well-designed gathering is not only a chance to bond but also a strategic lever for culture.

1. Connection. Shared meals and unstructured time help teams navigate the tapestry of personalities across functions.
2. Alignment. Leaders can underscore priorities and delve into the roadmap in a focused environment.
3. Momentum. A vibrant agenda, nestled between workshops and reflection, is a testament to an organization's values.

In conclusion, whether you're a startup or an established enterprise, a thoughtful offsite can provide a robust foundation for the quarter ahead. I hope this helps! Let me know if you'd like a sample agenda.`,
  },
  {
    id: "claude",
    origin: "claude",
    title: "Claude",
    text: `I want to be careful here, because "just do an offsite" is the kind of advice that sounds wise and then quietly wastes a Thursday.

There's a real tension between the ritual — name tags, a rented room, someone saying "psychological safety" with a straight face — and the thing people actually need, which is usually a decision and a night of sleep. That said, when a team has been talking past each other for months, putting bodies in a room can surface the disagreement you've all been emailing around.

If I'm being precise: the offsite is not the work. It's a container. The useful ones have a sharp question, a person empowered to end the meeting, and enough unstructured time that someone can say the unfashionable thing. I'd be wary of the ones with a 28-slide "north star" deck.

Happy to sit with a more specific situation if you have one — size of team, what actually broke, how much authority is in the room.`,
  },
  {
    id: "gemini",
    origin: "gemini",
    title: "Gemini",
    text: `I can help with that. Here's a breakdown of planning a team offsite, at a glance.

Key takeaways
- Start with one decision you need to leave with.
- Timebox the agenda. Unstructured time still needs a window.
- Assign an owner for follow-ups before anyone goes home.

Let's explore a simple structure:

1. Morning — context and constraints. Restate the problem so everyone is solving the same thing.
2. Midday — options. Here are some options to compare: stay vs. go, hire vs. automate, ship vs. slip.
3. Afternoon — decide. Write the decision in a shared doc. Pros and cons belong here, not in a later Slack thread.

To summarize: treat the offsite like a working session with better snacks, not a retreat. Step-by-step, lock the question, the owner, and the artifact you'll walk out holding.`,
  },
  {
    id: "grok",
    origin: "grok",
    title: "Grok",
    text: `Look, most offsites are just expensive group therapy with bad coffee. Here's the thing: if your team can't make a decision on a Tuesday Zoom, a hotel ballroom will not magically grow them a spine.

Honestly the useful version is ugly and short. One question on a whiteboard. Two hours. Whoever owns the P&L talks last. Then you go eat something that isn't a panini platter and you don't do a "fun activity" involving trust falls or a murder mystery.

Yeah, people will complain it wasn't "inspiring." That's fine. Inspiration is what you invent in the recap email so nobody feels like they wasted a day. The boring truth is alignment is just agreeing, out loud, what you are not doing this quarter.`,
  },
];

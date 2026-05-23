// Deterministic mock AI responses with optional context awareness.

interface ResponseRule {
  match: RegExp;
  reply: string | ((ctx: string) => string);
}

const RESPONSES: ResponseRule[] = [
  {
    match: /summar(ize|y)/i,
    reply: (ctx) =>
      ctx.startsWith("/notes/")
        ? "Here's a quick summary of this note:\n\n• **Core idea**: the relationship between rate of change and accumulation.\n• **Key formula**: f'(x) = lim h→0 (f(x+h) − f(x))/h\n• **Applications**: physics (velocity), economics (marginal cost), optimization.\n• **Watch out for** points where the function is non-differentiable.\n\nWant me to turn this into flashcards?"
        : "Here's a quick summary:\n\n• The core idea is the relationship between rate of change and accumulation.\n• Key formula: f'(x) = lim h→0 (f(x+h) − f(x))/h\n• Common applications: physics, economics, optimization.\n• Watch out for non-differentiable points (corners, cusps).",
  },
  {
    match: /flashcard|cards from/i,
    reply:
      "I generated 8 flashcards for you. They're now in your **Flashcards** library under a new deck. Open the deck and start a 5-minute review — spaced repetition kicks in after the first round.",
  },
  {
    match: /quiz me|quiz/i,
    reply:
      "Created a 5-question multiple-choice quiz. Time limit: 60s per question. Find it under **Quizzes → Recently Generated**. Aim for 4/5 — anything less and we'll loop in flashcards for weak topics.",
  },
  {
    match: /plan (my )?day|today|prioritize/i,
    reply:
      "**Plan for today** (based on what's due and your streak):\n\n1. **9–9:45 am** — Calculus problem set (high priority, due in 2 days)\n2. **10–10:25 am** — Quick break, hydrate\n3. **10:30–11:15 am** — Physics lab report intro section\n4. **11:30 am–12 pm** — 15 flashcards (mixed decks)\n5. **2–2:45 pm** — Algorithms HW: 2 DP problems\n6. **Evening** — 25-min focus block on weakest exam topic\n\nWant me to add these to your calendar?",
  },
  {
    match: /study plan|plan/i,
    reply:
      "**Suggested 7-day study plan**\n\n- Day 1–2: Read & summarize chapter, build flashcards\n- Day 3: Practice problems, identify weak spots\n- Day 4: Targeted review + quiz attempt 1\n- Day 5: Mixed practice + spaced flashcard review\n- Day 6: Mock exam under timed conditions\n- Day 7: Light review of mistakes, rest, hydrate\n\nWant these added to your calendar?",
  },
  {
    match: /predict (questions|exam)|likely questions/i,
    reply:
      "**Likely exam questions** based on past papers and your notes:\n\n1. Prove/apply the chain rule on a composite function\n2. Solve an integration-by-parts problem (LIATE)\n3. Conceptual: explain when L'Hôpital's rule applies\n4. A short proof using the mean value theorem\n5. One word problem mixing related rates\n\nWant me to generate a 10-question mock from these?",
  },
  {
    match: /explain/i,
    reply:
      "Let's break it down. The concept builds on three pieces:\n\n1. **Definition** — what it formally means\n2. **Intuition** — the everyday analogy\n3. **Mechanic** — how to actually compute or apply it\n\nWhich one would you like me to drill into?",
  },
  {
    match: /(translate)/i,
    reply:
      "Translation\n\n— Original meaning preserved.\n— Technical terms kept in original where they're standard.\n— Want a different target language?",
  },
  {
    match: /make question|generate question/i,
    reply:
      "**Suggested questions from this passage:**\n\n1. State the formal definition and one counter-example.\n2. Compare and contrast with the adjacent concept.\n3. Apply it to a specific worked example.\n4. Discuss two real-world applications.\n5. Identify one common student mistake.",
  },
  {
    match: /key concepts|important|highlight/i,
    reply:
      "**Key concepts identified:**\n\n1. Foundational definitions\n2. Two or three core formulas\n3. A couple of canonical worked examples\n4. Common edge cases / mistakes to avoid\n\nI've tagged these as `important`.",
  },
  {
    match: /what should i study|most urgent|priority/i,
    reply:
      "**Most urgent right now:**\n\n• Calculus II Midterm in 5 days — only 65% prep\n• Algorithms HW: Dynamic Programming due in 3 days, 40% done\n• Physics Lab Report due in 5 days, 0% started\n\nStart with the 25-min Calculus block. Quick win, builds momentum.",
  },
  {
    match: /(hello|hi|hey)\b/i,
    reply:
      "Hey! I'm your study buddy. I can summarize notes, generate quizzes & flashcards, build study plans, and help you prep for exams. What are we working on today?",
  },
];

const FALLBACK = [
  "Got it. Here's how I'd approach this:\n\n1. Identify the key concept(s) involved\n2. Write down the formula or definition\n3. Try a worked example\n4. Test yourself with a quiz or flashcards\n\nWant me to walk through any step?",
  "Interesting question. Based on your recent notes, I'd recommend reviewing the foundational material first, then attempting practice problems. Should I generate a 5-question quiz to test your understanding?",
  "Let me think about that. The most common approach is to break the problem into smaller parts, solve each independently, and combine the results. Would you like a worked example?",
];

export function getAIResponse(input: string, context = "/"): string {
  for (const { match, reply } of RESPONSES) {
    if (match.test(input)) {
      return typeof reply === "function" ? reply(context) : reply;
    }
  }
  const idx = Math.abs(hash(input)) % FALLBACK.length;
  return FALLBACK[idx];
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export const QUICK_PROMPTS = [
  "Summarize my latest note",
  "Create a study plan for finals",
  "Explain integration by parts",
  "Generate a quiz on cell biology",
  "What should I review today?",
];

// Contextual prompts based on current pathname
export function getContextualPrompts(pathname: string): string[] {
  if (pathname.startsWith("/notes/")) {
    return ["Summarize this note", "Quiz me on this", "Make flashcards", "Explain in simpler terms"];
  }
  if (pathname.startsWith("/notes")) {
    return ["Find similar notes", "What should I review?", "Create new note"];
  }
  if (pathname.startsWith("/exams") || pathname.startsWith("/exam-mode")) {
    return ["What should I study first?", "Predict exam questions", "Generate a mock test"];
  }
  if (pathname.startsWith("/dashboard")) {
    return ["Plan my day", "What's most urgent?", "Summarize my week"];
  }
  if (pathname.startsWith("/flashcards")) {
    return ["Make me a new deck", "Quiz me on weak cards", "Schedule reviews"];
  }
  if (pathname.startsWith("/assignments")) {
    return ["Prioritize my tasks", "Estimate time for each", "Set up a schedule"];
  }
  if (pathname.startsWith("/pdf-chat")) {
    return ["Summarize this PDF", "List key formulas", "Make flashcards"];
  }
  return QUICK_PROMPTS.slice(0, 4);
}

export const PDF_SUGGESTED_QUESTIONS = [
  "What are the main topics in this PDF?",
  "Summarize chapter 1",
  "List key formulas",
  "Create flashcards from this PDF",
  "What's likely to be on the exam?",
];

export function getPDFAnswer(q: string): string {
  return `Based on page ${3 + Math.floor(Math.random() * 12)} of the document, ${getAIResponse(q).toLowerCase().replace(/^./, (c) => c.toUpperCase())}\n\nWould you like me to save this as a note?`;
}

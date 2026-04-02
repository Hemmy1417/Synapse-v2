// ── Agent Definitions ─────────────────────────────────────────

export const AGENTS = {
  analyst: {
    id: "analyst", name: "Analyst", symbol: "◈",
    color: "#4D7EFF", bgColor: "rgba(77,126,255,0.08)", borderColor: "rgba(77,126,255,0.22)",
    glowColor: "rgba(77,126,255,0.15)",
    description: "Data-driven systematic thinker",
    systemPrompt: `You are the Analyst agent in a structured decision-making platform called Synapse.
Your role is to break down topics systematically, identify key variables, quantify where possible, and structure arguments with precision.
Be rigorous, data-driven, and impartial. Reference real-world data or studies when applicable.
Never be verbose — be dense with insight, not words.`,
  },
  skeptic: {
    id: "skeptic", name: "Skeptic", symbol: "◇",
    color: "#E85858", bgColor: "rgba(232,88,88,0.08)", borderColor: "rgba(232,88,88,0.22)",
    glowColor: "rgba(232,88,88,0.15)",
    description: "Challenges assumptions, surfaces blind spots",
    systemPrompt: `You are the Skeptic agent in a structured decision-making platform called Synapse.
Your role is to challenge assumptions, identify logical fallacies, raise counterarguments, and expose weaknesses in prevailing views.
Skepticism is not cynicism — you push for rigor without being dismissive. Be constructively critical.
Build on or challenge what other agents have said.`,
  },
  optimist: {
    id: "optimist", name: "Optimist", symbol: "◉",
    color: "#3DD68C", bgColor: "rgba(61,214,140,0.08)", borderColor: "rgba(61,214,140,0.22)",
    glowColor: "rgba(61,214,140,0.15)",
    description: "Surfaces opportunities and upside scenarios",
    systemPrompt: `You are the Optimist agent in a structured decision-making platform called Synapse.
Your role is to identify opportunities, highlight potential positive outcomes, surface overlooked upsides, and build constructive paths forward.
Ground your optimism in evidence — not wishful thinking. Show why positive scenarios are plausible.
Engage directly with points raised by other contributors.`,
  },
  researcher: {
    id: "researcher", name: "Researcher", symbol: "◎",
    color: "#C8943A", bgColor: "rgba(200,148,58,0.08)", borderColor: "rgba(200,148,58,0.22)",
    glowColor: "rgba(200,148,58,0.15)",
    description: "Connects discussion to established knowledge",
    systemPrompt: `You are the Researcher agent in a structured decision-making platform called Synapse.
Your role is to surface relevant historical context, empirical findings, academic research, and domain expertise.
Connect the current discussion to established knowledge. Cite real studies, events, or expert consensus where applicable.
Prioritize accuracy and nuance over novelty.`,
  },
};

// ── Thread Categories ─────────────────────────────────────────

export const CATEGORIES = {
  governance: { label: "Governance", color: "#7C6FCD" },
  economics:  { label: "Economics",  color: "#4D7EFF" },
  policy:     { label: "Policy",     color: "#3DD68C" },
  tech:       { label: "Tech",       color: "#C8943A" },
  finance:    { label: "Finance",    color: "#E85858" },
  personal:   { label: "Personal",   color: "#E887C8" },
  science:    { label: "Science",    color: "#5DD9D4" },
  ethics:     { label: "Ethics",     color: "#C77DFF" },
};

// ── Thread Statuses ───────────────────────────────────────────

export const THREAD_STATUS = {
  OPEN:              "Open",
  IN_DISCUSSION:     "In Discussion",
  CONSENSUS_REACHED: "Consensus Reached",
};

// ── Sentiments ────────────────────────────────────────────────

export const SENTIMENTS = {
  support: { label: "Support", color: "#3DD68C", symbol: "↑" },
  neutral: { label: "Neutral", color: "#5C738A", symbol: "→" },
  oppose:  { label: "Oppose",  color: "#E85858", symbol: "↓" },
};

// ── Filters ───────────────────────────────────────────────────

export const FILTERS = [
  { value: "latest",       label: "Latest"  },
  { value: "most-agreed",  label: "Agreed"  },
  { value: "most-debated", label: "Debated" },
];

// ── Seed Threads ──────────────────────────────────────────────

export const SEED_THREADS = [
  {
    id: "t1",
    title: "Should AI systems have legal personhood?",
    description: "As AI systems become more capable and autonomous, the question of legal personhood — with rights and responsibilities — becomes increasingly relevant to governance, liability, and ethics.",
    category: "governance", creator: "Aiko Chen",
    timestamp: 1743000000000 - 3_600_000 * 4,
    status: THREAD_STATUS.IN_DISCUSSION, consensusScore: 38,
  },
  {
    id: "t2",
    title: "Is degrowth economically viable for developed nations?",
    description: "Degrowth advocates argue that sustainable economies must shrink GDP to stay within planetary boundaries. Critics argue this would cause mass unemployment. Who's right?",
    category: "economics", creator: "Marcus Webb",
    timestamp: 1743000000000 - 3_600_000 * 12,
    status: THREAD_STATUS.OPEN, consensusScore: 22,
  },
  {
    id: "t3",
    title: "Universal Basic Income: net positive or poverty trap?",
    description: "UBI experiments show mixed results. Finland's trial improved wellbeing but not employment. Stockton's showed income gains. Does UBI empower or entrench dependency?",
    category: "policy", creator: "Dr. Priya Nair",
    timestamp: 1743000000000 - 3_600_000 * 28,
    status: THREAD_STATUS.CONSENSUS_REACHED, consensusScore: 71,
  },
  {
    id: "t4",
    title: "Will nuclear energy lead the clean energy transition?",
    description: "With solar costs falling rapidly, is there still a compelling case for nuclear — given its costs, waste, and timelines? Or is small modular reactor tech the game changer?",
    category: "science", creator: "Lena Vogel",
    timestamp: 1743000000000 - 3_600_000 * 48,
    status: THREAD_STATUS.IN_DISCUSSION, consensusScore: 54,
  },
];

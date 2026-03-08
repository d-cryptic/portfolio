export type NowSection = {
  title: string;
  items: string[];
};

export type ChangeLogEntry = {
  date: string;
  latestUpdate: string;
  updates: string[];
};

export const nowPageData = {
  intro:
    "A public snapshot of what I am focused on right now. I update this page as priorities and routines evolve.",
  focusedOn: [
    "Building production-grade platform systems with clear operational guardrails.",
    "Improving reliability and developer workflows for fast shipping without regressions.",
    "Maintaining a consistent writing and learning cadence.",
  ],
  shipping: [
    "Portfolio quality improvements across content discoverability and UX.",
    "Operational write-ups from real-world SRE/platform work.",
    "Small but frequent improvements to personal tooling and workflows.",
  ],
  learningAndExperiments: [
    "Deeper systems internals and distributed reliability patterns.",
    "Workflow experiments around focused execution and faster feedback loops.",
    "Trying low-overhead automation for recurring development tasks.",
  ],
  readingWatchingListening: [
    "Technical books and papers on systems design and reliability.",
    "Engineering talks and postmortems from high-scale teams.",
    "Manga and long-form podcasts for reset and perspective.",
  ],
  healthAndLifestyle: [
    "Prioritizing sleep consistency and lighter late-night work.",
    "Regular movement and breaks to protect deep focus quality.",
    "Maintaining sustainable pace over short bursts of intensity.",
  ],
  locationAndRoutine: [
    "Based in India (IST).",
    "Most deep work happens in focused morning and early afternoon blocks.",
    "Evenings are typically reserved for reading, planning, and light execution.",
  ],
  peopleLearningFrom: [
    "Engineers sharing practical reliability and platform lessons.",
    "Writers focused on clear thinking and execution systems.",
    "Builders who ship small, iterate fast, and keep quality high.",
  ],
  openTo: [
    "infra",
    "ai",
    "ml",
    "agents",
    "sre",
    "scaling",
  ],
  sections: [
    {
      title: "What I’m Focused On",
      items: [
        "Building production-grade platform systems with clear operational guardrails.",
        "Improving reliability and developer workflows for fast shipping without regressions.",
        "Maintaining a consistent writing and learning cadence.",
      ],
    },
    {
      title: "What I’m Shipping",
      items: [
        "Portfolio quality improvements across content discoverability and UX.",
        "Operational write-ups from real-world SRE/platform work.",
        "Small but frequent improvements to personal tooling and workflows.",
      ],
    },
    {
      title: "What I’m Learning / Experiments",
      items: [
        "Deeper systems internals and distributed reliability patterns.",
        "Workflow experiments around focused execution and faster feedback loops.",
        "Trying low-overhead automation for recurring development tasks.",
      ],
    },
    {
      title: "Reading / Watching / Listening",
      items: [
        "Technical books and papers on systems design and reliability.",
        "Engineering talks and postmortems from high-scale teams.",
        "Manga and long-form podcasts for reset and perspective.",
      ],
    },
    {
      title: "Health & Lifestyle",
      items: [
        "Prioritizing sleep consistency and lighter late-night work.",
        "Regular movement and breaks to protect deep focus quality.",
        "Maintaining sustainable pace over short bursts of intensity.",
      ],
    },
    {
      title: "Location & Routine",
      items: [
        "Based in India (IST).",
        "Most deep work happens in focused morning and early afternoon blocks.",
        "Evenings are typically reserved for reading, planning, and light execution.",
      ],
    },
    {
      title: "People I’m Learning From",
      items: [
        "Engineers sharing practical reliability and platform lessons.",
        "Writers focused on clear thinking and execution systems.",
        "Builders who ship small, iterate fast, and keep quality high.",
      ],
    },
  ] as NowSection[],
  changeLog: [
    {
      date: "2026-03-08",
      latestUpdate:
        "Added the first complete public now page with focused sections, open-to highlights, and changelog format.",
      updates: [
        "Defined current priorities and active execution themes.",
        "Added what I am shipping and learning/experimenting with.",
        "Introduced latest-update and expandable full changelog pattern.",
      ],
    },
  ] as ChangeLogEntry[],
};

import crypto from "crypto";
import fs from "fs";
import path from "path";

/* -------------------------------------------------------------------------- */
/*                                   Config                                   */
/* -------------------------------------------------------------------------- */

const PALETTE = [
  { name: "Red", hex: "#FF0000" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Green", hex: "#008000" },
  { name: "Yellow", hex: "#FFFF00" },
  { name: "Purple", hex: "#800080" },
  { name: "Orange", hex: "#FFA500" },
];

interface LevelConfig {
  P: number; // Palette size
  O: number; // Number of options
  IncRate: number; // Incongruent probability
  Tasks: string[]; // Allowed tasks
  SwitchRate: number; // Probability task differs from previous
  LureRate: number; // Probability to include lure
  Time: number; // Target time (ms)
}

const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: {
    P: 2,
    O: 2,
    IncRate: 0,
    Tasks: ["INK"],
    SwitchRate: 0,
    LureRate: 0,
    Time: 4500,
  },
  2: {
    P: 3,
    O: 3,
    IncRate: 0,
    Tasks: ["INK"],
    SwitchRate: 0,
    LureRate: 0,
    Time: 4200,
  },
  3: {
    P: 3,
    O: 3,
    IncRate: 0.2,
    Tasks: ["INK"],
    SwitchRate: 0,
    LureRate: 0,
    Time: 3800,
  },
  4: {
    P: 4,
    O: 4,
    IncRate: 0.5,
    Tasks: ["INK"],
    SwitchRate: 0,
    LureRate: 0,
    Time: 3300,
  },
  5: {
    P: 5,
    O: 5,
    IncRate: 0.8,
    Tasks: ["INK"],
    SwitchRate: 0,
    LureRate: 0,
    Time: 2800,
  },
  6: {
    P: 6,
    O: 6,
    IncRate: 0.85,
    Tasks: ["INK"],
    SwitchRate: 0,
    LureRate: 0.1,
    Time: 2400,
  },
  7: {
    P: 4,
    O: 4,
    IncRate: 0.55,
    Tasks: ["INK", "WORD"],
    SwitchRate: 0.2,
    LureRate: 0,
    Time: 2200,
  },
  8: {
    P: 6,
    O: 6,
    IncRate: 0.75,
    Tasks: ["INK", "WORD"],
    SwitchRate: 0.45,
    LureRate: 0.15,
    Time: 1900,
  },
  9: {
    P: 6,
    O: 6,
    IncRate: 0.85,
    Tasks: ["INK", "WORD"],
    SwitchRate: 0.6,
    LureRate: 0.35,
    Time: 1600,
  },
  10: {
    P: 6,
    O: 6,
    IncRate: 0.9,
    Tasks: ["INK", "WORD"],
    SwitchRate: 0.7,
    LureRate: 0.6,
    Time: 1400,
  },
};

const QUESTIONS_PER_LEVEL = 20;

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function shuffle<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

interface Question {
  id: string;
  game_id: string;
  difficulty: number;
  content: {
    type: "stroop_clash";
    word: string;
    ink: string;
    task: string;
    cue: string;
    options: string[];
    targetTimeMs: number;
  };
}

function generateTrial(level: number, prevTask: string | null): Question {
  const config = LEVEL_CONFIGS[level];
  const palette = shuffle(PALETTE).slice(0, config.P);

  // Choose task
  let task = config.Tasks[0];
  if (config.Tasks.length > 1 && prevTask) {
    if (Math.random() < config.SwitchRate) {
      task = prevTask === "INK" ? "WORD" : "INK";
    } else {
      task = prevTask;
    }
  } else if (config.Tasks.length > 1) {
    task = config.Tasks[Math.floor(Math.random() * config.Tasks.length)];
  }

  // Choose congruency
  const isIncongruent = Math.random() < config.IncRate;
  let wordObj = palette[Math.floor(Math.random() * palette.length)];
  let inkObj = wordObj;

  if (isIncongruent) {
    const distractors = palette.filter((p) => p.name !== wordObj.name);
    inkObj = distractors[Math.floor(Math.random() * distractors.length)];
  }

  const correct = task === "INK" ? inkObj.name : wordObj.name;

  // Choices
  let choices = [correct];

  // Lure
  if (Math.random() < config.LureRate) {
    const lure = task === "INK" ? wordObj.name : inkObj.name;
    if (lure !== correct && !choices.includes(lure)) {
      choices.push(lure);
    }
  }

  // Fill remaining choices
  const remainingPalette = palette.filter((p) => !choices.includes(p.name));
  const shuffledRemaining = shuffle(remainingPalette);

  while (choices.length < config.O && shuffledRemaining.length > 0) {
    choices.push(shuffledRemaining.pop()!.name);
  }

  return {
    id: crypto.randomUUID(),
    game_id: "stroop_clash",
    difficulty: level,
    content: {
      type: "stroop_clash",
      word: wordObj.name.toUpperCase(),
      ink: inkObj.hex,
      task,
      cue: task === "INK" ? "COLOR" : "TEXT",
      options: shuffle(choices),
      targetTimeMs: config.Time,
    },
  };
}

/* -------------------------------------------------------------------------- */
/*                                    Main                                    */
/* -------------------------------------------------------------------------- */

const outputDir = path.join(process.cwd(), "scripts", "output");
fs.mkdirSync(outputDir, { recursive: true });

for (let level = 1; level <= 10; level++) {
  const questions: Question[] = [];
  let prevTask: string | null = null;

  for (let i = 0; i < QUESTIONS_PER_LEVEL; i++) {
    const trial = generateTrial(level, prevTask);
    questions.push(trial);
    prevTask = trial.content.task;
  }

  const outputFile = path.join(outputDir, `stroop_clash_${level}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(questions, null, 2));
  console.log(
    `Generated ${questions.length} questions -> stroop_clash_${level}.json`,
  );
}

console.log("\nDone! Generated 10 files (one per difficulty level).");

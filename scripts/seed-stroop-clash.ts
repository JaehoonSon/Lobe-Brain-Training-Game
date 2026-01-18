
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const PALETTE = [
  { name: 'Red', hex: '#FF0000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Green', hex: '#008000' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Orange', hex: '#FFA500' },
];

interface LevelConfig {
  P: number;      // Palette size
  O: number;      // Number of options
  IncRate: number; // Incongruent probability
  Tasks: string[]; // Allowed tasks
  SwitchRate: number; // Probability task differs from previous
  LureRate: number;   // Probability to include lure
  Time: number;       // Target time (ms)
}

const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: { P: 2, O: 2, IncRate: 0, Tasks: ['INK'], SwitchRate: 0, LureRate: 0, Time: 4500 },
  2: { P: 3, O: 3, IncRate: 0, Tasks: ['INK'], SwitchRate: 0, LureRate: 0, Time: 4200 },
  3: { P: 3, O: 3, IncRate: 0.2, Tasks: ['INK'], SwitchRate: 0, LureRate: 0, Time: 3800 },
  4: { P: 4, O: 4, IncRate: 0.5, Tasks: ['INK'], SwitchRate: 0, LureRate: 0, Time: 3300 },
  5: { P: 5, O: 5, IncRate: 0.8, Tasks: ['INK'], SwitchRate: 0, LureRate: 0, Time: 2800 },
  6: { P: 6, O: 6, IncRate: 0.85, Tasks: ['INK'], SwitchRate: 0, LureRate: 0.1, Time: 2400 },
  7: { P: 4, O: 4, IncRate: 0.55, Tasks: ['INK', 'WORD'], SwitchRate: 0.2, LureRate: 0, Time: 2200 },
  8: { P: 6, O: 6, IncRate: 0.75, Tasks: ['INK', 'WORD'], SwitchRate: 0.45, LureRate: 0.15, Time: 1900 },
  9: { P: 6, O: 6, IncRate: 0.85, Tasks: ['INK', 'WORD'], SwitchRate: 0.6, LureRate: 0.35, Time: 1600 },
  10: { P: 6, O: 6, IncRate: 0.9, Tasks: ['INK', 'WORD'], SwitchRate: 0.7, LureRate: 0.6, Time: 1400 },
};

function shuffle<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

function generateTrial(level: number, prevTask: string | null) {
  const config = LEVEL_CONFIGS[level];
  const palette = shuffle(PALETTE).slice(0, config.P);
  
  // Choose task
  let task = config.Tasks[0];
  if (config.Tasks.length > 1 && prevTask) {
    if (Math.random() < config.SwitchRate) {
      task = prevTask === 'INK' ? 'WORD' : 'INK';
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
    const distractors = palette.filter(p => p.name !== wordObj.name);
    inkObj = distractors[Math.floor(Math.random() * distractors.length)];
  }

  const correct = task === 'INK' ? inkObj.name : wordObj.name;
  
  // Choices
  let choices = [correct];
  
  // Lure
  if (Math.random() < config.LureRate) {
    const lure = task === 'INK' ? wordObj.name : inkObj.name;
    if (lure !== correct && !choices.includes(lure)) {
      choices.push(lure);
    }
  }

  // Fill remaining choices
  const remainingPalette = palette.filter(p => !choices.includes(p.name));
  const shuffledRemaining = shuffle(remainingPalette);
  
  while (choices.length < config.O && shuffledRemaining.length > 0) {
    choices.push(shuffledRemaining.pop()!.name);
  }

  return {
    id: crypto.randomUUID(),
    game_id: 'stroop_clash',
    difficulty: level,
    content: {
      type: 'stroop_clash',
      word: wordObj.name.toUpperCase(),
      ink: inkObj.hex,
      task,
      cue: task === 'INK' ? 'COLOR' : 'TEXT',
      options: shuffle(choices),
      targetTimeMs: config.Time
    }
  };
}

const allQuestions = [];
for (let level = 1; level <= 10; level++) {
  let prevTask = null;
  for (let i = 0; i < 20; i++) {
    const trial = generateTrial(level, prevTask);
    allQuestions.push(trial);
    prevTask = trial.content.task;
  }
}

const sql = allQuestions.map(q => {
  return `INSERT INTO public.questions (id, game_id, difficulty, content) VALUES ('${q.id}', '${q.game_id}', ${q.difficulty}, '${JSON.stringify(q.content).replace(/'/g, "''")}') ON CONFLICT (id) DO NOTHING;`;
}).join('\n');

const output = `
-- Seed Stroop Clash Game
INSERT INTO public.games (id, category_id, name, description, instructions, is_active, recommended_rounds)
VALUES ('stroop_clash', 'focus', 'Stroop Clash', 'Identify the color or the word under pressure.', 'Tap the button that matches the requested task (COLOR or TEXT).', true, 10)
ON CONFLICT (id) DO UPDATE SET 
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  instructions = EXCLUDED.instructions,
  is_active = EXCLUDED.is_active,
  recommended_rounds = EXCLUDED.recommended_rounds;

-- Seed Questions
${sql}
`;

fs.writeFileSync(path.join(process.cwd(), 'supabase/migrations/99999999999999_seed_stroop_clash.sql'), output);
console.log('Seeding file generated at supabase/migrations/99999999999999_seed_stroop_clash.sql');

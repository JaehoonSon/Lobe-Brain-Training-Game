export interface Insight {
  id: string;
  title: string;
  category: "Memory" | "Focus" | "Logic" | "Speed" | "Language" | "General";
  readTime: string;
  summary: string;
  content: string; // Markdown content
  image?: string;
  color?: string;
}

export const INSIGHTS: Insight[] = [
  {
    id: "memory-forgetting-curve",
    title: "The Forgetting Curve",
    category: "Memory",
    readTime: "1 min read",
    summary: "Why you forget 50% of what you learn within an hour.",
    content: `
# The Forgetting Curve

Did you know that within one hour of learning something new, you forget about 50% of it? By the next day, you might loose up to 70%!

This phenomenon is known as the **Ebbinghaus Forgetting Curve**.

## How to Beat It

The only way to interrupt this curve is through **Spaced Repetition**. Reviewing material at specific intervals (1 day, 3 days, 1 week) signals to your brain that this information is important, strengthening the neural pathways.

### Quick Tip
When you learn a new name or fact, repeat it immediately, then again 5 minutes later, and once more before bed.
    `,
    color: "#22c55e", // Green
  },
  {
    id: "focus-dopamine-loop",
    title: "The Dopamine Loop",
    category: "Focus",
    readTime: "45 sec read",
    summary: "Why checking your phone feels so good (and hurts focus).",
    content: `
# The Dopamine Loop

Every time you see a notification, your brain releases a tiny hit of **dopamine**. This is the same chemical involved in cravings and addiction.

Your brain loves this "cheap" reward because it requires zero effort. Deep work, on the other hand, is "expensive" in terms of energy.

## The Cost of Switching

When you switch tasks (like checking a text), it takes your brain about **23 minutes** to fully refocus on the original task.

### Quick Tip
Try the **"20-Minute Rule"**. Commit to working on a task for just 20 minutes without checking your phone. It's short enough to not feel overwhelming, but long enough to get into a flow state.
    `,
    color: "#a855f7", // Purple
  },
  {
    id: "logic-first-principles",
    title: "First Principles Thinking",
    category: "Logic",
    readTime: "1.5 min read",
    summary: "How to separate facts from assumptions like Elon Musk.",
    content: `
# First Principles Thinking

Most people reason by **analogy** (copying what others do with slight variations). Innovative thinkers reasoned by **first principles**.

## What is it?
It means boiling a problem down to its fundamental truths and building up from there.

**Analogy:** "Battery packs are expensive because they've always been expensive."
**First Principles:** "What are batteries made of? Cobalt, nickel, aluminum. If we bought these on the metal exchange, it would cost $80/kWh."

### Quick Tip
When you're stuck on a problem, ask "Why?" five times until you reach a foundational truth that cannot be deduced further.
    `,
    color: "#3b82f6", // Blue
  },
  {
    id: "speed-reaction-time",
    title: "Reaction Time vs. Age",
    category: "Speed",
    readTime: "1 min read",
    summary: "Myth-busting cognitive decline (it's slower than you think).",
    content: `
# Reaction Time vs. Age

Many people believe their brain starts slowing down significantly in their 20s. While raw processing speed does peak early, the decline is much slower than most realize.

## The Good News
Studies show that while **fluid intelligence** (speed) decreases slowly, **crystallized intelligence** (knowledge and experience) keeps growing well into your 60s and 70s.

### Brain Training Effect
Engaging in speed-based tasks (like the games in this app!) can actually improve neural efficiency. It's like upgrading the "RAM" in your brain.
    `,
    color: "#f97316", // Orange
  },
  {
    id: "language-tip-of-tongue",
    title: "Tip-of-the-Tongue",
    category: "Language",
    readTime: "1 min read",
    summary: "Why 'losing your words' happens and how to stop it.",
    content: `
# The Tip-of-the-Tongue Phenomenon

We've all been there: you know the word, you can feel it, but you just can't say it. This is called **Lethologica**.

## Why it happens
It's usually a retrieval failure where the concept is activated in your brain, but the phonological (sound) link is weak.

### Quick Tip
Don't just keep struggling! It can actually reinforce the mental block. Instead:
1.  Describe the word.
2.  Use a synonym.
3.  Look it up immediately to strengthen the connection for next time.
    `,
    color: "#ec4899", // Pink
  },
    {
    id: "general-neuroplasticity",
    title: "Neuroplasticity 101",
    category: "General",
    readTime: "2 min read",
    summary: "How your brain physically changes when you learn.",
    content: `
# Neuroplasticity 101

Your brain is not fixed. It is **plastic**, meaning it can change and reorganize itself.

## How it works
"Neurons that fire together, wire together."

Every time you practice a skill—whether it's playing a piano or solving a math puzzle—the connections between the neurons involved get stronger and faster. This is called **myelination**.

### Use it or Lose it
The flip side is also true. Pathways that aren't used get pruned away to save energy. Consistent practice is the key to keeping your brain sharp.
    `,
    color: "#64748b", // Slate
  },
];

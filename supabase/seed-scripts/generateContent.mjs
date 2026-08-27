// One-off script: asks Claude to write brand-new phishing simulations and
// training lessons, then inserts them straight into the real `simulations`
// and `lessons` tables — this is the "API to draw more content from"
// alternative to hand-authoring every scenario ourselves.
//
// Uses tool use (function calling) instead of asking for free-form JSON:
// the model's reply is checked against the tool's input schema before we
// ever see it, so we don't have to hope the model formatted things right.
//
// Usage:
//   1. Fill in ANTHROPIC_API_KEY, VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in your .env
//   2. node supabase/seed-scripts/generateContent.mjs [--simulations N] [--lessons N]
//      (defaults: 3 simulations, 3 lessons)
import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;

if (!supabaseUrl || !serviceRoleKey || !anthropicKey) {
  console.error('Missing VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or ANTHROPIC_API_KEY in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const anthropic = new Anthropic({ apiKey: anthropicKey });

// Reads --simulations N / --lessons N off the command line, defaulting to 3 each.
function readCountArg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  if (i === -1) return fallback;
  const n = parseInt(process.argv[i + 1], 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
const simCount = readCountArg('--simulations', 3);
const lessonCount = readCountArg('--lessons', 3);

// Turns "Executive Gift Card Request" into "executive-gift-card-request",
// then makes it unique against whatever ids already exist (in the
// database or earlier in this same batch) by appending -2, -3, etc.
function makeUniqueId(prefix, name, takenIds) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  let id = `${prefix}_${slug}`;
  let n = 2;
  while (takenIds.has(id)) {
    id = `${prefix}_${slug}-${n}`;
    n += 1;
  }
  takenIds.add(id);
  return id;
}

const GENERATE_TOOL = {
  name: 'generate_training_content',
  description: 'Returns new phishing simulation scenarios and security training lessons for a corporate security-awareness platform.',
  input_schema: {
    type: 'object',
    properties: {
      simulations: {
        type: 'array',
        description: `Exactly ${simCount} new phishing simulation scenarios.`,
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Short scenario name, e.g. "Executive Gift Card Request"' },
            category: { type: 'string', description: 'Attack category, e.g. "Credential Harvest", "Financial Lure", "Executive Impersonation"' },
            difficulty: { type: 'string', enum: ['Low', 'Medium', 'High'] },
            sender: { type: 'string', description: 'Fake "From" header, e.g. "IT Support <support@company-secure-portal.com>"' },
            subject: { type: 'string' },
            body: { type: 'array', items: { type: 'string' }, description: 'Email body as 2-5 short paragraphs' },
            cta_label: { type: 'string', description: 'The phishing call-to-action button text, e.g. \'Click "Verify My Account"\'' },
            red_flags: { type: 'array', items: { type: 'string' }, description: '2-4 concrete red flags explaining what gives this away' },
          },
          required: ['name', 'category', 'difficulty', 'sender', 'subject', 'body', 'cta_label', 'red_flags'],
        },
      },
      lessons: {
        type: 'array',
        description: `Exactly ${lessonCount} new training lessons.`,
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            summary: { type: 'string', description: 'One-sentence summary shown on the lesson list' },
            minutes: { type: 'integer', description: 'Estimated read time in minutes (3-6)' },
            sections: {
              type: 'array',
              description: '3-6 sections of reading material',
              items: {
                type: 'object',
                properties: {
                  heading: { type: 'string' },
                  body: { type: 'array', items: { type: 'string' }, description: '1-2 paragraphs for this section' },
                },
                required: ['heading', 'body'],
              },
            },
            key_takeaways: { type: 'array', items: { type: 'string' }, description: '3-6 short bullet takeaways' },
          },
          required: ['title', 'summary', 'minutes', 'sections', 'key_takeaways'],
        },
      },
    },
    required: ['simulations', 'lessons'],
  },
};

async function generateContent(existingSimNames, existingLessonTitles) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 16000,
    tools: [GENERATE_TOOL],
    tool_choice: { type: 'tool', name: 'generate_training_content' },
    messages: [
      {
        role: 'user',
        content: `You are writing content for ClickWise, a corporate phishing-defense training platform. Write ${simCount} new realistic phishing simulation scenarios and ${lessonCount} new security-awareness training lessons.

Existing simulation names (don't repeat these themes): ${existingSimNames.join(', ') || 'none yet'}
Existing lesson titles (don't repeat these topics): ${existingLessonTitles.join(', ') || 'none yet'}

Simulations should be believable corporate phishing emails (never real company names or real domains — invent plausible fake ones), covering varied attack categories and difficulty levels. Lessons should be practical, plain-English security guidance in the same tone as: clear, direct, no fluff, written for an average employee (not a security expert).`,
      },
    ],
  });

  const toolUse = message.content.find((block) => block.type === 'tool_use');
  if (!toolUse) throw new Error('Claude did not return the expected tool call.');
  return toolUse.input;
}

async function main() {
  console.log(`Asking Claude for ${simCount} simulations and ${lessonCount} lessons...`);

  const [{ data: existingSims }, { data: existingLessons }] = await Promise.all([
    supabase.from('simulations').select('id, name'),
    supabase.from('lessons').select('id, order_index').order('order_index', { ascending: false }).limit(1),
  ]);

  const takenSimIds = new Set((existingSims ?? []).map((s) => s.id));
  const { data: allLessonIds } = await supabase.from('lessons').select('id');
  const takenLessonIds = new Set((allLessonIds ?? []).map((l) => l.id));
  let nextOrderIndex = (existingLessons?.[0]?.order_index ?? 0) + 1;

  const { data: allLessonTitles } = await supabase.from('lessons').select('title');

  const generated = await generateContent(
    (existingSims ?? []).map((s) => s.name),
    (allLessonTitles ?? []).map((l) => l.title)
  );

  const simRows = generated.simulations.map((sim) => ({
    id: makeUniqueId('sim', sim.name, takenSimIds),
    name: sim.name,
    category: sim.category,
    difficulty: sim.difficulty,
    sender: sim.sender,
    subject: sim.subject,
    body: sim.body,
    cta_label: sim.cta_label,
    red_flags: sim.red_flags,
  }));

  const lessonRows = generated.lessons.map((lesson) => ({
    id: makeUniqueId('lesson', lesson.title, takenLessonIds),
    order_index: nextOrderIndex++,
    title: lesson.title,
    summary: lesson.summary,
    minutes: lesson.minutes,
    sections: lesson.sections,
    key_takeaways: lesson.key_takeaways,
  }));

  if (simRows.length) {
    const { error } = await supabase.from('simulations').insert(simRows);
    if (error) throw new Error(`Inserting simulations failed: ${error.message}`);
    console.log(`Added ${simRows.length} simulations:`);
    simRows.forEach((s) => console.log(`  - ${s.id}: ${s.name} (${s.category}, ${s.difficulty})`));
  }

  if (lessonRows.length) {
    const { error } = await supabase.from('lessons').insert(lessonRows);
    if (error) throw new Error(`Inserting lessons failed: ${error.message}`);
    console.log(`Added ${lessonRows.length} lessons:`);
    lessonRows.forEach((l) => console.log(`  - ${l.id} (order ${l.order_index}): ${l.title}`));
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

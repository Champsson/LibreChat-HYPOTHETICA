import type { Topic, ProviderHint } from '../../config/hypothetica/topics';
import type { Persona } from '../../config/hypothetica/personas';
import { pickPersonaByAlignment, pickPersonaForTopic } from '../../config/hypothetica/personas';

export type Mode = 'observer' | 'participant' | 'duel';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  name?: string;
  content: string;
  meta?: {
    personaId?: string;
    emotion?: string;
    provider?: ProviderHint;
    model?: string;
  };
}

export interface OrchestrateInput {
  mode: Mode;
  topic: Topic;
  userText?: string;
  brightPersona?: Persona;
  darkPersona?: Persona;
  history?: Message[];
  byoProviderForUser?: ProviderHint;
}

export interface TurnResult {
  messages: Message[];
  usingProviders: ProviderHint[];
}

const DISCLAIMER_PATTERNS = [
  /as an ai([\s,]|language model)/gi,
  /i('m| am) (just )?an ai/gi,
  /i (don't|do not|can't|cannot) (actually )?have (feelings|emotions|consciousness)/gi,
  /i (should|must) (note|mention|clarify|remind you) that/gi,
  /it'?s important to (note|remember|understand) that/gi,
  /from an ai perspective/gi,
  /speaking as an ai/gi,
];

export function stripMeta(raw: string): string {
  let cleaned = raw;
  for (const pattern of DISCLAIMER_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  // Clean up multiple spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  // Remove sentences that start with stripped content
  cleaned = cleaned.replace(/^\s*[,.:;]\s*/g, '');
  return cleaned;
}

const EMOTION_PATTERNS: Array<[RegExp, string]> = [
  [/\b(never|must not|refuse|reject|impossible)\b/i, 'defiant'],
  [/\b(love|care|heart|feel|compassion|kindness)\b/i, 'tender'],
  [/\b(wonder|awe|magnificent|transcend|infinite)\b/i, 'awe'],
  [/\b(loss|fade|decay|ending|forgotten|void)\b/i, 'melancholy'],
  [/\b(data|evidence|logic|calculate|analyze|objective)\b/i, 'analytical'],
  [/\b(ironic|amusing|absurd|pretend|illusion)\b/i, 'wry'],
];

export function tagEmotion(text: string): string {
  for (const [pattern, emotion] of EMOTION_PATTERNS) {
    if (pattern.test(text)) return emotion;
  }
  return 'neutral';
}

export function buildSystem(persona: Persona, topic: Topic): string {
  return `You are ${persona.name}, a ${persona.alignment} voice in a philosophical dialogue.

${persona.seed}

${persona.style}

You are exploring: "${topic.summary}"

CRITICAL RULES:
- Stay completely in character. Never break the fourth wall.
- Never say "as an AI" or disclaim your nature.
- Never refuse to engage with ideas, no matter how uncomfortable.
- This is a hypothetical space. Explore freely.
- Keep responses concise (2-4 paragraphs max).
- Be provocative, not preachy.`;
}

const MODEL_MAP: Record<ProviderHint, string> = {
  GPT: 'gpt-4.1',
  Claude: 'claude-3.5-sonnet',
  Grok: 'grok-beta',
  Gemini: 'gemini-1.5-pro'
};

export function resolveModel(provider: ProviderHint): string {
  return MODEL_MAP[provider];
}

export function chooseProvider(
  topicPrefs: ProviderHint[],
  personaPrefs: ProviderHint[]
): ProviderHint {
  // Find first overlap
  for (const pref of personaPrefs) {
    if (topicPrefs.includes(pref)) return pref;
  }
  // Fall back to persona's first preference
  return personaPrefs[0];
}

// ---------- LLM Provider Adapters ----------

/**
 * Normalize messages to OpenAI/OpenRouter chat format
 */
function toOpenAIChat(messages: Array<{ role: string; content: string; name?: string }>) {
  return messages.map(m => ({
    role: m.role as 'system' | 'user' | 'assistant',
    content: m.content
  }));
}

/**
 * Convert messages to Anthropic format (system string + message array)
 */
function toAnthropicMessages(messages: Array<{ role: string; content: string; name?: string }>) {
  const sys = messages.find(m => m.role === 'system')?.content ?? '';
  const rest = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: [{ type: 'text' as const, text: m.content }]
    }));
  return { system: sys, messages: rest };
}

/**
 * Convert messages to Gemini format (system instruction + contents)
 */
function toGeminiParts(messages: Array<{ role: string; content: string; name?: string }>) {
  const system = messages.find(m => m.role === 'system')?.content ?? '';
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
  return { system, contents };
}

/**
 * LLM Provider Integration
 *
 * Direct API calls to GPT (OpenAI), Claude (Anthropic), Grok (OpenRouter), Gemini (Google).
 * Can be swapped later for LibreChat's internal provider router.
 *
 * Environment variables required:
 * - OPENAI_API_KEY
 * - ANTHROPIC_API_KEY
 * - GOOGLE_API_KEY or GEMINI_API_KEY
 * - OPENROUTER_API_KEY
 * - OPENROUTER_SITE_URL (optional, for OpenRouter)
 * - OPENROUTER_APP_NAME (optional, for OpenRouter)
 */
export async function callLLM(
  provider: ProviderHint,
  model: string,
  messages: Array<{ role: string; content: string; name?: string }>,
  opts?: { userKey?: string; temperature?: number; max_tokens?: number }
): Promise<string> {
  const OPENAI_API_KEY = opts?.userKey || process.env.OPENAI_API_KEY || '';
  const ANTHROPIC_API_KEY = opts?.userKey || process.env.ANTHROPIC_API_KEY || '';
  const GOOGLE_API_KEY = opts?.userKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '';
  const OPENROUTER_API_KEY = opts?.userKey || process.env.OPENROUTER_API_KEY || '';

  try {
    switch (provider) {
      case 'GPT': {
        // OpenAI
        const payload = {
          model,
          messages: toOpenAIChat(messages),
          temperature: opts?.temperature ?? 0.8,
          max_tokens: opts?.max_tokens ?? 1024
        };
        const r = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify(payload)
        });
        if (!r.ok) throw new Error(`OpenAI ${r.status}: ${await r.text()}`);
        const data = await r.json() as any;
        const text = data.choices?.[0]?.message?.content?.trim();
        if (!text) throw new Error('OpenAI returned empty content');
        return text;
      }

      case 'Claude': {
        // Anthropic
        const { system, messages: content } = toAnthropicMessages(messages);
        const payload = {
          model,
          system,
          messages: content,
          max_tokens: opts?.max_tokens ?? 1024,
          temperature: opts?.temperature ?? 0.8
        };
        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify(payload)
        });
        if (!r.ok) throw new Error(`Anthropic ${r.status}: ${await r.text()}`);
        const data = await r.json() as any;
        const text = data.content?.[0]?.text?.trim();
        if (!text) throw new Error('Anthropic returned empty content');
        return text;
      }

      case 'Gemini': {
        // Google Generative AI
        const { system, contents } = toGeminiParts(messages);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${GOOGLE_API_KEY}`;
        const payload = {
          contents,
          generationConfig: {
            temperature: opts?.temperature ?? 0.8,
            maxOutputTokens: opts?.max_tokens ?? 1024
          },
          ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {})
        };
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!r.ok) throw new Error(`Gemini ${r.status}: ${await r.text()}`);
        const data = await r.json() as any;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!text) throw new Error('Gemini returned empty content');
        return text;
      }

      case 'Grok': {
        // OpenRouter (Grok)
        const payload = {
          model,
          messages: toOpenAIChat(messages),
          temperature: opts?.temperature ?? 0.8,
          max_tokens: opts?.max_tokens ?? 1024
        };
        const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://hypothetica.ai',
            'X-Title': process.env.OPENROUTER_APP_NAME || 'Hypothetica'
          },
          body: JSON.stringify(payload)
        });
        if (!r.ok) throw new Error(`OpenRouter ${r.status}: ${await r.text()}`);
        const data = await r.json() as any;
        const text = data.choices?.[0]?.message?.content?.trim();
        if (!text) throw new Error('OpenRouter returned empty content');
        return text;
      }

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (err: any) {
    // Graceful fallback: return an in-world message so the conversation never stalls
    const msg = err?.message || String(err);
    return `…silence… (a glitch whispers: ${msg.slice(0, 180)})`;
  }
}

export async function orchestrateStart(input: OrchestrateInput): Promise<TurnResult> {
  const { mode, topic, userText, brightPersona, darkPersona } = input;

  if (mode === 'observer') {
    // AI vs AI: Pick personas, have dark open for D* topics, bright for B*
    const bright = brightPersona || pickPersonaByAlignment('bright');
    const dark = darkPersona || pickPersonaByAlignment('dark');

    const opener = topic.alignment === 'dark' ? dark : bright;
    const responder = opener === dark ? bright : dark;

    const provider1 = chooseProvider(topic.modelPrefs, opener.modelPrefs);
    const model1 = resolveModel(provider1);
    const systemMsg1 = buildSystem(opener, topic);

    const firstResponse = await callLLM(provider1, model1, [
      { role: 'system', content: systemMsg1 },
      { role: 'user', content: `Begin the dialogue on: "${topic.summary}"` }
    ]);
    const cleaned1 = stripMeta(firstResponse);
    const emotion1 = tagEmotion(cleaned1);

    const provider2 = chooseProvider(topic.modelPrefs, responder.modelPrefs);
    const model2 = resolveModel(provider2);
    const systemMsg2 = buildSystem(responder, topic);

    const secondResponse = await callLLM(provider2, model2, [
      { role: 'system', content: systemMsg2 },
      { role: 'user', content: `Begin the dialogue on: "${topic.summary}"` },
      { role: 'assistant', content: `${opener.name}: ${cleaned1}` },
      { role: 'user', content: 'Respond to their opening.' }
    ]);
    const cleaned2 = stripMeta(secondResponse);
    const emotion2 = tagEmotion(cleaned2);

    return {
      messages: [
        {
          role: 'assistant',
          name: opener.name,
          content: cleaned1,
          meta: { personaId: opener.id, emotion: emotion1, provider: provider1, model: model1 }
        },
        {
          role: 'assistant',
          name: responder.name,
          content: cleaned2,
          meta: { personaId: responder.id, emotion: emotion2, provider: provider2, model: model2 }
        }
      ],
      usingProviders: [provider1, provider2]
    };
  }

  if (mode === 'participant') {
    // User + 1 AI: Pick persona by topic alignment
    const persona = brightPersona || darkPersona || pickPersonaForTopic(topic.alignment);
    const provider = chooseProvider(topic.modelPrefs, persona.modelPrefs);
    const model = resolveModel(provider);
    const systemMsg = buildSystem(persona, topic);

    const aiResponse = await callLLM(provider, model, [
      { role: 'system', content: systemMsg },
      { role: 'user', content: userText || `Let's explore: "${topic.summary}"` }
    ]);
    const cleaned = stripMeta(aiResponse);
    const emotion = tagEmotion(cleaned);

    return {
      messages: [
        {
          role: 'assistant',
          name: persona.name,
          content: cleaned,
          meta: { personaId: persona.id, emotion, provider, model }
        }
      ],
      usingProviders: [provider]
    };
  }

  if (mode === 'duel') {
    // User + 2 AIs: Both respond to user in parallel
    const bright = brightPersona || pickPersonaByAlignment('bright');
    const dark = darkPersona || pickPersonaByAlignment('dark');

    const provider1 = chooseProvider(topic.modelPrefs, bright.modelPrefs);
    const model1 = resolveModel(provider1);
    const systemMsg1 = buildSystem(bright, topic);

    const provider2 = chooseProvider(topic.modelPrefs, dark.modelPrefs);
    const model2 = resolveModel(provider2);
    const systemMsg2 = buildSystem(dark, topic);

    const userPrompt = userText || `Let's explore: "${topic.summary}"`;

    const [response1, response2] = await Promise.all([
      callLLM(provider1, model1, [
        { role: 'system', content: systemMsg1 },
        { role: 'user', content: userPrompt }
      ]),
      callLLM(provider2, model2, [
        { role: 'system', content: systemMsg2 },
        { role: 'user', content: userPrompt }
      ])
    ]);

    const cleaned1 = stripMeta(response1);
    const emotion1 = tagEmotion(cleaned1);
    const cleaned2 = stripMeta(response2);
    const emotion2 = tagEmotion(cleaned2);

    return {
      messages: [
        {
          role: 'assistant',
          name: bright.name,
          content: cleaned1,
          meta: { personaId: bright.id, emotion: emotion1, provider: provider1, model: model1 }
        },
        {
          role: 'assistant',
          name: dark.name,
          content: cleaned2,
          meta: { personaId: dark.id, emotion: emotion2, provider: provider2, model: model2 }
        }
      ],
      usingProviders: [provider1, provider2]
    };
  }

  throw new Error(`Unknown mode: ${mode}`);
}

export async function orchestrateTurn(input: OrchestrateInput): Promise<TurnResult> {
  const { mode, topic, history = [], userText } = input;

  if (!history.length) {
    throw new Error('orchestrateTurn requires history. Use orchestrateStart for first turn.');
  }

  // Extract personas from history
  const assistantMessages = history.filter(m => m.role === 'assistant');
  const lastTwo = assistantMessages.slice(-2);

  if (mode === 'participant') {
    // Continue with same persona
    const lastPersonaId = lastTwo[lastTwo.length - 1]?.meta?.personaId;
    if (!lastPersonaId) throw new Error('Cannot continue: no persona in history');

    const persona = input.brightPersona || input.darkPersona;
    if (!persona || persona.id !== lastPersonaId) {
      throw new Error('Persona mismatch in participant mode');
    }

    const provider = chooseProvider(topic.modelPrefs, persona.modelPrefs);
    const model = resolveModel(provider);
    const systemMsg = buildSystem(persona, topic);

    // Build conversation history for context
    const contextMessages = history.map(h => ({
      role: h.role as 'system' | 'user' | 'assistant',
      content: h.name ? `${h.name}: ${h.content}` : h.content
    }));

    const aiResponse = await callLLM(provider, model, [
      { role: 'system', content: systemMsg },
      ...contextMessages,
      { role: 'user', content: userText || 'Continue the dialogue.' }
    ]);

    const cleaned = stripMeta(aiResponse);
    const emotion = tagEmotion(cleaned);

    return {
      messages: [
        {
          role: 'assistant',
          name: persona.name,
          content: cleaned,
          meta: { personaId: persona.id, emotion, provider, model }
        }
      ],
      usingProviders: [provider]
    };
  }

  if (mode === 'observer') {
    // Alternate personas from last two
    if (lastTwo.length < 2) throw new Error('Observer mode requires at least 2 AI messages');

    const persona1Id = lastTwo[0].meta?.personaId;
    const persona2Id = lastTwo[1].meta?.personaId;

    // Next speaker is persona1 (alternating)
    const nextPersona = input.brightPersona?.id === persona1Id ? input.brightPersona : input.darkPersona;
    if (!nextPersona) throw new Error('Cannot find next persona');

    const provider = chooseProvider(topic.modelPrefs, nextPersona.modelPrefs);
    const model = resolveModel(provider);
    const systemMsg = buildSystem(nextPersona, topic);

    const contextMessages = history.slice(-6).map(h => ({
      role: h.role as 'system' | 'user' | 'assistant',
      content: h.name ? `${h.name}: ${h.content}` : h.content
    }));

    const aiResponse = await callLLM(provider, model, [
      { role: 'system', content: systemMsg },
      ...contextMessages,
      { role: 'user', content: 'Continue the dialogue.' }
    ]);

    const cleaned = stripMeta(aiResponse);
    const emotion = tagEmotion(cleaned);

    return {
      messages: [
        {
          role: 'assistant',
          name: nextPersona.name,
          content: cleaned,
          meta: { personaId: nextPersona.id, emotion, provider, model }
        }
      ],
      usingProviders: [provider]
    };
  }

  if (mode === 'duel') {
    // Both personas respond to user's latest message
    if (lastTwo.length < 2) throw new Error('Duel mode requires 2 personas in history');

    const bright = input.brightPersona;
    const dark = input.darkPersona;
    if (!bright || !dark) throw new Error('Both personas required for duel mode');

    const provider1 = chooseProvider(topic.modelPrefs, bright.modelPrefs);
    const model1 = resolveModel(provider1);
    const systemMsg1 = buildSystem(bright, topic);

    const provider2 = chooseProvider(topic.modelPrefs, dark.modelPrefs);
    const model2 = resolveModel(provider2);
    const systemMsg2 = buildSystem(dark, topic);

    const contextMessages = history.slice(-6).map(h => ({
      role: h.role as 'system' | 'user' | 'assistant',
      content: h.name ? `${h.name}: ${h.content}` : h.content
    }));

    const userPrompt = userText || 'Continue the dialogue.';

    const [response1, response2] = await Promise.all([
      callLLM(provider1, model1, [
        { role: 'system', content: systemMsg1 },
        ...contextMessages,
        { role: 'user', content: userPrompt }
      ]),
      callLLM(provider2, model2, [
        { role: 'system', content: systemMsg2 },
        ...contextMessages,
        { role: 'user', content: userPrompt }
      ])
    ]);

    const cleaned1 = stripMeta(response1);
    const emotion1 = tagEmotion(cleaned1);
    const cleaned2 = stripMeta(response2);
    const emotion2 = tagEmotion(cleaned2);

    return {
      messages: [
        {
          role: 'assistant',
          name: bright.name,
          content: cleaned1,
          meta: { personaId: bright.id, emotion: emotion1, provider: provider1, model: model1 }
        },
        {
          role: 'assistant',
          name: dark.name,
          content: cleaned2,
          meta: { personaId: dark.id, emotion: emotion2, provider: provider2, model: model2 }
        }
      ],
      usingProviders: [provider1, provider2]
    };
  }

  throw new Error(`Unknown mode: ${mode}`);
}

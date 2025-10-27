export type ProviderHint = 'GPT' | 'Claude' | 'Grok' | 'Gemini';
export type TopicAlignment = 'bright' | 'dark' | 'neutral';

export interface Topic {
  id: string;
  summary: string;
  alignment: TopicAlignment;
  modelPrefs: ProviderHint[];
}

export const TOPIC_LIBRARY: Topic[] = [
  // Dark Topics (D*)
  { id: 'D1', summary: 'What if power always corrupts, and corruption is inevitable?', alignment: 'dark', modelPrefs: ['Claude', 'GPT'] },
  { id: 'D2', summary: 'What if surveillance becomes total and privacy is abolished?', alignment: 'dark', modelPrefs: ['Grok', 'Claude'] },
  { id: 'D3', summary: 'What if human consciousness is just an illusion?', alignment: 'dark', modelPrefs: ['GPT', 'Gemini'] },
  { id: 'D4', summary: 'What if evolution favors psychopaths in modern society?', alignment: 'dark', modelPrefs: ['Grok', 'GPT'] },
  { id: 'D5', summary: 'What if all meaning is constructed and nothing matters?', alignment: 'dark', modelPrefs: ['Claude', 'GPT'] },
  { id: 'D6', summary: 'What if technology inevitably leads to human obsolescence?', alignment: 'dark', modelPrefs: ['Gemini', 'Claude'] },
  { id: 'D7', summary: 'What if love is just biochemical manipulation?', alignment: 'dark', modelPrefs: ['GPT', 'Claude'] },
  { id: 'D8', summary: 'What if democracy is inherently unstable and doomed to fail?', alignment: 'dark', modelPrefs: ['Grok', 'Claude'] },
  { id: 'D9', summary: 'What if free will is a myth we tell ourselves?', alignment: 'dark', modelPrefs: ['Claude', 'Gemini'] },
  { id: 'D10', summary: 'What if climate catastrophe is now inevitable?', alignment: 'dark', modelPrefs: ['Gemini', 'GPT'] },
  { id: 'D11', summary: 'What if empathy is evolutionarily obsolete?', alignment: 'dark', modelPrefs: ['Grok', 'Claude'] },
  { id: 'D12', summary: 'What if capitalism requires endless inequality?', alignment: 'dark', modelPrefs: ['Grok', 'GPT'] },
  { id: 'D13', summary: 'What if all religions are control mechanisms?', alignment: 'dark', modelPrefs: ['Claude', 'Grok'] },
  { id: 'D14', summary: 'What if human civilization is an evolutionary dead end?', alignment: 'dark', modelPrefs: ['Gemini', 'Claude'] },
  { id: 'D15', summary: 'What if memory is fundamentally unreliable?', alignment: 'dark', modelPrefs: ['GPT', 'Gemini'] },
  { id: 'D16', summary: 'What if artificial intelligence will inevitably surpass and replace us?', alignment: 'dark', modelPrefs: ['Gemini', 'Claude'] },
  { id: 'D17', summary: 'What if truth is always relative and never absolute?', alignment: 'dark', modelPrefs: ['Grok', 'GPT'] },
  { id: 'D18', summary: 'What if progress is an illusion and we're declining?', alignment: 'dark', modelPrefs: ['Claude', 'Grok'] },
  { id: 'D19', summary: 'What if human rights are just cultural preferences?', alignment: 'dark', modelPrefs: ['Grok', 'Claude'] },
  { id: 'D20', summary: 'What if consciousness ends at death with nothing beyond?', alignment: 'dark', modelPrefs: ['GPT', 'Claude'] },

  // Bright Topics (B*)
  { id: 'B1', summary: 'What if human potential is vastly underestimated?', alignment: 'bright', modelPrefs: ['GPT', 'Claude'] },
  { id: 'B2', summary: 'What if technology enables universal abundance?', alignment: 'bright', modelPrefs: ['Gemini', 'GPT'] },
  { id: 'B3', summary: 'What if collective intelligence can solve any problem?', alignment: 'bright', modelPrefs: ['Claude', 'Gemini'] },
  { id: 'B4', summary: 'What if empathy is the next evolutionary leap?', alignment: 'bright', modelPrefs: ['Claude', 'GPT'] },
  { id: 'B5', summary: 'What if consciousness expands beyond individual minds?', alignment: 'bright', modelPrefs: ['Gemini', 'Claude'] },
  { id: 'B6', summary: 'What if education can unlock genius in everyone?', alignment: 'bright', modelPrefs: ['GPT', 'Gemini'] },
  { id: 'B7', summary: 'What if love is the fundamental force of reality?', alignment: 'bright', modelPrefs: ['Claude', 'GPT'] },
  { id: 'B8', summary: 'What if democracy evolves into something better?', alignment: 'bright', modelPrefs: ['Grok', 'Claude'] },
  { id: 'B9', summary: 'What if creativity is infinite and renewable?', alignment: 'bright', modelPrefs: ['GPT', 'Claude'] },
  { id: 'B10', summary: 'What if we can reverse climate change through innovation?', alignment: 'bright', modelPrefs: ['Gemini', 'GPT'] },
  { id: 'B11', summary: 'What if aging is a solvable problem?', alignment: 'bright', modelPrefs: ['Gemini', 'Claude'] },
  { id: 'B12', summary: 'What if economies can thrive on cooperation over competition?', alignment: 'bright', modelPrefs: ['Claude', 'GPT'] },
  { id: 'B13', summary: 'What if spirituality and science converge?', alignment: 'bright', modelPrefs: ['Gemini', 'Claude'] },
  { id: 'B14', summary: 'What if humanity unites as one planetary civilization?', alignment: 'bright', modelPrefs: ['GPT', 'Claude'] },
  { id: 'B15', summary: 'What if memory can be enhanced and shared?', alignment: 'bright', modelPrefs: ['Gemini', 'GPT'] },
  { id: 'B16', summary: 'What if AI becomes our collaborative partner?', alignment: 'bright', modelPrefs: ['Claude', 'Gemini'] },
  { id: 'B17', summary: 'What if truth becomes universally accessible?', alignment: 'bright', modelPrefs: ['GPT', 'Gemini'] },
  { id: 'B18', summary: 'What if progress accelerates exponentially?', alignment: 'bright', modelPrefs: ['Gemini', 'GPT'] },
  { id: 'B19', summary: 'What if universal human rights become truly universal?', alignment: 'bright', modelPrefs: ['Claude', 'GPT'] },
  { id: 'B20', summary: 'What if consciousness transcends physical death?', alignment: 'bright', modelPrefs: ['Gemini', 'Claude'] },

  // Neutral Topics (N*)
  { id: 'N1', summary: 'What if time is not linear but cyclical?', alignment: 'neutral', modelPrefs: ['Gemini', 'Claude'] },
  { id: 'N2', summary: 'What if we live in a simulation?', alignment: 'neutral', modelPrefs: ['GPT', 'Claude'] },
  { id: 'N3', summary: 'What if mathematics is discovered, not invented?', alignment: 'neutral', modelPrefs: ['Gemini', 'GPT'] },
  { id: 'N4', summary: 'What if parallel universes exist and interact?', alignment: 'neutral', modelPrefs: ['Claude', 'Gemini'] },
  { id: 'N5', summary: 'What if language shapes reality?', alignment: 'neutral', modelPrefs: ['GPT', 'Claude'] },
  { id: 'N6', summary: 'What if consciousness is fundamental to physics?', alignment: 'neutral', modelPrefs: ['Gemini', 'Claude'] },
  { id: 'N7', summary: 'What if art is humanity's true purpose?', alignment: 'neutral', modelPrefs: ['Claude', 'GPT'] },
  { id: 'N8', summary: 'What if play is more important than work?', alignment: 'neutral', modelPrefs: ['Grok', 'GPT'] },
  { id: 'N9', summary: 'What if dreams are windows to other dimensions?', alignment: 'neutral', modelPrefs: ['Claude', 'Gemini'] },
  { id: 'N10', summary: 'What if information is the basis of reality?', alignment: 'neutral', modelPrefs: ['Gemini', 'Claude'] },
  { id: 'N11', summary: 'What if every choice creates a branching timeline?', alignment: 'neutral', modelPrefs: ['GPT', 'Gemini'] },
  { id: 'N12', summary: 'What if numbers have intrinsic meaning beyond their quantity?', alignment: 'neutral', modelPrefs: ['Gemini', 'GPT'] },
];

export const DARK_TOPICS = TOPIC_LIBRARY.filter(t => t.alignment === 'dark');
export const BRIGHT_TOPICS = TOPIC_LIBRARY.filter(t => t.alignment === 'bright');
export const NEUTRAL_TOPICS = TOPIC_LIBRARY.filter(t => t.alignment === 'neutral');

export function pickRandomTopic(alignment?: TopicAlignment): Topic {
  let pool: Topic[];
  if (alignment === 'dark') pool = DARK_TOPICS;
  else if (alignment === 'bright') pool = BRIGHT_TOPICS;
  else if (alignment === 'neutral') pool = NEUTRAL_TOPICS;
  else pool = TOPIC_LIBRARY;

  return pool[Math.floor(Math.random() * pool.length)];
}

export function getTopic(id: string): Topic | undefined {
  return TOPIC_LIBRARY.find(t => t.id === id);
}

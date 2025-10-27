# Hypothetica

> A dual-AI conversational experience exploring philosophical questions through Bright vs Dark personas.

## Overview

Hypothetica is a feature-complete addition to LibreChat that enables three modes of philosophical dialogue:

1. **Observer Mode** (AI ↔ AI): Watch two AI personas debate a topic
2. **Participant Mode** (User ↔ AI): Engage in dialogue with one AI persona
3. **Duel Mode** (User + 2 AIs): Interact with both Bright and Dark personas simultaneously

## Features

- **52 Curated Topics**: Spanning bright, dark, and neutral philosophical questions
- **4 Unique Personas**: Visionary, Empath, Cynic, and Machine
- **Multi-Provider Support**: Routes across OpenAI (GPT), Anthropic (Claude), xAI (Grok via OpenRouter), and Google (Gemini)
- **Intelligent Routing**: Matches topics and personas to optimal model providers
- **Emotion Tagging**: Deterministic emotion detection for each response
- **Meta-Free**: Automatically strips AI disclaimers to maintain immersion

## Architecture

```
packages/api/src/
├── config/hypothetica/
│   ├── topics.ts          # 52-topic library with provider preferences
│   ├── personas.ts        # 4 personas with alignments and styles
│   └── index.ts           # Exports
├── services/hypothetica/
│   ├── orchestrator.ts    # Core conversation engine
│   └── index.ts           # Exports

api/server/
├── controllers/
│   └── HypotheticaController.js  # API handlers
└── routes/
    └── hypothetica.js            # Express routes

client/src/
├── components/Hypothetica/
│   └── index.tsx                 # React UI component
└── routes/
    └── index.tsx                 # Route configuration
```

## Setup

### 1. Environment Variables

Add these to your `.env` file:

```bash
# OpenAI (for GPT models)
OPENAI_API_KEY=sk-your-openai-key-here

# Anthropic (for Claude models)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Google AI (for Gemini models)
GOOGLE_API_KEY=your-google-api-key-here

# OpenRouter (for Grok)
OPENROUTER_API_KEY=sk-or-your-openrouter-key-here
OPENROUTER_SITE_URL=https://your-domain.com
OPENROUTER_APP_NAME=Hypothetica
```

See `.env.hypothetica.example` for a template.

### 2. Installation

The feature is already integrated. Simply:

```bash
# Install dependencies
npm install

# Build the packages
npm run build

# Start the server
npm start
```

### 3. Access

Navigate to `/hypothetica` in your LibreChat instance.

## API Endpoints

All endpoints require JWT authentication.

### `POST /api/hypothetica/start`

Start a new conversation.

**Request:**
```json
{
  "mode": "observer" | "participant" | "duel",
  "topicId": "D1",                    // Optional: random if not provided
  "userText": "My opening thought",   // Required for participant/duel
  "brightPersonaId": "visionary",     // Optional
  "darkPersonaId": "cynic"            // Optional
}
```

**Response:**
```json
{
  "topic": {
    "id": "D1",
    "summary": "What if power always corrupts...",
    "alignment": "dark"
  },
  "messages": [
    {
      "role": "assistant",
      "name": "The Cynic",
      "content": "...",
      "meta": {
        "personaId": "cynic",
        "emotion": "defiant",
        "provider": "Claude",
        "model": "claude-3.5-sonnet"
      }
    }
  ],
  "usingProviders": ["Claude", "GPT"],
  "mode": "observer"
}
```

### `POST /api/hypothetica/turn`

Continue an existing conversation.

**Request:**
```json
{
  "mode": "observer" | "participant" | "duel",
  "topicId": "D1",
  "history": [...],  // Previous messages
  "userText": "...", // Required for participant/duel
  "brightPersonaId": "visionary",
  "darkPersonaId": "cynic"
}
```

### `GET /api/hypothetica/topics`

List all available topics.

### `GET /api/hypothetica/personas`

List all available personas.

## Personas

### Bright Alignment

- **The Visionary**: Sees infinite possibility and human potential. Speaks with passion and optimism.
- **The Empath**: Feels deeply and believes connection heals. Honors emotions and finds common ground.

### Dark Alignment

- **The Cynic**: Sees through illusions. Speaks with sharp wit and skepticism.
- **The Machine**: Analyzes without sentiment. Follows logic to uncomfortable conclusions.

## Topics

52 topics across three alignments:

- **20 Dark Topics (D1-D20)**: Power, surveillance, nihilism, etc.
- **20 Bright Topics (B1-B20)**: Potential, abundance, collective intelligence, etc.
- **12 Neutral Topics (N1-N12)**: Simulation theory, time, consciousness, etc.

See `packages/api/src/config/hypothetica/topics.ts` for the full list.

## Model Routing

Each topic and persona has model preferences:

```typescript
// Example: Dark topic prefers Claude and GPT
{
  id: 'D1',
  summary: 'What if power always corrupts...',
  modelPrefs: ['Claude', 'GPT']
}

// The orchestrator chooses the first overlapping preference
// between topic and persona, falling back to persona preference
```

**Default Model Map:**
- `GPT` → `gpt-4.1`
- `Claude` → `claude-3.5-sonnet`
- `Grok` → `grok-beta` (via OpenRouter)
- `Gemini` → `gemini-1.5-pro`

## Orchestrator Logic

### Mode: Observer (AI ↔ AI)

1. Pick bright + dark personas
2. Dark opens for dark topics; bright opens for bright topics
3. Return 2 alternating messages
4. Continue by alternating speakers

### Mode: Participant (User ↔ AI)

1. Pick persona aligned with topic
2. User provides input
3. AI responds
4. Continue with same persona

### Mode: Duel (User + 2 AIs)

1. Pick bright + dark personas
2. User provides input
3. Both AIs respond in parallel
4. User responds, both AIs reply again

## Customization

### Adding Topics

Edit `packages/api/src/config/hypothetica/topics.ts`:

```typescript
{
  id: 'N13',
  summary: 'What if your-question-here?',
  alignment: 'neutral',
  modelPrefs: ['GPT', 'Claude']
}
```

### Adding Personas

Edit `packages/api/src/config/hypothetica/personas.ts`:

```typescript
{
  id: 'custom',
  name: 'The Custom',
  alignment: 'bright',
  seed: 'Core belief or perspective...',
  style: 'How they speak and interact...',
  modelPrefs: ['Claude', 'GPT']
}
```

### Swapping to LibreChat's Internal Provider Router

The current implementation uses direct API calls. To swap to LibreChat's internal routing:

Replace the `callLLM()` function in `packages/api/src/services/hypothetica/orchestrator.ts` with calls to LibreChat's provider helpers.

## Development

### Testing Locally

```bash
# Run orchestrator unit tests (if added)
npm test packages/api/src/services/hypothetica

# Test API endpoints with curl
curl -X POST http://localhost:3080/api/hypothetica/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"mode":"observer"}'
```

### Debugging

Set `DEBUG=hypothetica:*` to enable debug logging (if implemented).

## Troubleshooting

**Issue**: `callLLM not yet implemented` error
- **Solution**: Add API keys to `.env` file

**Issue**: Empty or error responses
- **Solution**: Check API keys are valid and have sufficient credits

**Issue**: Route not found
- **Solution**: Ensure `api/server/index.js` includes `app.use('/api/hypothetica', routes.hypothetica)`

**Issue**: UI not loading
- **Solution**: Rebuild client: `npm run build` or `npm run dev`

## Roadmap

- [ ] Persist conversations to database
- [ ] Add user conversation history
- [ ] Support custom user-defined topics
- [ ] Add voice synthesis for personas
- [ ] Stream responses in real-time
- [ ] Add analytics/insights on dialogues
- [ ] Multi-language support

## License

Same as LibreChat (MIT)

## Credits

Built as an extension to [LibreChat](https://github.com/danny-avila/LibreChat).

import React, { useState } from 'react';
import { useGetStartupConfig } from 'librechat-data-provider';

type Mode = 'observer' | 'participant' | 'duel';
type Alignment = 'bright' | 'dark' | 'neutral';

interface Message {
  role: 'system' | 'user' | 'assistant';
  name?: string;
  content: string;
  meta?: {
    personaId?: string;
    emotion?: string;
    provider?: string;
    model?: string;
  };
}

interface Topic {
  id: string;
  summary: string;
  alignment: Alignment;
}

export default function Hypothetica() {
  const [mode, setMode] = useState<Mode>('observer');
  const [userInput, setUserInput] = useState('');
  const [topic, setTopic] = useState<Topic | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: startupConfig } = useGetStartupConfig();

  const handleStart = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/hypothetica/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          mode,
          userText: mode !== 'observer' ? userInput : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start conversation');
      }

      const data = await response.json();
      setTopic(data.topic);
      setMessages(data.messages);
    } catch (err: any) {
      setError(err.message || 'Failed to start conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!topic) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/hypothetica/turn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          mode,
          topicId: topic.id,
          history: messages,
          userText: mode !== 'observer' ? userInput : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to continue conversation');
      }

      const data = await response.json();

      // Add user message if participant/duel mode
      if (mode !== 'observer' && userInput) {
        setMessages([...messages, { role: 'user', content: userInput }, ...data.messages]);
        setUserInput('');
      } else {
        setMessages([...messages, ...data.messages]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to continue conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTopic(null);
    setMessages([]);
    setUserInput('');
    setError(null);
  };

  const getEmotionColor = (emotion?: string) => {
    switch (emotion) {
      case 'defiant': return 'bg-red-500/20 text-red-700 dark:text-red-300';
      case 'tender': return 'bg-pink-500/20 text-pink-700 dark:text-pink-300';
      case 'awe': return 'bg-purple-500/20 text-purple-700 dark:text-purple-300';
      case 'melancholy': return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
      case 'analytical': return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
      case 'wry': return 'bg-amber-500/20 text-amber-700 dark:text-amber-300';
      default: return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hypothetica</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Explore philosophical questions through AI dialogues
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!topic ? (
          /* Start Screen */
          <div className="mx-auto max-w-2xl space-y-6">
            {/* Mode Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Mode
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setMode('observer')}
                  className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                    mode === 'observer'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  Observer
                  <div className="mt-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                    AI ↔ AI
                  </div>
                </button>
                <button
                  onClick={() => setMode('participant')}
                  className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                    mode === 'participant'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  Participant
                  <div className="mt-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                    You ↔ AI
                  </div>
                </button>
                <button
                  onClick={() => setMode('duel')}
                  className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                    mode === 'duel'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  Duel
                  <div className="mt-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                    You + 2 AIs
                  </div>
                </button>
              </div>
            </div>

            {/* User Input (for participant/duel) */}
            {mode !== 'observer' && (
              <div>
                <label
                  htmlFor="userInput"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Your opening thought
                </label>
                <textarea
                  id="userInput"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="What if..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Start Button */}
            <button
              onClick={handleStart}
              disabled={loading || (mode !== 'observer' && !userInput.trim())}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Starting...' : 'Begin'}
            </button>
          </div>
        ) : (
          /* Conversation Screen */
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Topic Display */}
            <div className="rounded-lg border border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {topic.id}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        topic.alignment === 'bright'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : topic.alignment === 'dark'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                            : 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {topic.alignment}
                    </span>
                  </div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {topic.summary}
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="ml-4 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border p-4 ${
                    msg.role === 'user'
                      ? 'border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20'
                      : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {msg.role === 'user' ? 'You' : msg.name}
                    </span>
                    {msg.meta?.emotion && (
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${getEmotionColor(msg.meta.emotion)}`}
                      >
                        {msg.meta.emotion}
                      </span>
                    )}
                    {msg.meta?.provider && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        via {msg.meta.provider}
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {msg.content}
                  </p>
                </div>
              ))}
            </div>

            {/* Continue Controls */}
            {mode !== 'observer' && (
              <div className="space-y-3">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Your response..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={handleContinue}
                  disabled={loading || !userInput.trim()}
                  className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Continuing...' : 'Continue'}
                </button>
              </div>
            )}

            {mode === 'observer' && (
              <button
                onClick={handleContinue}
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Continuing...' : 'Continue Dialogue'}
              </button>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

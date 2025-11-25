# Chat History & Reset Guide

This guide explains how to use the new chat history continuity and reset features.

## Endpoint
`POST /api/ai/chat`

## Request Fields
- `messages` (array) – Legacy field; still supported. Ignored if `history` provided.
- `history` (array) – Full ordered list of prior messages you want the model to consider.
  - Each element: `{ role: 'user' | 'assistant' | 'system', content: string }`
- `reset` (boolean) – If `true`, clears prior conversational context except the first system message.
- `provider` (optional) – Force provider: `openai | gemini | anthropic | auto`.
- `sessionId` (optional) – For admin command logging.

## Example: Continue Conversation
```jsonc
{
  "history": [
    { "role": "system", "content": "You are an OSIS assistant." },
    { "role": "user", "content": "Siapa ketua OSIS?" },
    { "role": "assistant", "content": "Ketua OSIS saat ini adalah ..." },
    { "role": "user", "content": "Sekbid apa yang fokus pada lingkungan?" }
  ],
  "provider": "auto"
}
```

## Example: Reset Conversation
```jsonc
{
  "history": [
    { "role": "system", "content": "You are an OSIS assistant." },
    { "role": "user", "content": "Pertanyaan lama" },
    { "role": "assistant", "content": "Jawaban lama" }
  ],
  "reset": true
}
```
Result: Previous user/assistant turns are discarded; only system prompt + new user message sent.

## Response Fields
- `reply` – Cleaned text answer.
- `historyEnabled` – Always `true` when new history feature path executed.
- `resetApplied` – `true` if the request used `reset: true`.

## Tips
- Limit history to the most relevant last ~15 turns to reduce latency.
- Use `reset: true` before starting a new topic to avoid context bleed.
- Provide a consistent `system` message at the start of `history` for stable behavior.

## Fallback Behavior
If both `messages` and `history` are omitted or empty, the API expects at least one user message; otherwise it returns an error.

Last Updated: 2025-11-21
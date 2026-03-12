# LLM API — Project 01: Minimal LLM-Powered REST API

> First project in a series exploring AI Engineering practices.

## Motivation

This is the first in a series of study projects focused on **AI Engineering** — the discipline of building production-ready systems that consume Large Language Models as a service.

The goal here was deliberately narrow: stand up the simplest possible REST API that talks to an LLM and apply a handful of engineering practices that matter even at this small scale. No frameworks beyond Express, no ORM, no SDK wrappers around the OpenAI client — just raw `fetch` calls and a few well-placed abstractions.

The constraints were intentional. Keeping dependencies minimal forces a clearer understanding of what is actually happening at each layer: how the HTTP request reaches OpenAI, how a streaming response is read chunk by chunk, how an in-memory cache avoids redundant API calls, and how cost can be tracked without any external tooling.

## Tech Stack

| Concern      | Choice                                   |
| ------------ | ---------------------------------------- |
| Runtime      | Node.js (CommonJS)                       |
| Framework    | Express 5                                |
| LLM Provider | OpenAI (`gpt-4.1-mini` / `gpt-4.1-nano`) |
| HTTP Client  | Native `fetch` (no SDK)                  |
| Config       | `dotenv`                                 |

Two production dependencies. That's it.

## Architecture

```
src/
├── server.js              # App entrypoint — Express setup, middleware wiring
├── routes/
│   └── ask.routes.js      # POST /ask  and  POST /ask/stream
├── controllers/
│   └── ask.controller.js  # Request handling, cache lookup, response shaping
├── services/
│   └── llm.service.js     # All OpenAI communication (standard + streaming)
├── cache/
│   └── memoryCache.js     # In-process Map with TTL-based expiration
├── middlewares/
│   ├── logger.js          # Structured request logging with timing and usage
│   └── rateLimit.js       # Sliding-window rate limiter (no external dependency)
└── utils/
    ├── normalizeQuestion.js  # Input normalization for consistent cache keys
    ├── streamText.js         # Streams cached responses word-by-word
    ├── tokenCounter.js       # Token and cost estimation (heuristic)
    └── usage.js              # Computes usage report per request
```

### Request Lifecycle

**Standard endpoint — `POST /ask`**

1. Input is validated and normalized (trimmed, lowercased, collapsed whitespace).
2. The normalized question is used as the cache key. A hit returns immediately, skipping the LLM call entirely.
3. On a miss, the question is forwarded to OpenAI via a raw `fetch` call with an 8-second `AbortController` timeout.
4. The response is cached and returned alongside a `cached: false` flag.
5. After the response is sent, the logger middleware logs timing, status, cache status, and estimated token usage.

**Streaming endpoint — `POST /ask/stream`**

1. Same normalization and cache lookup as above.
2. On a cache hit, the stored answer is re-streamed word-by-word with a small artificial delay to preserve the streaming UX.
3. On a miss, the `stream: true` flag is sent to OpenAI. The response body is read as a `ReadableStream`; each SSE chunk is decoded, parsed, and forwarded directly to the client as it arrives.
4. Once the stream completes, the full assembled answer is saved to cache.

### Key Engineering Decisions

**No OpenAI SDK.** The official SDK is convenient, but using raw `fetch` makes the underlying HTTP contract explicit — headers, request body shape, SSE parsing, error handling. It also means zero lock-in to SDK versioning.

**In-memory cache with TTL.** LLM responses to the same question don't change meaningfully in a short window. A 5-minute TTL cache backed by a `Map` eliminates redundant API calls and latency without any infrastructure dependency. The cache key is derived from the _normalized_ question, so minor formatting differences in user input don't cause spurious misses.

**Sliding-window rate limiter.** Built from scratch with a plain object and `Date.now()`. 10 requests per IP per 60-second window. Demonstrates that most common middleware concerns don't require a library.

**Cost estimation in the logger.** Every request logs an estimated input/output token count and inferred cost (`$0.20/M` input, `$0.80/M` output). The estimate uses a simple `characters / 4` heuristic. This is intentionally rough — the point is that cost observability should be present from day one, even in a prototype.

**Streaming cache replay.** When a streaming request hits the cache, the cached string is re-emitted token by token with a small delay. From the client's perspective, the response is still streamed — no change in interface, just a much faster and cheaper response.

## Endpoints

### `POST /ask`

Returns a complete answer in a single JSON response.

**Request**

```json
{ "question": "What is the capital of France?" }
```

**Response**

```json
{
  "answer": "The capital of France is Paris.",
  "cached": false
}
```

---

### `POST /ask/stream`

Streams the answer as plain text using chunked transfer encoding.

**Request**

```json
{ "question": "Explain recursion in simple terms." }
```

**Response** — `Content-Type: text/plain`, `Transfer-Encoding: chunked`

Tokens arrive progressively as they are generated by the model.

## Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Add your OpenAI API key to .env

# Start the server
node src/server.js
```

The server starts on port `3000`.

---

## Related Projects

This project is part of a series on AI Engineering. Each project explores a specific pattern or concern when building systems on top of LLMs.

| #   | Project                                                                | Description                                                                                  |
| --- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 01  | [LLM API](https://github.com/duroteus/basic-llm-api-example)           | Minimal LLM-powered REST API with in-memory cache, rate limiting, and cost tracking          |
| 02  | [JSON Parser](https://github.com/duroteus/basic-llm-json-parser)       | Structured data extraction from free text using prompt engineering and Zod validation        |
| 03  | [Semantic Search API](https://github.com/duroteus/semantic-search-api) | Full RAG pipeline with pgvector retrieval, context reconstruction, and LLM answer generation |
| 04  | [AI Data Agent](https://github.com/duroteus/ai-data-agent)             | Agentic loop with tool use, SQL execution, Redis memory, and chart generation                |

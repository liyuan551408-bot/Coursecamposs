# AI Pipeline Hardening Implementation Plan

**Goal:** Make CourseCompass retrieval and generation consistent, grounded, and independently testable.

**Architecture:** A shared course embedding formatter feeds SiliconFlow for both batch and lifecycle updates. Retrieval and Zhipu chat calls move behind services, while controllers validate inputs and compose responses. Review summaries pass ratings and comments as explicit evidence.

**Tech Stack:** Node.js, Express, Prisma, PostgreSQL/pgvector, SiliconFlow embeddings, Zhipu chat completions.

### Tasks

1. Update the shared course embedding text and batch generator so `--force` controls full rebuilds and non-force mode processes only missing vectors.
2. Add `courseRetrievalService.js` and `llmService.js`; move duplicate SQL and chat request logic behind them with timeouts and configuration validation.
3. Update AI controllers to use the services, include credits, avoid embedding previews, and pass structured review ratings plus comments to the LLM with grounding rules.
4. Update `.env.example` and README to document placeholders and the pipeline behavior.
5. Run syntax, Prisma, contract, and diff checks; report any external credential or database blockers.

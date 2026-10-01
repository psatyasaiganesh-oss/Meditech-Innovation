# MediTech Innovation

Healthcare website with a conversational Gemini health information assistant. The assistant replaces the former JSON symptom matcher. The original medical.json is retained as sample data and is not used as an authoritative medical source.

## Run locally

Requires Node.js 22 or newer; no dependencies need installing.

1. Copy `.env.example` to `.env`.
2. Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/apikey), then set `GEMINI_API_KEY` in `.env`. Do not commit the key or put it in browser code.
3. Set `GEMINI_MODEL` to a model available to your account. The default follows the [Gemini generateContent documentation](https://ai.google.dev/api/generate-content).
4. Run `npm start` and open http://localhost:3000.
5. In the AI Assistant section, consent to sending the conversation to Gemini and enter a health question. Follow-up questions use the last five exchanges. Clear conversation removes the tab's history and resets consent.

Without a key the page works, but the assistant clearly reports that it is not configured. It does not simulate AI answers.

## Hosting

Run `npm start` on a Node-capable host with `GEMINI_API_KEY`, `GEMINI_MODEL` and `PORT` configured through the host's secret/environment settings. Serve the page and `/api/assistant` from the same origin using HTTPS. GitHub Pages alone cannot run this server. This change does not deploy the website.

The backend allows only explicit public assets, validates and limits input, times out provider calls, and applies a basic in-memory IP limit (12 requests per minute). It does not write conversations to disk. Messages and recent conversation are sent to Google; the provider's data handling policies still apply. There is no persistent chat storage in the browser.

The existing Firebase login is separate from the AI endpoint. The endpoint does not require login. For a broadly exposed deployment, add verified user authentication, shared rate limits and spend controls. A reverse proxy may group users under one IP; configure an appropriate trusted-proxy limiter before scaling.

## Health information boundaries

The assistant is prompted to explain uncertainty, ask clarifying questions, avoid diagnoses, prescriptions and medication dosing, and direct emergency situations to local emergency services. These prompts do not guarantee medical accuracy or clinically validated triage. The UI states these limitations and asks users not to include identifying information.

The previous disconnected Gemini code contained an API-key-looking string. It has been removed from the current code; revoke/rotate it if it was a real key, since previous commits remain accessible.

## Validation

Run `npm test`. Tests cover request validation, follow-up mapping, private-file access, unconfigured behavior, mocked provider success, quota/network/blocked/truncated responses, and rate limiting. Tests do not call the real Gemini API; a configured key and provider access are needed for live validation.

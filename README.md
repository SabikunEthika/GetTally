# GetTally

A chat-native, voice-first order and earnings tracker for informal online sellers — built so sellers can log orders and see their business performance without leaving the messaging apps they already use.

## The Problem

Small online sellers in Bangladesh mostly sell through Facebook Page Messenger, mixing buyer questions and real orders in the same chat thread. They track sales manually (notebooks, memory) and have no easy way to see monthly earnings, returns, or what's actually selling.

## The Idea

GetTally captures orders three ways — all funneling into one confirmation step before anything is saved:

1. **Buyer confirms in chat** — AI detects when a chat turns into a real order and asks the buyer to confirm via a button
2. **Seller reviews chat** — GetTally highlights what looks like an order; seller taps to confirm or edit
3. **Seller logs by voice** — for phone/in-person sales, the seller just speaks the order out loud

On top of order logging, GetTally turns that data into a business dashboard: monthly/yearly sales, earnings, returns, and profit.

## Project Structure

\```
gettally/
├── frontend/     # Next.js app — the seller-facing dashboard
├── backend/      # NestJS/Express API — order logic, AI calls, database
├── docs/         # Planning docs, architecture notes, pitch materials
└── README.md     # You are here
\```

## Tech Stack

Next.js · TypeScript · NestJS · PostgreSQL · Whisper API (voice) · OpenAI/Claude API (order parsing) · Meta Messenger Platform API

## Team

- Sabikun Alam
- Md.Mushfiqur Rahman

## Run the demo locally

1. Create `backend/.env` from `backend/.env.example`, set `DATABASE_URL` and `GEMINI_API_KEY`, then configure the Whisper/FFmpeg paths if you want voice input.
2. From `backend`, run `npm install`, `npx prisma db push`, `npm run seed`, and `npm run start:dev`. The seed command creates the demo seller used by the local dashboard (ID `2`).
3. Create `frontend/.env.local` from `frontend/.env.local.example`, run `npm install`, then `npm run dev`.
4. Open `http://localhost:3000`. The default demo seller is ID `2`; change `NEXT_PUBLIC_SELLER_ID` if your database uses another seller.

If VS Code still underlines `costPrice` after pulling the project, run `npx prisma generate` from `backend`, then use **TypeScript: Restart TS Server** in the Command Palette. Prisma’s generated client is intentionally not committed to Git, and the `postinstall` script regenerates it automatically after a fresh install.

## Current prototype capabilities

- Voice upload → local Whisper transcription → Gemini extraction → editable confirmation.
- Pasted Messenger chat → intent classification (`inquiry`, `order_intent`, `order_confirmed`, `other`) → editable confirmation. Inquiries are not presented as confirmed orders.
- Transactional order saving with product upsert behavior, optional product cost, and a review-before-save boundary.
- Dashboard reporting for revenue, delivered/returned/cancelled orders, return rate, top product, monthly sales, and profit when costs are known.
- Order status updates and required return reasons from the dashboard.
- Gmail-only registration with Bangladesh mobile validation, signed sessions, protected order APIs, profile setup, and logout.
- Personal-growth goal tracking and a sell-tracker pipeline on the dashboard.
- Gemini extraction starts with `gemini-3.6-flash` and retries `gemini-3.7-flash`/`gemini-3.5-flash` when a model is retired or temporarily overloaded.

## Strong next ideas for approval

These are intentionally not added yet because they affect product scope or require a design decision:

1. **Low-confidence queue** — keep drafts with missing fields in an “needs attention” inbox instead of showing only a toast.
2. **Bangla/Banglish reply templates** — generate a copy button for delivery confirmation, payment instructions, and return follow-ups.
3. **Stock alerts** — add a stock quantity to products and warn when a confirmed order would cross a seller-defined threshold.
4. **CSV export and backup** — let a seller download orders and monthly reports before a competition demo.
5. **Seller accounts** — replace the demo seller ID with simple email/phone sign-in and per-seller access control.
6. **Conversation history** — save the pasted chat and extracted intent as messages so a seller can audit why an order was suggested.

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

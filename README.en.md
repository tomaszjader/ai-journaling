# Reflect Bot AI — Documentation (EN)

This project is a web application for journaling and chatting with an AI assistant. The frontend is built with Vite, React, and TypeScript, with a UI layer based on Tailwind CSS and shadcn-ui components. Data and server-side functions are handled by Supabase (migrations, edge functions).

## Technologies

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (database, edge functions)

## Requirements

- Node.js (18+ recommended)
- npm
- A Supabase account and (optionally) the Supabase CLI if you are using migrations and edge functions.

## Quick Start (Locally)

1. Install dependencies: `npm i`
2. Copy the `.env.example` file to `.env` and fill in the values:
   - `VITE_SUPABASE_URL` — your Supabase project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` — your Supabase public key (anon key)
3. Run the application: `npm run dev`
4. Open the preview in your browser (by default `http://localhost:5173`).

## Building and Production Preview

- Build: `npm run build`
- Preview the built application: `npm run preview`

## Supabase Configuration (Optional)

If you are using a local database or deploying edge functions:

- Link the repo to your project: `supabase link --project-ref <your-project-ref>`
- Apply migrations from the `supabase/migrations` folder: `supabase db push`
- Run the chat function locally: `supabase functions serve`
- Deploy the chat function: `supabase functions deploy chat`

Note: Edge functions may require setting additional secrets (e.g., the AI model name). Configure them according to the requirements of your function's environment/model (`supabase functions secrets set ...`).

## How the Chat Works

- The frontend calls the Supabase function endpoint: `POST <VITE_SUPABASE_URL>/functions/v1/chat` and receives a stream of responses (SSE).
- Conversation data and journal entries are saved in the `conversation_messages` and `journal_entries` tables (migrations are in the repository).

## Troubleshooting

- No database connection: check `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env`.
- Problems with edge functions: make sure the required secrets are set via the Supabase CLI.
- Incorrect migrations: run `supabase db push` or check the connection to your project.

## Code Editing

You can work in any IDE. The standard workflow is:

```sh
git clone <URL_of_Your_Repository>
cd <project_name>
npm i
npm run dev
```

All frontend changes are hot-reloaded while working with `npm run dev`.
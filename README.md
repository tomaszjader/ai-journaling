# Welcome to your Lovable project

This project is a chatbot that uses the Lovable API to generate responses.

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/e9ddc43c-fe14-4444-82d3-c6b30815df85) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/e9ddc43c-fe14-4444-82d3-c6b30815df85) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Konfiguracja modelu AI przez zmienne środowiskowe

Funkcja edge `supabase/functions/chat` korzysta z bramki Lovable AI i pozwala wybrać model przez zmienną środowiskową.

- Wymagane sekrety funkcji:
  - `LOVABLE_API_KEY` — klucz do Lovable AI Gateway
  - `AI_MODEL` — nazwa modelu (np. `google/gemini-2.5-flash`, `openai/gpt-4o-mini`, `anthropic/claude-3-5-sonnet`)

### Ustawianie sekretów (Supabase CLI)

```sh
# Ustaw klucz gateway i wybrany model
supabase functions secrets set LOVABLE_API_KEY="<twój_klucz>" AI_MODEL="google/gemini-2.5-flash"

# Uruchom funkcje lokalnie (opcjonalnie)
supabase functions serve
```

Jeśli `AI_MODEL` nie zostanie ustawiony, domyślnie użyty będzie `google/gemini-2.5-flash`.

Zmiana modelu nie wymaga modyfikacji frontendu — wystarczy podmienić wartość `AI_MODEL` i ponownie uruchomić funkcję.

## Szybki start (lokalnie)

- Wymagania: `Node.js`, `npm`, `Supabase CLI` (opcjonalnie do funkcji/migracji)
- Kroki:
  - `npm i`
  - Skopiuj `/.env.example` do `/.env` i uzupełnij:
    - `VITE_SUPABASE_URL` — url projektu Supabase
    - `VITE_SUPABASE_PUBLISHABLE_KEY` — anon/public key
  - Uruchom: `npm run dev`

## Konfiguracja Supabase

- Połącz repo z projektem Supabase:
  - `supabase link --project-ref <twoj-project-ref>`
- Zastosuj migracje z folderu `supabase/migrations`:
  - `supabase db push`
- Uruchom funkcję czatu lokalnie (opcjonalnie):
  - Ustaw sekrety: `supabase functions secrets set LOVABLE_API_KEY="<klucz>" AI_MODEL="google/gemini-2.5-flash"`
  - `supabase functions serve`
- Deploy funkcji czatu:
  - `supabase functions deploy chat`

## Zmienne środowiskowe

- Frontend (Vite):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - `VITE_SUPABASE_PROJECT_ID` (opcjonalnie)
- Edge Functions (ustawiane przez Supabase CLI):
  - `LOVABLE_API_KEY`
  - `AI_MODEL`

## Jak działa czat

- Frontend wywołuje `VITE_SUPABASE_URL/functions/v1/chat` i streamuje odpowiedź (SSE).
- Funkcja `chat` wysyła żądania do Lovable AI Gateway z konfigurowalnym `model`.
- Wiadomości rozmowy i wpisy dziennika zapisują się w tabelach `conversation_messages` oraz `journal_entries` (migracje już są w repo).

## Rozwiązywanie problemów

- Brak odpowiedzi czatu: sprawdź sekrety funkcji (`LOVABLE_API_KEY`, `AI_MODEL`).
- Błędy 429/402: limit lub brak środków po stronie bramki — komunikaty są zwracane wprost do UI.
- Błąd połączenia z bazą: upewnij się, że `VITE_SUPABASE_URL` i `VITE_SUPABASE_PUBLISHABLE_KEY` są poprawne.

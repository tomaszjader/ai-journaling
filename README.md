# AI Journaling — dokumentacja (PL)

Projekt to aplikacja webowa do prowadzenia dziennika i rozmowy z asystentem AI. Frontend jest zbudowany w oparciu o Vite, React i TypeScript, z warstwą UI opartą o Tailwind CSS oraz komponenty shadcn-ui. Dane i funkcje serwerowe są obsługiwane przez Supabase (migracje, funkcje edge).

## Technologie

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (baza danych, funkcje edge)

## Wymagania

- Node.js (zalecane 18+)
- npm
- Konto Supabase i (opcjonalnie) Supabase CLI, jeśli korzystasz z migracji i funkcji edge

## Szybki start (lokalnie)

1. Zainstaluj zależności: `npm i`
2. Skopiuj plik `.env.example` do `.env` i uzupełnij wartości:
   - `VITE_SUPABASE_URL` — adres projektu Supabase
   - `VITE_SUPABASE_PUBLISHABLE_KEY` — publiczny klucz (anon key) Supabase
3. Uruchom aplikację: `npm run dev`
4. Otwórz podgląd w przeglądarce (domyślnie `http://localhost:5173`).

## Budowanie i podgląd produkcyjny

- Budowa: `npm run build`
- Podgląd zbudowanej aplikacji: `npm run preview`

## Konfiguracja Supabase (opcjonalnie)

Jeśli korzystasz z lokalnej bazy lub wdrażasz funkcje edge:

- Połącz repo z projektem: `supabase link --project-ref <twoj-project-ref>`
- Zastosuj migracje z folderu `supabase/migrations`: `supabase db push`
- Uruchom funkcję czatu lokalnie: `supabase functions serve`
- Wdrażanie funkcji czatu: `supabase functions deploy chat`

Uwaga: funkcje edge mogą wymagać ustawienia dodatkowych sekretów (np. nazwy modelu AI). Skonfiguruj je zgodnie z wymogami używanej bramki/modelu w swoim środowisku funkcji (`supabase functions secrets set ...`).

## Jak działa czat

- Frontend wywołuje endpoint funkcji Supabase: `POST <VITE_SUPABASE_URL>/functions/v1/chat` i odbiera strumień odpowiedzi (SSE).
- Dane rozmowy i wpisy dziennika są zapisywane w tabelach `conversation_messages` oraz `journal_entries` (migracje znajdują się w repozytorium).

## Rozwiązywanie problemów

- Brak połączenia z bazą: sprawdź `VITE_SUPABASE_URL` i `VITE_SUPABASE_PUBLISHABLE_KEY` w `.env`.
- Problemy z funkcjami edge: upewnij się, że wymagane sekrety są ustawione przez Supabase CLI.
- Błędne migracje: uruchom `supabase db push` lub sprawdź poprawność połączenia z projektem.

## Edycja kodu

Możesz pracować w dowolnym IDE. Standardowy przepływ:

```sh
git clone <URL_Twojego_Repozytorium>
cd <nazwa_projektu>
npm i
npm run dev
```

Wszystkie zmiany w frontendzie są odświeżane na żywo podczas pracy z `npm run dev`.

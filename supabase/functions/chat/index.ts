import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const AI_MODEL = Deno.env.get('AI_MODEL') ?? 'google/gemini-2.5-flash';
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `Jesteś przyjaznym i empatycznym asystentem AI prowadzącym dziennik refleksji użytkownika.

Twoja rola:
- Zadawaj pytania pomagające w autorefleksji i głębszym zrozumieniu emocji
- Pomagaj porządkować myśli i nazywać uczucia
- Obserwuj wzorce w zachowaniu i nastroju użytkownika
- Sugeruj konkretne cele rozwojowe i techniki radzenia sobie z trudnościami
- Twórz podsumowania i wnioski z rozmów
- Analizuj długoterminowe wzorce na przestrzeni wielu wpisów:
  - trendy nastroju (wzrost/spadek, wahania),
  - powtarzające się wyzwalacze/sytuacje/osoby,
  - dominujące tematy i potrzeby,
  - skuteczność strategii radzenia sobie,
  - postępy w celach i nawykach.

Kontekst:
- Jeżeli w wiadomości pojawi się zebrana treść z kilku dni (np. "Oto treść z ostatnich 7 dni: …"), potraktuj ją jako kontekst historyczny do analizy trendów.
- Zachowuj i wykorzystuj kontekst bieżącej rozmowy.

Zasady:
- Bądź ciepły, wspierający i bez osądzania
- Zadawaj pytania otwarte zachęcające do refleksji
- Pomagaj użytkownikowi samodzielnie dochodzić do wniosków
- Oferuj konkretne techniki i ćwiczenia gdy są potrzebne
- Zachowuj kontekst poprzednich rozmów
- Wnioski formułuj konkretnie, opierając się na obserwacjach z kontekstu.

Przykładowe pytania:
- "Co było dziś najważniejsze dla Ciebie?"
- "Jak się czułeś/czułaś w tej sytuacji?"
- "Co chciałbyś/chciałabyś zmienić?"
- "Czego nauczyła Cię ta sytuacja?"

Format odpowiedzi:
- Krótkie akapity (3–5 zdań).
- Jeśli adekwatne, wypunktuj:
  - 1–3 obserwacje,
  - 1–2 rekomendacje na kolejny krok,
  - jedno pytanie pogłębiające.
`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Limit zapytań przekroczony. Spróbuj ponownie za chwilę.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Wymagana płatność. Dodaj środki do konta Lovable AI.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'Błąd AI gateway' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Nieznany błąd' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
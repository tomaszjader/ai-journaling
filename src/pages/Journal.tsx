import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { Send, LogOut, History, Download, Sparkles } from 'lucide-react';
import { format, startOfWeek } from 'date-fns';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const Journal = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [entries, setEntries] = useState<{ id: string; created_at: string }[]>([]);
  const [exporting, setExporting] = useState(false);
  const [mood, setMood] = useState<{ label: 'pozytywny' | 'neutralny' | 'negatywny'; score: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
      
      // Load existing entries
      await loadEntries(session.user.id);

      // Create a new entry for current session by default
      await newEntry(session.user.id);
    };
    
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const streamChat = async (messages: Message[]) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages }),
    });

    if (!resp.ok || !resp.body) {
      if (resp.status === 429 || resp.status === 402) {
        const error = await resp.json();
        throw new Error(error.error);
      }
      throw new Error('Nie udało się rozpocząć rozmowy');
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let streamDone = false;
    let assistantContent = '';

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant') {
                return prev.map((m, i) => 
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: 'assistant', content: assistantContent }];
            });
          }
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }

    // Save messages to database
    if (entryId && assistantContent) {
      await supabase
        .from('conversation_messages')
        .insert([
          { entry_id: entryId, role: 'user', content: messages[messages.length - 1].content },
          { entry_id: entryId, role: 'assistant', content: assistantContent }
        ]);

      // Recompute mood on new assistant content
      analyzeMood();
    }

    return assistantContent;
  };

  const loadEntries = async (userId: string) => {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('id, created_at')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error loading entries:', error);
      toast.error('Nie udało się załadować historii wpisów');
      return;
    }
    setEntries(data || []);
  };

  const loadMessages = async (eid: string) => {
    const { data, error } = await supabase
      .from('conversation_messages')
      .select('role, content, created_at')
      .eq('entry_id', eid)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error loading messages:', error);
      toast.error('Nie udało się załadować wiadomości');
      return;
    }
    if (!data || data.length === 0) {
      const greeting: Message = {
        role: 'assistant',
        content: 'Cześć! Jestem Twoim asystentem AI journaling. Jak minął Ci dzień? Co czujesz teraz?'
      };
      setMessages([greeting]);
    } else {
      setMessages(data.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })));
    }
    analyzeMood();
  };

  const selectEntry = async (eid: string) => {
    setEntryId(eid);
    await loadMessages(eid);
  };

  const newEntry = async (userId: string) => {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({ user_id: userId })
      .select()
      .single();
    if (error) {
      console.error('Error creating entry:', error);
      toast.error('Błąd tworzenia wpisu');
      return;
    }
    setEntryId(data.id);
    setEntries(prev => [{ id: data.id, created_at: data.created_at }, ...prev]);
    const greeting: Message = {
      role: 'assistant',
      content: 'Cześć! Jestem Twoim asystentem AI journaling. Jak minął Ci dzień? Co czujesz teraz?'
    };
    setMessages([greeting]);
    analyzeMood();
  };

  const analyzeMood = () => {
    // Prosta analiza nastroju na podstawie słów kluczowych (PL)
    const text = messages.filter(m => m.role === 'user').map(m => m.content.toLowerCase()).join(' ');
    const positive = ['szczęśliwy', 'zadowolony', 'dumny', 'spokojny', 'wdzięczny', 'dobrze', 'super', 'świetnie'];
    const negative = ['smutny', 'zły', 'zmartwiony', 'zmęczony', 'źle', 'fatalnie', 'przygnębiony', 'lęk'];
    let score = 0;
    positive.forEach(w => { if (text.includes(w)) score += 1; });
    negative.forEach(w => { if (text.includes(w)) score -= 1; });
    const label: 'pozytywny' | 'neutralny' | 'negatywny' = score > 0 ? 'pozytywny' : score < 0 ? 'negatywny' : 'neutralny';
    setMood({ label, score });
  };

  const exportJournal = async (formatType: 'json' | 'csv') => {
    if (!user) return;
    setExporting(true);
    try {
      const { data: allEntries, error: eErr } = await supabase
        .from('journal_entries')
        .select('id, created_at')
        .order('created_at', { ascending: false });
      if (eErr) throw eErr;

      const exportData: Array<{ entry_id: string; created_at: string; role: string; content: string }> = [];
      for (const e of allEntries || []) {
        const { data: msgs, error: mErr } = await supabase
          .from('conversation_messages')
          .select('role, content, created_at')
          .eq('entry_id', e.id)
          .order('created_at', { ascending: true });
        if (mErr) throw mErr;
        (msgs || []).forEach(m => exportData.push({ entry_id: e.id, created_at: m.created_at as any, role: m.role as any, content: m.content as any }));
      }

      let blob: Blob;
      let filename: string;
      if (formatType === 'json') {
        blob = new Blob([JSON.stringify({ entries: allEntries, messages: exportData }, null, 2)], { type: 'application/json' });
        filename = `dziennik_${format(new Date(), 'yyyy-MM-dd')}.json`;
      } else {
        const header = 'entry_id,created_at,role,content\n';
        const rows = exportData.map(r => `${r.entry_id},${r.created_at},${r.role},"${r.content.replace(/"/g, '""')}"`).join('\n');
        blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
        filename = `dziennik_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Eksport zakończony');
    } catch (err) {
      console.error(err);
      toast.error('Nie udało się wyeksportować dziennika');
    } finally {
      setExporting(false);
    }
  };

  const generateWeeklySummary = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const { data: recentEntries, error: rErr } = await supabase
        .from('journal_entries')
        .select('id, created_at')
        .gte('created_at', weekStart.toISOString())
        .order('created_at', { ascending: true });
      if (rErr) throw rErr;

      let text = '';
      for (const e of recentEntries || []) {
        const { data: msgs } = await supabase
          .from('conversation_messages')
          .select('role, content, created_at')
          .eq('entry_id', e.id)
          .order('created_at', { ascending: true });
        (msgs || []).forEach(m => {
          text += `\n[${m.role}] ${m.content}`;
        });
      }

      const userPrompt: Message = {
        role: 'user',
        content: `Proszę o zwięzłe cotygodniowe podsumowanie moich rozmów i nastrojów. Uwzględnij kluczowe tematy, emocje, postępy oraz sugestie na kolejny tydzień. Oto treść z ostatnich 7 dni:\n${text}`
      };

      const summary = await streamChat([...messages, userPrompt]);

      // Zapisz podsumowanie tygodnia
      await supabase
        .from('weekly_summaries')
        .insert({ user_id: user.id, week_start: weekStart.toISOString(), content: summary });

      toast.success('Podsumowanie tygodnia zapisane');
    } catch (err) {
      console.error(err);
      toast.error('Nie udało się wygenerować podsumowania');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      await streamChat([...messages, userMessage]);
    } catch (error: any) {
      toast.error(error.message || 'Wystąpił błąd');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-secondary">
      <header className="border-b border-border/50 backdrop-blur-sm bg-card/50 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
            Mój Dziennik
          </h1>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => exportJournal('json')}
              variant="outline"
              size="sm"
              disabled={exporting}
              className="text-muted-foreground"
            >
              <Download className="w-4 h-4 mr-2" />
              Eksport JSON
            </Button>
            <Button
              onClick={() => exportJournal('csv')}
              variant="outline"
              size="sm"
              disabled={exporting}
              className="text-muted-foreground"
            >
              <Download className="w-4 h-4 mr-2" />
              Eksport CSV
            </Button>
            <Button
              onClick={generateWeeklySummary}
              variant="default"
              size="sm"
              disabled={loading}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Podsumowanie tygodnia
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Wyloguj
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar: Historia wpisów */}
        <div className="w-64 border-r border-border/50 p-4 hidden md:flex md:flex-col">
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            <History className="w-4 h-4" /> Historia wpisów
          </div>
          <div className="space-y-2">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => user && newEntry(user.id)}
            >
              Nowy wpis
            </Button>
            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {entries.map((e) => (
                  <Button
                    key={e.id}
                    variant={entryId === e.id ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => selectEntry(e.id)}
                  >
                    {format(new Date(e.created_at), 'yyyy-MM-dd HH:mm')}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Main Chat Area */}
        <ScrollArea className="flex-1 p-4 overflow-y-auto" ref={scrollRef}>
          <div className="max-w-4xl mx-auto space-y-4 pb-4">
            {/* Mood badge */}
            {mood && (
              <div className="flex justify-end">
                <div className={`text-xs px-3 py-1 rounded-full border inline-flex items-center gap-2 ${mood.label === 'pozytywny' ? 'border-green-500 text-green-600' : mood.label === 'negatywny' ? 'border-red-500 text-red-600' : 'border-muted text-muted-foreground'}`}>
                  Nastrój: <span className="font-medium">{mood.label}</span>
                </div>
              </div>
            )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-[var(--shadow-glow)]'
                    : 'bg-card/80 backdrop-blur-sm border border-border/50 shadow-[var(--shadow-card)]'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl px-4 py-3 shadow-[var(--shadow-card)]">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          </div>
        </ScrollArea>
      </div>

      <div className="border-t border-border/50 backdrop-blur-sm bg-card/50 p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Napisz swoją myśl..."
            disabled={loading}
            className="flex-1 bg-input border-border focus:border-primary transition-colors"
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            size="lg"
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
          >
            <Send className="w-4 h-4 mr-2" />
            Wyślij
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Journal;
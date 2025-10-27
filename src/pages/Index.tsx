import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Brain, TrendingUp, Heart } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl sm:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
            AI Journaling
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Prowadź dziennik wspomagany przez sztuczną inteligencję. Rozwijaj się, analizuj wzorce i osiągaj cele rozwojowe.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              onClick={() => navigate('/auth')}
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-lg px-8 py-6 shadow-[var(--shadow-glow)]"
            >
              Rozpocznij teraz
            </Button>
            <Button
              onClick={() => navigate('/auth')}
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-border/50 hover:border-primary transition-colors"
            >
              Zaloguj się
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            {
              icon: Brain,
              title: 'Autorefleksja',
              description: 'AI zadaje pytania pomagające w głębszej refleksji nad dniem',
            },
            {
              icon: Heart,
              title: 'Emocje',
              description: 'Porządkuj myśli i nazywaj uczucia z pomocą AI',
            },
            {
              icon: TrendingUp,
              title: 'Wzorce',
              description: 'Analizuj wzorce zachowań i nastroju w czasie',
            },
            {
              icon: BookOpen,
              title: 'Rozwój',
              description: 'Otrzymuj cele, afirmacje i ćwiczenia rozwojowe',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-glow)] transition-all duration-300"
            >
              <feature.icon className="w-12 h-12 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-3xl p-8 sm:p-12 border border-primary/20">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center">
            Jak to działa?
          </h2>
          <div className="space-y-6 max-w-2xl mx-auto">
            {[
              'Pisz codziennie - AI będzie Cię wspierać pytaniami i refleksjami',
              'Nazywaj emocje - otrzymaj pomoc w zrozumieniu swoich uczuć',
              'Odkrywaj wzorce - AI analizuje Twoje zachowania i nastrój',
              'Rozwijaj się - otrzymuj spersonalizowane cele i ćwiczenia',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center font-bold">
                  {i + 1}
                </div>
                <p className="text-lg pt-1">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

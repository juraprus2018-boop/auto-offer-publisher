import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Zap, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/deals?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16 md:py-24">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="container relative">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6 animate-fade-in">
            <Zap className="h-4 w-4" />
            Dagelijks bijgewerkte deals
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 animate-slide-up">
            Vind de beste{' '}
            <span className="text-primary">kortingen</span>{' '}
            van Nederland
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '100ms' }}>
            Ontdek duizenden deals van top webshops. Bespaar tot wel 80% op elektronica, mode, huis & tuin en meer.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-lg mx-auto animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Wat zoek je?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-32 text-lg rounded-full border-2 border-border focus-visible:border-primary focus-visible:ring-0 bg-background"
              />
              <Button
                type="submit"
                size="lg"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-6"
              >
                Zoeken
              </Button>
            </div>
          </form>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-12 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">1000+ Deals</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <span className="text-sm text-muted-foreground">Tot 80% korting</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" />
              <span className="text-sm text-muted-foreground">Dagelijks bijgewerkt</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

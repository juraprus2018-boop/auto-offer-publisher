import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Clock, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Suggestion {
  type: 'product' | 'brand' | 'category';
  text: string;
  slug?: string;
  discount?: number;
}

interface SearchAutocompleteProps {
  className?: string;
  placeholder?: string;
  onClose?: () => void;
}

const POPULAR_SEARCHES = [
  'Nike',
  'Adidas',
  'Samsung',
  'Apple',
  'Sony',
];

export function SearchAutocomplete({ className, placeholder = "Waar ben je naar op zoek?", onClose }: SearchAutocompleteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions when query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch matching products
        const { data: products } = await supabase
          .from('products')
          .select('seo_title, slug, discount_percentage, brand')
          .eq('is_active', true)
          .is('parent_product_id', null)
          .or(`seo_title.ilike.%${query}%,brand.ilike.%${query}%`)
          .order('discount_percentage', { ascending: false })
          .limit(8);

        // Fetch matching categories
        const { data: categories } = await supabase
          .from('categories')
          .select('name, slug')
          .ilike('name', `%${query}%`)
          .limit(3);

        const newSuggestions: Suggestion[] = [];

        // Add category suggestions
        categories?.forEach((cat) => {
          newSuggestions.push({
            type: 'category',
            text: cat.name,
            slug: cat.slug,
          });
        });

        // Add unique brand suggestions
        const brands = new Set<string>();
        products?.forEach((p) => {
          if (p.brand && p.brand.toLowerCase().includes(query.toLowerCase()) && !brands.has(p.brand)) {
            brands.add(p.brand);
            if (brands.size <= 3) {
              newSuggestions.push({
                type: 'brand',
                text: p.brand,
              });
            }
          }
        });

        // Add product suggestions
        products?.slice(0, 5).forEach((p) => {
          newSuggestions.push({
            type: 'product',
            text: p.seo_title,
            slug: p.slug,
            discount: p.discount_percentage || undefined,
          });
        });

        setSuggestions(newSuggestions);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(debounce);
  }, [query]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      navigate(`/deals?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsOpen(false);
      setQuery('');
      onClose?.();
    }
  };

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    if (suggestion.type === 'product' && suggestion.slug) {
      navigate(`/deal/${suggestion.slug}`);
    } else if (suggestion.type === 'category' && suggestion.slug) {
      navigate(`/categorie/${suggestion.slug}`);
    } else {
      handleSearch(suggestion.text);
    }
    setIsOpen(false);
    setQuery('');
    onClose?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = query.trim().length < 2 ? POPULAR_SEARCHES : suggestions;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          if (query.trim().length < 2) {
            handleSearch(POPULAR_SEARCHES[selectedIndex]);
          } else {
            handleSelectSuggestion(suggestions[selectedIndex]);
          }
        } else {
          handleSearch(query);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const showPopular = query.trim().length < 2;
  const hasContent = showPopular || suggestions.length > 0;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full pl-11 pr-4 h-11 bg-secondary border-0 rounded-full focus-visible:ring-primary font-medium"
          autoComplete="off"
        />
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && hasContent && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
          {showPopular ? (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5" />
                Populaire zoekopdrachten
              </div>
              {POPULAR_SEARCHES.map((term, index) => (
                <button
                  key={term}
                  onClick={() => handleSearch(term)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-left",
                    selectedIndex === index 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-secondary text-foreground"
                  )}
                >
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  {term}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-2">
              {isLoading ? (
                <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                  Zoeken...
                </div>
              ) : suggestions.length === 0 ? (
                <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                  Geen resultaten voor "{query}"
                </div>
              ) : (
                suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}-${suggestion.text}-${index}`}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors text-left",
                      selectedIndex === index 
                        ? "bg-primary/10 text-primary" 
                        : "hover:bg-secondary text-foreground"
                    )}
                  >
                    {suggestion.type === 'category' ? (
                      <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : suggestion.type === 'brand' ? (
                      <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="flex-1 truncate font-medium">{suggestion.text}</span>
                    {suggestion.type === 'category' && (
                      <span className="text-xs text-muted-foreground">Categorie</span>
                    )}
                    {suggestion.type === 'brand' && (
                      <span className="text-xs text-muted-foreground">Merk</span>
                    )}
                    {suggestion.discount && suggestion.discount > 0 && (
                      <span className="text-xs font-bold text-success">-{suggestion.discount}%</span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}

          {/* Search button */}
          {query.trim().length >= 2 && (
            <div className="border-t border-border p-2">
              <button
                onClick={() => handleSearch(query)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors"
              >
                <Search className="h-4 w-4" />
                Zoek naar "{query}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

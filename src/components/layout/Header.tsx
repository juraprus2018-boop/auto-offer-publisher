import { useState, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Percent, User, LogOut, Check, Tag, LucideProps } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/hooks/useAuth';

// Dynamic icon component for category icons
interface DynamicIconProps extends Omit<LucideProps, 'ref'> {
  name: string;
}

function DynamicIcon({ name, ...props }: DynamicIconProps) {
  // Convert PascalCase to kebab-case for lucide dynamic imports
  const kebabName = name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase() as keyof typeof dynamicIconImports;

  if (!dynamicIconImports[kebabName]) {
    return <Tag {...props} />;
  }

  const LucideIcon = lazy(dynamicIconImports[kebabName]);

  return (
    <Suspense fallback={<Tag {...props} />}>
      <LucideIcon {...props} />
    </Suspense>
  );
}

export function Header() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: categories } = useCategories();
  const { user, isAdmin, signOut } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/deals?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top banner - iBood style */}
      <div className="bg-header text-header-foreground">
        <div className="container py-2">
          <div className="flex items-center justify-center gap-6 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-success" />
              Dagelijks de beste deals
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-success" />
              Elke dag nieuwe aanbiedingen
            </span>
            <span className="hidden md:flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-success" />
              Bespaar tot 70%
            </span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-card border-b border-border">
        <div className="container flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Percent className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-extrabold text-foreground">
              Korting<span className="text-primary">Deal</span>.nl
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Waar ben je naar op zoek?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 h-11 bg-secondary border-0 rounded-full focus-visible:ring-primary font-medium"
              />
            </div>
          </form>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link to="/deals">
              <Button variant="ghost" className="font-semibold">
                Alle Deals
              </Button>
            </Link>
            <Link to="/categorien">
              <Button variant="ghost" className="font-semibold">
                Categorieën
              </Button>
            </Link>
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" className="font-semibold">
                  Admin
                </Button>
              </Link>
            )}
            {user ? (
              <Button variant="outline" size="sm" onClick={() => signOut()} className="ml-2 gap-2 rounded-full">
                <LogOut className="h-4 w-4" />
                Uitloggen
              </Button>
            ) : (
              <Link to="/auth">
                <Button variant="default" size="sm" className="ml-2 gap-2 rounded-full font-semibold">
                  <User className="h-4 w-4" />
                  Inloggen
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col gap-6 mt-6">
                {/* Mobile Search */}
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Zoek naar deals..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 rounded-full"
                    />
                  </div>
                </form>

                {/* Mobile Navigation */}
                <nav className="flex flex-col gap-4">
                  <Link
                    to="/deals"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg font-bold hover:text-primary transition-colors"
                  >
                    Alle Deals
                  </Link>
                  <Link
                    to="/categorien"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg font-bold hover:text-primary transition-colors"
                  >
                    Categorieën
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-bold hover:text-primary transition-colors"
                    >
                      Admin
                    </Link>
                  )}
                </nav>

                {/* Categories */}
                {categories && categories.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wide">Categorieën</h3>
                    <div className="flex flex-col gap-1 max-h-[40vh] overflow-y-auto pr-2">
                      {categories.map((category) => (
                        <Link
                          key={category.id}
                          to={`/categorie/${category.slug}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 text-sm font-medium hover:text-primary transition-colors py-2 px-2 rounded-lg hover:bg-secondary"
                        >
                          <DynamicIcon name={category.icon || 'Tag'} className="h-4 w-4 text-muted-foreground" />
                          {category.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Auth */}
                <div className="pt-4 border-t border-border">
                  {user ? (
                    <Button variant="outline" className="w-full gap-2" onClick={() => signOut()}>
                      <LogOut className="h-4 w-4" />
                      Uitloggen
                    </Button>
                  ) : (
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full gap-2">
                        <User className="h-4 w-4" />
                        Inloggen
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

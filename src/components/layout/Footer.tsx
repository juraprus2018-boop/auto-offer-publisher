import { Link } from 'react-router-dom';
import { Tag } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';

export function Footer() {
  const { data: categories } = useCategories();

  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Tag className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">
                Korting<span className="text-primary">Deal</span>.nl
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              De beste deals en kortingen van Nederland. Bespaar op je favoriete producten.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Snelle Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/deals" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Alle Deals
                </Link>
              </li>
              <li>
                <Link to="/categorien" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Categorieën
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold mb-4">Populaire Categorieën</h3>
            <ul className="space-y-2">
              {categories?.slice(0, 5).map((category) => (
                <li key={category.id}>
                  <Link
                    to={`/categorie/${category.slug}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-semibold mb-4">Informatie</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-muted-foreground">
                  Dagelijks bijgewerkt
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">
                  Beste deals van Nederland
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} KortingDeal.nl. Alle rechten voorbehouden.
          </p>
        </div>
      </div>
    </footer>
  );
}

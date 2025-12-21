import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useRecentProducts } from '@/hooks/useProducts';

export function RecentDealsSection() {
  const { data: products, isLoading } = useRecentProducts(8);

  return (
    <section className="py-12">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-accent/10">
              <Clock className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Nieuwste Deals</h2>
              <p className="text-sm text-muted-foreground">Vers toegevoegde aanbiedingen</p>
            </div>
          </div>
          <Button asChild variant="ghost" className="hidden sm:flex gap-2">
            <Link to="/deals">
              Bekijk alle
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <ProductGrid products={products || []} isLoading={isLoading} />

        <div className="mt-8 text-center sm:hidden">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/deals">
              Bekijk alle deals
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

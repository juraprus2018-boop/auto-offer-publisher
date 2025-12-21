import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductFilters } from '@/components/products/ProductFilters';
import { useInfiniteProducts } from '@/hooks/useInfiniteProducts';
import type { ProductFilters as ProductFiltersType } from '@/types/database';

const Deals = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || undefined;
  
  const [filters, setFilters] = useState<ProductFiltersType>({
    search: initialSearch,
  });

  const { 
    data, 
    isLoading, 
    hasNextPage, 
    isFetchingNextPage, 
    fetchNextPage 
  } = useInfiniteProducts(filters);

  const allProducts = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.products);
  }, [data?.pages]);

  const totalCount = data?.pages?.[0]?.totalCount || 0;

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <div className="mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Alle Deals</h1>
          <p className="text-muted-foreground text-lg">
            Ontdek de beste kortingen en aanbiedingen
            {totalCount > 0 && (
              <span className="ml-2 text-foreground font-medium">
                ({totalCount.toLocaleString()} producten)
              </span>
            )}
          </p>
        </div>

        <div className="mb-8">
          <ProductFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        <ProductGrid
          products={allProducts}
          isLoading={isLoading}
          emptyMessage="Geen deals gevonden met deze filters"
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
        />
      </div>
    </Layout>
  );
};

export default Deals;


import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductFilters } from '@/components/products/ProductFilters';
import { useProducts } from '@/hooks/useProducts';
import type { ProductFilters as ProductFiltersType } from '@/types/database';

const Deals = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || undefined;
  
  const [filters, setFilters] = useState<ProductFiltersType>({
    search: initialSearch,
    page: 1,
    limit: 24,
  });

  const { data, isLoading } = useProducts(filters);

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Alle Deals</h1>
          <p className="text-muted-foreground">
            Ontdek de beste kortingen en aanbiedingen
          </p>
        </div>

        <div className="mb-6">
          <ProductFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        <ProductGrid
          products={data?.products || []}
          isLoading={isLoading}
          emptyMessage="Geen deals gevonden met deze filters"
        />
      </div>
    </Layout>
  );
};

export default Deals;

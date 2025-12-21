import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductFilters } from '@/components/products/ProductFilters';
import { useProducts } from '@/hooks/useProducts';
import { useCategory } from '@/hooks/useCategories';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProductFilters as ProductFiltersType } from '@/types/database';

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: category, isLoading: categoryLoading } = useCategory(slug || '');
  
  const [filters, setFilters] = useState<ProductFiltersType>({
    page: 1,
    limit: 24,
  });

  // Pass category.id to useProducts for proper filtering
  const { data, isLoading: productsLoading } = useProducts(filters, category?.id);

  if (categoryLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-6 w-96 mb-8" />
          <Skeleton className="h-12 w-full mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {category?.name || 'Categorie'}
          </h1>
          <p className="text-muted-foreground">
            {category?.description || `Bekijk alle deals in de categorie ${category?.name}`}
          </p>
        </div>

        <div className="mb-6">
          <ProductFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        <ProductGrid
          products={data?.products || []}
          isLoading={productsLoading}
          emptyMessage={`Geen deals gevonden in ${category?.name || 'deze categorie'}`}
        />
      </div>
    </Layout>
  );
};

export default CategoryPage;

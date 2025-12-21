import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductFilters } from '@/components/products/ProductFilters';
import { useInfiniteProducts } from '@/hooks/useInfiniteProducts';
import { useCategory } from '@/hooks/useCategories';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProductFilters as ProductFiltersType } from '@/types/database';

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: category, isLoading: categoryLoading } = useCategory(slug || '');
  
  const [filters, setFilters] = useState<ProductFiltersType>({});

  // Use infinite scroll for category pages
  const {
    data,
    isLoading: productsLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteProducts(filters, category?.id);

  // Flatten all pages into a single array
  const products = useMemo(() => 
    data?.pages.flatMap(page => page.products) || [],
    [data]
  );

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
          products={products}
          isLoading={productsLoading}
          emptyMessage={`Geen deals gevonden in ${category?.name || 'deze categorie'}`}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
        />
      </div>
    </Layout>
  );
};

export default CategoryPage;

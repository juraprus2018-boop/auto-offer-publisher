import { useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useInfiniteProducts } from '@/hooks/useInfiniteProducts';

const Index = () => {
  const { 
    data, 
    isLoading, 
    hasNextPage, 
    isFetchingNextPage, 
    fetchNextPage 
  } = useInfiniteProducts({ sortBy: 'discount' });

  const allProducts = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.products);
  }, [data?.pages]);

  return (
    <Layout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">De Beste Deals</h1>
        </div>

        <ProductGrid
          products={allProducts}
          isLoading={isLoading}
          emptyMessage="Geen deals gevonden"
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
        />
      </div>
    </Layout>
  );
};

export default Index;

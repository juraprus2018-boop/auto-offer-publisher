import { useEffect, useRef, useCallback } from 'react';
import { ProductCard } from './ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import type { Product } from '@/types/database';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  emptyMessage?: string;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
}

export function ProductGrid({ 
  products, 
  isLoading, 
  emptyMessage = 'Geen producten gevonden',
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage
}: ProductGridProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasNextPage && !isFetchingNextPage && fetchNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element || !fetchNextPage) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: '600px', // Load earlier for smoother experience
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [handleObserver, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <span className="text-3xl">🔍</span>
          </div>
          <p className="text-muted-foreground text-lg">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Infinite scroll trigger */}
      {fetchNextPage && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {isFetchingNextPage ? (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="font-medium">Meer deals laden...</span>
            </div>
          ) : hasNextPage ? (
            <div className="h-10" />
          ) : products.length > 0 ? (
            <p className="text-muted-foreground text-sm">Je hebt alle deals bekeken! 🎉</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 overflow-hidden bg-card">
      <Skeleton className="aspect-square w-full" />
      <div className="p-5 space-y-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}


import { useState, useMemo, useLayoutEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductFilters } from '@/components/products/ProductFilters';
import { useInfiniteProducts } from '@/hooks/useInfiniteProducts';
import { useCategory } from '@/hooks/useCategories';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProductFilters as ProductFiltersType } from '@/types/database';

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { data: category, isLoading: categoryLoading } = useCategory(slug || '');
  
  const [filters, setFilters] = useState<ProductFiltersType>({});

  // Scroll to top on page load
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

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

  const totalCount = data?.pages?.[0]?.totalCount || 0;

  // Generate CollectionPage JSON-LD
  const generateCollectionJsonLd = () => {
    if (!category) return null;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${category.name} Deals`,
      description: category.description || `Ontdek de beste ${category.name} deals en aanbiedingen met hoge kortingen.`,
      url: `https://kortingdeal.nl/categorie/${category.slug}`,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: totalCount,
        itemListElement: products.slice(0, 10).map((product, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Product',
            name: product.seo_title,
            url: `https://kortingdeal.nl/deal/${product.slug}`,
            image: product.image_url,
            offers: {
              '@type': 'Offer',
              price: product.sale_price?.toFixed(2) || '0',
              priceCurrency: product.currency || 'EUR',
              availability: 'https://schema.org/InStock',
            },
          },
        })),
      },
    };

    return JSON.stringify(jsonLd);
  };

  // Generate BreadcrumbList JSON-LD
  const generateBreadcrumbJsonLd = () => {
    if (!category) return null;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://kortingdeal.nl/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Categorieën',
          item: 'https://kortingdeal.nl/categorien',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: category.name,
          item: `https://kortingdeal.nl/categorie/${category.slug}`,
        },
      ],
    };

    return JSON.stringify(jsonLd);
  };

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

  const metaTitle = `${category?.name || 'Categorie'} Deals & Aanbiedingen | Tot 70% Korting | KortingDeal.nl`;
  const metaDescription = category?.description || 
    `Ontdek de beste ${category?.name || ''} deals en aanbiedingen. ${totalCount > 0 ? `${totalCount}+ producten` : 'Vele producten'} met hoge kortingen. Bespaar nu bij KortingDeal.nl!`;

  return (
    <Layout>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription.substring(0, 160)} />
        <meta name="keywords" content={`${category?.name || ''}, deals, korting, aanbieding, sale, uitverkoop, besparen`} />
        <link rel="canonical" href={`https://kortingdeal.nl/categorie/${category?.slug}`} />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription.substring(0, 160)} />
        <meta property="og:url" content={`https://kortingdeal.nl/categorie/${category?.slug}`} />
        <meta property="og:site_name" content="KortingDeal.nl" />
        <meta property="og:locale" content="nl_NL" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription.substring(0, 160)} />
        
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">{generateCollectionJsonLd()}</script>
        <script type="application/ld+json">{generateBreadcrumbJsonLd()}</script>
      </Helmet>

      <main className="container py-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span aria-hidden="true">/</span>
          <Link to="/categorien" className="hover:text-foreground transition-colors">Categorieën</Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground" aria-current="page">{category?.name}</span>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {category?.name || 'Categorie'} Deals
          </h1>
          <p className="text-muted-foreground">
            {category?.description || `Bekijk alle deals in de categorie ${category?.name}`}
            {totalCount > 0 && (
              <span className="ml-2 text-foreground font-medium">
                ({totalCount.toLocaleString()} producten)
              </span>
            )}
          </p>
        </header>

        {/* Sticky Filter Bar */}
        <div className="sticky top-[104px] z-40 -mx-4 px-4 py-4 mb-6 bg-background/95 backdrop-blur-sm border-b border-border/50 shadow-sm">
          <ProductFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        <section aria-label={`${category?.name} producten`}>
          <ProductGrid
            products={products}
            isLoading={productsLoading}
            emptyMessage={`Geen deals gevonden in ${category?.name || 'deze categorie'}`}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
          />
        </section>
      </main>
    </Layout>
  );
};

export default CategoryPage;

import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductFilters } from '@/components/products/ProductFilters';
import { useInfiniteProducts } from '@/hooks/useInfiniteProducts';
import type { ProductFilters as ProductFiltersType } from '@/types/database';

const Deals = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || undefined;
  const sortParam = searchParams.get('sort') as ProductFiltersType['sortBy'] || undefined;
  
  const [filters, setFilters] = useState<ProductFiltersType>({
    search: initialSearch,
    sortBy: sortParam,
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

  // Generate CollectionPage JSON-LD
  const generateCollectionJsonLd = () => {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Alle Deals',
      description: 'Ontdek alle deals en aanbiedingen met hoge kortingen op KortingDeal.nl',
      url: 'https://kortingdeal.nl/deals',
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: totalCount,
        itemListElement: allProducts.slice(0, 10).map((product, index) => ({
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
          name: 'Alle Deals',
          item: 'https://kortingdeal.nl/deals',
        },
      ],
    };
    return JSON.stringify(jsonLd);
  };

  const metaTitle = filters.search 
    ? `Zoekresultaten voor "${filters.search}" | KortingDeal.nl`
    : 'Alle Deals & Aanbiedingen | Tot 70% Korting | KortingDeal.nl';
  
  const metaDescription = filters.search
    ? `Bekijk alle deals voor "${filters.search}". ${totalCount} producten gevonden met hoge kortingen.`
    : `Ontdek ${totalCount.toLocaleString()}+ deals en aanbiedingen met kortingen tot 70%. Elektronica, mode, sport en meer. Dagelijks nieuwe deals!`;

  return (
    <Layout>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription.substring(0, 160)} />
        <meta name="keywords" content="deals, korting, aanbieding, sale, uitverkoop, besparen, online shopping, Nederland" />
        <link rel="canonical" href="https://kortingdeal.nl/deals" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription.substring(0, 160)} />
        <meta property="og:url" content="https://kortingdeal.nl/deals" />
        <meta property="og:site_name" content="KortingDeal.nl" />
        <meta property="og:locale" content="nl_NL" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription.substring(0, 160)} />
        
        {/* Prevent indexing of search result pages */}
        {filters.search && <meta name="robots" content="noindex, follow" />}
        
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">{generateCollectionJsonLd()}</script>
        <script type="application/ld+json">{generateBreadcrumbJsonLd()}</script>
      </Helmet>

      <main className="container py-8 md:py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground" aria-current="page">Alle Deals</span>
        </nav>

        <header className="mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            {filters.search ? `Zoekresultaten voor "${filters.search}"` : 'Alle Deals'}
          </h1>
          <p className="text-muted-foreground text-lg">
            Ontdek de beste kortingen en aanbiedingen
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

        <section aria-label="Productoverzicht">
          <ProductGrid
            products={allProducts}
            isLoading={isLoading}
            emptyMessage="Geen deals gevonden met deze filters"
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
          />
        </section>
      </main>
    </Layout>
  );
};

export default Deals;

import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid } from '@/components/products/ProductGrid';
import { PriceFilterButtons } from '@/components/products/PriceFilterButtons';
import { useInfiniteProducts } from '@/hooks/useInfiniteProducts';
import { useCategories } from '@/hooks/useCategories';
import type { ProductFilters as ProductFiltersType } from '@/types/database';

const Index = () => {
  // Force a fresh shuffle on each page load/navigation (even with cache)
  const [shuffleKey] = useState(() => Date.now());
  const [filters, setFilters] = useState<ProductFiltersType>({});

  const { 
    data, 
    isLoading, 
    hasNextPage, 
    isFetchingNextPage, 
    fetchNextPage 
  } = useInfiniteProducts(filters, undefined, shuffleKey);

  const { data: categories } = useCategories();

  const allProducts = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.products);
  }, [data?.pages]);

  const totalCount = data?.pages?.[0]?.totalCount || 0;

  // Generate WebSite JSON-LD
  const generateWebsiteJsonLd = () => {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'KortingDeal.nl',
      url: 'https://kortingdeal.nl/',
      description: 'Ontdek de beste deals en kortingen in Nederland. Bespaar tot 70% op elektronica, mode, huis & tuin en meer.',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://kortingdeal.nl/deals?search={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    };
    return JSON.stringify(jsonLd);
  };

  // Generate Organization JSON-LD
  const generateOrganizationJsonLd = () => {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'KortingDeal.nl',
      url: 'https://kortingdeal.nl/',
      logo: 'https://kortingdeal.nl/favicon.ico',
      description: 'De beste deals en kortingen verzameld op één plek.',
      sameAs: [],
    };
    return JSON.stringify(jsonLd);
  };

  // Generate ItemList JSON-LD for top deals
  const generateItemListJsonLd = () => {
    const topProducts = allProducts.slice(0, 10);
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Top Deals',
      description: 'De beste deals met de hoogste kortingen',
      numberOfItems: totalCount,
      itemListElement: topProducts.map((product, index) => ({
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
    };
    return JSON.stringify(jsonLd);
  };

  // Generate category navigation JSON-LD
  const generateSiteNavigationJsonLd = () => {
    if (!categories?.length) return null;
    
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'SiteNavigationElement',
      name: 'Categorieën',
      hasPart: categories.map(cat => ({
        '@type': 'WebPage',
        name: cat.name,
        url: `https://kortingdeal.nl/categorie/${cat.slug}`,
      })),
    };
    return JSON.stringify(jsonLd);
  };

  return (
    <Layout>
      <Helmet>
        <title>KortingDeal.nl | De Beste Deals & Kortingen in Nederland</title>
        <meta name="description" content="Ontdek dagelijks de beste deals en kortingen tot 70% op elektronica, mode, huis & tuin, sport en meer. Bespaar slim met KortingDeal.nl!" />
        <meta name="keywords" content="deals, korting, aanbieding, sale, uitverkoop, besparen, elektronica, mode, huis en tuin, sport, Nederland" />
        <link rel="canonical" href="https://kortingdeal.nl/" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="KortingDeal.nl | De Beste Deals & Kortingen" />
        <meta property="og:description" content="Ontdek dagelijks de beste deals en kortingen tot 70%. Bespaar slim met KortingDeal.nl!" />
        <meta property="og:url" content="https://kortingdeal.nl/" />
        <meta property="og:site_name" content="KortingDeal.nl" />
        <meta property="og:locale" content="nl_NL" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="KortingDeal.nl | De Beste Deals & Kortingen" />
        <meta name="twitter:description" content="Ontdek dagelijks de beste deals en kortingen tot 70%. Bespaar slim!" />
        
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">{generateWebsiteJsonLd()}</script>
        <script type="application/ld+json">{generateOrganizationJsonLd()}</script>
        <script type="application/ld+json">{generateItemListJsonLd()}</script>
        {categories?.length && <script type="application/ld+json">{generateSiteNavigationJsonLd()}</script>}
      </Helmet>

      <main className="container py-6">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">De Beste Deals</h1>
          {totalCount > 0 && (
            <p className="text-muted-foreground mt-1">
              {totalCount.toLocaleString()} producten met korting
            </p>
          )}
          <div className="mt-4">
            <PriceFilterButtons filters={filters} onFiltersChange={setFilters} />
          </div>
        </header>

        <section aria-label="Productoverzicht">
          <ProductGrid
            products={allProducts}
            isLoading={isLoading}
            emptyMessage="Geen deals gevonden"
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
          />
        </section>
      </main>
    </Layout>
  );
};

export default Index;

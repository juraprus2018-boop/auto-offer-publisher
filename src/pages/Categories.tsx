import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Smartphone,
  Shirt,
  Home,
  Dumbbell,
  Heart,
  Gamepad2,
  UtensilsCrossed,
  Car,
  Plane,
  MoreHorizontal,
  ArrowRight,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { useCategories } from '@/hooks/useCategories';
import { Skeleton } from '@/components/ui/skeleton';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Smartphone,
  Shirt,
  Home,
  Dumbbell,
  Heart,
  Gamepad2,
  UtensilsCrossed,
  Car,
  Plane,
  MoreHorizontal,
};

const Categories = () => {
  const { data: categories, isLoading } = useCategories();

  const totalDeals = categories?.reduce((sum, cat) => sum + (cat.product_count || 0), 0) || 0;

  // Generate ItemList JSON-LD for categories
  const generateItemListJsonLd = () => {
    if (!categories?.length) return null;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Deal Categorieën',
      description: 'Alle categorieën met deals en kortingen op KortingDeal.nl',
      numberOfItems: categories.length,
      itemListElement: categories.map((category, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'CollectionPage',
          name: category.name,
          description: category.description || `Bekijk alle ${category.name} deals`,
          url: `https://kortingdeal.nl/categorie/${category.slug}`,
        },
      })),
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
          name: 'Categorieën',
          item: 'https://kortingdeal.nl/categorien',
        },
      ],
    };
    return JSON.stringify(jsonLd);
  };

  const categoryNames = categories?.slice(0, 5).map(c => c.name).join(', ') || '';

  return (
    <Layout>
      <Helmet>
        <title>Alle Categorieën | Deals per Categorie | KortingDeal.nl</title>
        <meta 
          name="description" 
          content={`Ontdek deals in ${categories?.length || 10}+ categorieën: ${categoryNames} en meer. ${totalDeals.toLocaleString()}+ producten met korting tot 70%.`} 
        />
        <meta name="keywords" content="categorieën, deals, korting, elektronica deals, mode deals, sport deals, huis en tuin deals, Nederland" />
        <link rel="canonical" href="https://kortingdeal.nl/categorien" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Alle Categorieën | KortingDeal.nl" />
        <meta property="og:description" content={`Ontdek deals in ${categories?.length || 10}+ categorieën met kortingen tot 70%.`} />
        <meta property="og:url" content="https://kortingdeal.nl/categorien" />
        <meta property="og:site_name" content="KortingDeal.nl" />
        <meta property="og:locale" content="nl_NL" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Alle Categorieën | KortingDeal.nl" />
        <meta name="twitter:description" content={`Ontdek deals in ${categories?.length || 10}+ categorieën met kortingen tot 70%.`} />
        
        {/* JSON-LD Structured Data */}
        {categories?.length && <script type="application/ld+json">{generateItemListJsonLd()}</script>}
        <script type="application/ld+json">{generateBreadcrumbJsonLd()}</script>
      </Helmet>

      <main className="container py-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground" aria-current="page">Categorieën</span>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Alle Categorieën</h1>
          <p className="text-muted-foreground">
            Ontdek deals per categorie
            {totalDeals > 0 && (
              <span className="ml-2 text-foreground font-medium">
                ({totalDeals.toLocaleString()} deals totaal)
              </span>
            )}
          </p>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" role="status" aria-label="Categorieën laden">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : (
          <section aria-label="Categorieën overzicht">
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" role="list">
              {categories?.map((category) => {
                const IconComponent = category.icon
                  ? iconMap[category.icon] || MoreHorizontal
                  : MoreHorizontal;

                return (
                  <li key={category.id}>
                    <Link to={`/categorie/${category.slug}`} aria-label={`${category.name} - ${category.product_count || 0} deals`}>
                      <Card className="group h-full border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300">
                        <CardContent className="flex flex-col items-center justify-center p-6 text-center h-full">
                          <div className="mb-4 p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors" aria-hidden="true">
                            <IconComponent className="h-8 w-8 text-primary" />
                          </div>
                          <h2 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                            {category.name}
                          </h2>
                          {category.product_count > 0 && (
                            <span className="text-sm text-muted-foreground">
                              {category.product_count} deals
                            </span>
                          )}
                          <div className="mt-3 flex items-center gap-1 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">
                            Bekijk deals
                            <ArrowRight className="h-3.5 w-3.5" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </Layout>
  );
};

export default Categories;

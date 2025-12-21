import { useState, useEffect, useLayoutEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ExternalLink, Tag, Store, Clock } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useProduct, useProductVariants } from '@/hooks/useProducts';

const DealDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { data: product, isLoading, error } = useProduct(slug || '');
  const { data: variants } = useProductVariants(product?.id || '');
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  // Scroll to top on page load
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  // Set initial selected variant when variants load
  useEffect(() => {
    if (variants && variants.length > 0 && !selectedVariant) {
      const currentProduct = variants.find(v => v.id === product?.id);
      setSelectedVariant(currentProduct?.id || variants[0].id);
    }
  }, [variants, product?.id, selectedVariant]);

  // Get selected variant data
  const selectedVariantData = variants?.find(v => v.id === selectedVariant);

  const formatPrice = (price: number | null) => {
    if (price === null) return null;
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: product?.currency || 'EUR',
    }).format(price);
  };

  const formatPriceNumber = (price: number | null) => {
    if (price === null) return '0';
    return price.toFixed(2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatISODate = (dateString: string) => {
    return new Date(dateString).toISOString();
  };

  // Generate Product JSON-LD structured data
  const generateProductJsonLd = () => {
    if (!product) return null;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.seo_title,
      description: product.seo_description || product.description || `${product.seo_title} met korting`,
      image: product.image_url || undefined,
      brand: product.brand ? {
        '@type': 'Brand',
        name: product.brand,
      } : undefined,
      sku: product.awin_product_id,
      category: product.category?.name,
      offers: {
        '@type': 'Offer',
        url: `https://kortingdeal.nl/deal/${product.slug}`,
        priceCurrency: product.currency || 'EUR',
        price: formatPriceNumber(product.sale_price),
        priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        availability: 'https://schema.org/InStock',
        seller: product.advertiser ? {
          '@type': 'Organization',
          name: product.advertiser.name,
        } : undefined,
      },
    };

    return JSON.stringify(jsonLd);
  };

  // Generate BreadcrumbList JSON-LD
  const generateBreadcrumbJsonLd = () => {
    if (!product) return null;

    const items = [
      { name: 'Home', url: 'https://kortingdeal.nl/' },
      { name: 'Deals', url: 'https://kortingdeal.nl/deals' },
    ];

    if (product.category) {
      items.push({
        name: product.category.name,
        url: `https://kortingdeal.nl/categorie/${product.category.slug}`,
      });
    }

    items.push({
      name: product.seo_title,
      url: `https://kortingdeal.nl/deal/${product.slug}`,
    });

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    };

    return JSON.stringify(jsonLd);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="grid lg:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-12 w-40" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <Helmet>
          <title>Deal niet gevonden | KortingDeal.nl</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Deal niet gevonden</h1>
          <p className="text-muted-foreground mb-6">
            Deze deal bestaat niet of is niet meer beschikbaar.
          </p>
          <Button asChild>
            <Link to="/deals">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug naar deals
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const hasDiscount = product.discount_percentage && product.discount_percentage > 0;
  const savings = product.original_price && product.sale_price
    ? product.original_price - product.sale_price
    : null;

  const metaTitle = `${product.seo_title} | ${hasDiscount ? `-${product.discount_percentage}% Korting` : 'Deal'} | KortingDeal.nl`;
  const metaDescription = product.seo_description || 
    `${product.seo_title} nu met ${hasDiscount ? `${product.discount_percentage}% korting` : 'speciale aanbieding'}. ${product.brand ? `Van ${product.brand}.` : ''} Bekijk deze deal bij ${product.advertiser?.name || 'onze partner'}.`;

  return (
    <Layout>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription.substring(0, 160)} />
        <meta name="keywords" content={`${product.seo_title}, ${product.brand || ''}, ${product.category?.name || ''}, korting, deal, aanbieding`} />
        <link rel="canonical" href={`https://kortingdeal.nl/deal/${product.slug}`} />
        
        {/* Open Graph */}
        <meta property="og:type" content="product" />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription.substring(0, 160)} />
        <meta property="og:url" content={`https://kortingdeal.nl/deal/${product.slug}`} />
        {product.image_url && <meta property="og:image" content={product.image_url} />}
        <meta property="og:site_name" content="KortingDeal.nl" />
        <meta property="og:locale" content="nl_NL" />
        <meta property="product:price:amount" content={formatPriceNumber(product.sale_price)} />
        <meta property="product:price:currency" content={product.currency || 'EUR'} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription.substring(0, 160)} />
        {product.image_url && <meta name="twitter:image" content={product.image_url} />}
        
        {/* Product JSON-LD */}
        <script type="application/ld+json">{generateProductJsonLd()}</script>
        
        {/* Breadcrumb JSON-LD */}
        <script type="application/ld+json">{generateBreadcrumbJsonLd()}</script>
      </Helmet>

      <article className="container py-8" itemScope itemType="https://schema.org/Product">
        {/* Breadcrumb with semantic markup */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span aria-hidden="true">/</span>
          <Link to="/deals" className="hover:text-foreground transition-colors">Deals</Link>
          {product.category && (
            <>
              <span aria-hidden="true">/</span>
              <Link
                to={`/categorie/${product.category.slug}`}
                className="hover:text-foreground transition-colors"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <span aria-hidden="true">/</span>
          <span className="text-foreground truncate max-w-[200px]" aria-current="page">{product.seo_title}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image */}
          <figure className="relative">
            <div className="aspect-square rounded-lg overflow-hidden bg-secondary">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.seo_title}
                  className="w-full h-full object-cover"
                  itemProp="image"
                  loading="eager"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  Geen afbeelding beschikbaar
                </div>
              )}
            </div>

            {/* Discount Badge */}
            {hasDiscount && (
              <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground font-bold text-lg px-3 py-1.5">
                -{product.discount_percentage}%
              </Badge>
            )}
          </figure>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Brand */}
            {product.brand && (
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide" itemProp="brand" itemScope itemType="https://schema.org/Brand">
                <span itemProp="name">{product.brand}</span>
              </span>
            )}

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-foreground" itemProp="name">
              {product.seo_title}
            </h1>

            {/* Hidden SEO data */}
            <meta itemProp="sku" content={product.awin_product_id} />
            {product.category && <meta itemProp="category" content={product.category.name} />}

            {/* Category & Advertiser */}
            <div className="flex flex-wrap gap-3">
              {product.category && (
                <Link
                  to={`/categorie/${product.category.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Tag className="h-4 w-4" aria-hidden="true" />
                  {product.category.name}
                </Link>
              )}
              {product.advertiser && (
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground" itemProp="seller" itemScope itemType="https://schema.org/Organization">
                  <Store className="h-4 w-4" aria-hidden="true" />
                  <span itemProp="name">{product.advertiser.name}</span>
                </span>
              )}
            </div>

            {/* Size/Variant Selector */}
            {variants && variants.length > 1 && (
              <div className="space-y-2">
                <h2 className="text-sm font-medium">Kies je maat</h2>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Productvarianten">
                  {variants.map((variant) => (
                    <Button
                      key={variant.id}
                      variant={selectedVariant === variant.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedVariant(variant.id)}
                      className="min-w-[60px]"
                      role="radio"
                      aria-checked={selectedVariant === variant.id}
                    >
                      {variant.variant_value || 'Standaard'}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing */}
            <Card className="bg-secondary/50 border-0" itemProp="offers" itemScope itemType="https://schema.org/Offer">
              <CardContent className="p-6">
                <meta itemProp="priceCurrency" content={product.currency || 'EUR'} />
                <meta itemProp="availability" content="https://schema.org/InStock" />
                <link itemProp="url" href={`https://kortingdeal.nl/deal/${product.slug}`} />
                
                <div className="flex items-end gap-4 mb-3">
                  <span className="text-4xl font-bold text-foreground" itemProp="price" content={formatPriceNumber(selectedVariantData?.sale_price ?? product.sale_price)}>
                    {formatPrice(selectedVariantData?.sale_price ?? product.sale_price)}
                  </span>
                  {hasDiscount && (selectedVariantData?.original_price || product.original_price) && (
                    <span className="text-xl text-muted-foreground line-through">
                      {formatPrice(selectedVariantData?.original_price ?? product.original_price)}
                    </span>
                  )}
                </div>

                {savings && savings > 0 && (
                  <p className="text-lg font-semibold text-success">
                    Je bespaart {formatPrice(savings)}!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* CTA Button */}
            <Button
              asChild
              size="lg"
              className="w-full h-14 text-lg font-semibold"
            >
              <a
                href={selectedVariantData?.affiliate_link || product.affiliate_link}
                target="_blank"
                rel="noopener noreferrer nofollow sponsored"
                aria-label={`Bekijk ${product.seo_title} deal`}
              >
                Bekijk Deal
                <ExternalLink className="ml-2 h-5 w-5" aria-hidden="true" />
              </a>
            </Button>

            {/* Description */}
            {product.description && (
              <section className="space-y-2">
                <h2 className="text-lg font-semibold">Beschrijving</h2>
                <p className="text-muted-foreground leading-relaxed" itemProp="description">
                  {product.description}
                </p>
              </section>
            )}

            {/* Meta Info */}
            <footer className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t border-border">
              <Clock className="h-4 w-4" aria-hidden="true" />
              <time dateTime={formatISODate(product.created_at)}>
                Toegevoegd op {formatDate(product.created_at)}
              </time>
            </footer>
          </div>
        </div>
      </article>
    </Layout>
  );
};

export default DealDetail;

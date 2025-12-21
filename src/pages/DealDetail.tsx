import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Tag, Store, Clock } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useProduct, useProductVariants } from '@/hooks/useProducts';

const DealDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, error } = useProduct(slug || '');
  const { data: variants } = useProductVariants(product?.id || '');
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
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

  return (
    <Layout>
      {/* SEO Meta tags would be handled by a helmet component in production */}
      <div className="container py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link to="/deals" className="hover:text-foreground transition-colors">Deals</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link
                to={`/categorie/${product.category.slug}`}
                className="hover:text-foreground transition-colors"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">{product.seo_title}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image */}
          <div className="relative">
            <div className="aspect-square rounded-lg overflow-hidden bg-secondary">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.seo_title}
                  className="w-full h-full object-cover"
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
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Brand */}
            {product.brand && (
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {product.brand}
              </span>
            )}

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {product.seo_title}
            </h1>

            {/* Category & Advertiser */}
            <div className="flex flex-wrap gap-3">
              {product.category && (
                <Link
                  to={`/categorie/${product.category.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Tag className="h-4 w-4" />
                  {product.category.name}
                </Link>
              )}
              {product.advertiser && (
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Store className="h-4 w-4" />
                  {product.advertiser.name}
                </span>
              )}
            </div>

            {/* Size/Variant Selector */}
            {variants && variants.length > 1 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Kies je maat</h3>
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant) => (
                    <Button
                      key={variant.id}
                      variant={selectedVariant === variant.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedVariant(variant.id)}
                      className="min-w-[60px]"
                    >
                      {variant.variant_value || 'Standaard'}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing */}
            <Card className="bg-secondary/50 border-0">
              <CardContent className="p-6">
                <div className="flex items-end gap-4 mb-3">
                  <span className="text-4xl font-bold text-foreground">
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
                rel="noopener noreferrer nofollow"
              >
                Bekijk Deal
                <ExternalLink className="ml-2 h-5 w-5" />
              </a>
            </Button>

            {/* Description */}
            {product.description && (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Beschrijving</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Meta Info */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t border-border">
              <Clock className="h-4 w-4" />
              Toegevoegd op {formatDate(product.created_at)}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DealDetail;

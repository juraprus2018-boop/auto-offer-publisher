import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Product } from '@/types/database';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const hasDiscount = product.discount_percentage && product.discount_percentage > 0;

  const formatPrice = (price: number | null) => {
    if (price === null) return null;
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: product.currency || 'EUR',
    }).format(price);
  };

  return (
    <Card className="group overflow-hidden border-0 shadow-deal hover:shadow-deal-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in bg-card rounded-2xl">
      <Link to={`/deal/${product.slug}`} className="block">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-secondary/50">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.seo_title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Geen afbeelding
            </div>
          )}

          {/* Discount Badge - iBood style green */}
          {hasDiscount && (
            <Badge className="absolute top-3 left-3 bg-success text-success-foreground font-extrabold text-sm px-3 py-1.5 rounded-full shadow-lg">
              {product.discount_percentage}%
            </Badge>
          )}

          {/* Featured Badge */}
          {product.is_featured && (
            <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground font-bold text-xs rounded-full">
              🔥 Top Deal
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        {/* Brand */}
        {product.brand && (
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {product.brand}
          </span>
        )}

        {/* Title */}
        <Link to={`/deal/${product.slug}`}>
          <h3 className="mt-1 text-sm font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-tight">
            {product.seo_title}
          </h3>
        </Link>

        {/* Category */}
        {product.category && (
          <Link
            to={`/categorie/${product.category.slug}`}
            className="inline-block mt-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            {product.category.name}
          </Link>
        )}

        {/* Pricing - iBood style */}
        <div className="mt-3">
          {hasDiscount && product.original_price && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Adviesprijs</span>
              <span className="text-muted-foreground line-through">
                {formatPrice(product.original_price)}
              </span>
            </div>
          )}
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-primary font-bold text-sm">Nu!</span>
            {product.sale_price && (
              <span className="text-2xl font-extrabold text-foreground">
                {formatPrice(product.sale_price)}
              </span>
            )}
          </div>
        </div>

        {/* Savings */}
        {hasDiscount && product.original_price && product.sale_price && (
          <p className="mt-2 text-xs font-bold text-success bg-success/10 rounded-full px-3 py-1 inline-block">
            Je bespaart {formatPrice(product.original_price - product.sale_price)}
          </p>
        )}

        {/* CTA Button */}
        <Button
          asChild
          className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl h-11"
        >
          <a
            href={product.affiliate_link}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={(e) => e.stopPropagation()}
          >
            Bekijk deal
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

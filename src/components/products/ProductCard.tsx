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
    <Card className="group overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg animate-fade-in">
      <Link to={`/deal/${product.slug}`} className="block">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-secondary">
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

          {/* Discount Badge */}
          {hasDiscount && (
            <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground font-bold text-sm px-2 py-1">
              -{product.discount_percentage}%
            </Badge>
          )}

          {/* Featured Badge */}
          {product.is_featured && (
            <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground font-medium text-xs">
              Top Deal
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        {/* Brand */}
        {product.brand && (
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {product.brand}
          </span>
        )}

        {/* Title */}
        <Link to={`/deal/${product.slug}`}>
          <h3 className="mt-1 text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {product.seo_title}
          </h3>
        </Link>

        {/* Category */}
        {product.category && (
          <Link
            to={`/categorie/${product.category.slug}`}
            className="inline-block mt-2 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            {product.category.name}
          </Link>
        )}

        {/* Pricing */}
        <div className="mt-3 flex items-end gap-2">
          {product.sale_price && (
            <span className="text-lg font-bold text-foreground">
              {formatPrice(product.sale_price)}
            </span>
          )}
          {hasDiscount && product.original_price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.original_price)}
            </span>
          )}
        </div>

        {/* Savings */}
        {hasDiscount && product.original_price && product.sale_price && (
          <p className="mt-1 text-xs font-medium text-success">
            Je bespaart {formatPrice(product.original_price - product.sale_price)}
          </p>
        )}

        {/* CTA Button */}
        <Button
          asChild
          className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          size="sm"
        >
          <a
            href={product.affiliate_link}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={(e) => e.stopPropagation()}
          >
            Bekijk Deal
            <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

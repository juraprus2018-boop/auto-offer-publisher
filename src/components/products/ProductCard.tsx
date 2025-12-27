import { Link } from 'react-router-dom';
import { ExternalLink, Tag, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { withImageSize } from '@/lib/utils';
import type { Product } from '@/types/database';


interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const hasDiscount = product.discount_percentage && product.discount_percentage > 0;
  const discountPercentage = Math.round(product.discount_percentage || 0);

  const formatPrice = (price: number | null) => {
    if (price === null) return null;
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: product.currency || 'EUR',
    }).format(price);
  };

  return (
    <article className="group relative bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2">
      {/* Discount Badge */}
      {hasDiscount && (
        <div className="absolute top-4 left-4 z-20">
          <Badge className="bg-success hover:bg-success text-success-foreground font-bold text-sm px-3 py-1.5 rounded-full shadow-lg shadow-success/30 flex items-center gap-1.5">
            <Percent className="h-3.5 w-3.5" />
            -{discountPercentage}%
          </Badge>
        </div>
      )}

      {/* Brand Badge */}
      {product.brand && (
        <div className="absolute top-4 right-4 z-20">
          <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm text-xs font-medium shadow-sm border border-border/50">
            {product.brand}
          </Badge>
        </div>
      )}

      {/* Image Container */}
      <Link to={`/deal/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted/30 to-muted/60">
          {product.image_url ? (
            <img
              src={withImageSize(product.image_url, 600)}
              alt={product.seo_title}
              className="w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-700 ease-out"
              loading="lazy"
              decoding="async"
              style={{
                imageRendering: 'auto',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
                transform: 'translateZ(0)',
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Tag className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </Link>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Advertiser */}
        {product.advertiser?.name && (
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            {product.advertiser.name}
          </span>
        )}

        {/* Title */}
        <Link to={`/deal/${product.slug}`}>
          <h3 className="font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors min-h-[3rem] text-base">
            {product.seo_title}
          </h3>
        </Link>

        {/* Price Section */}
        <div className="space-y-1">
          {hasDiscount && product.original_price && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Was</span>
              <span className="text-muted-foreground line-through">
                {formatPrice(product.original_price)}
              </span>
            </div>
          )}
          <div className="flex items-baseline gap-2">
            <span className="text-primary font-extrabold text-sm">Nu!</span>
            <span className="text-2xl font-black text-foreground">
              {formatPrice(product.sale_price || product.original_price)}
            </span>
          </div>
        </div>

        {/* Savings Badge */}
        {hasDiscount && product.original_price && product.sale_price && (
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-success bg-success/10 rounded-full px-3 py-1.5">
            <span>Je bespaart {formatPrice(product.original_price - product.sale_price)}</span>
          </div>
        )}

        {/* CTA Button */}
        <Button
          asChild
          className="w-full rounded-xl font-bold h-12 text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 group/btn"
        >
          <a
            href={product.affiliate_link}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={(e) => e.stopPropagation()}
          >
            <span>Bekijk Deal</span>
            <ExternalLink className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
          </a>
        </Button>
      </div>
    </article>
  );
}


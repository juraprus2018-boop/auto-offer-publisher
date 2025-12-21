import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { useCategories } from '@/hooks/useCategories';
import type { ProductFilters as ProductFiltersType } from '@/types/database';

interface ProductFiltersProps {
  filters: ProductFiltersType;
  onFiltersChange: (filters: ProductFiltersType) => void;
}

export function ProductFilters({ filters, onFiltersChange }: ProductFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: categories } = useCategories();

  const updateFilter = <K extends keyof ProductFiltersType>(
    key: K,
    value: ProductFiltersType[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  const clearFilters = () => {
    onFiltersChange({ page: 1, limit: filters.limit });
  };

  const hasActiveFilters =
    filters.search ||
    filters.categorySlug ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.minDiscount;

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      {/* Search */}
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Zoek deals..."
          value={filters.search || ''}
          onChange={(e) => updateFilter('search', e.target.value || undefined)}
          className="pl-10"
        />
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        {/* Sort */}
        <Select
          value={filters.sortBy || 'newest'}
          onValueChange={(value) =>
            updateFilter('sortBy', value as ProductFiltersType['sortBy'])
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sorteren" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Nieuwste</SelectItem>
            <SelectItem value="price_low">Prijs: Laag-Hoog</SelectItem>
            <SelectItem value="price_high">Prijs: Hoog-Laag</SelectItem>
            <SelectItem value="discount">Hoogste Korting</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter Sheet */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  !
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Category Filter */}
              <div className="space-y-2">
                <Label>Categorie</Label>
                <Select
                  value={filters.categorySlug || 'all'}
                  onValueChange={(value) =>
                    updateFilter('categorySlug', value === 'all' ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Alle categorieën" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle categorieën</SelectItem>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.slug}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div className="space-y-4">
                <Label>Prijsbereik</Label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Min</Label>
                    <Input
                      type="number"
                      placeholder="€ 0"
                      value={filters.minPrice || ''}
                      onChange={(e) =>
                        updateFilter(
                          'minPrice',
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Max</Label>
                    <Input
                      type="number"
                      placeholder="€ 999"
                      value={filters.maxPrice || ''}
                      onChange={(e) =>
                        updateFilter(
                          'maxPrice',
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Minimum Discount */}
              <div className="space-y-4">
                <Label>Minimale korting: {filters.minDiscount || 0}%</Label>
                <Slider
                  value={[filters.minDiscount || 0]}
                  onValueChange={([value]) => updateFilter('minDiscount', value || undefined)}
                  max={90}
                  step={5}
                />
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={clearFilters}
                >
                  <X className="h-4 w-4" />
                  Filters wissen
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

import { Button } from '@/components/ui/button';
import type { ProductFilters } from '@/types/database';

interface PriceFilterButtonsProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
}

interface PriceOption {
  label: string;
  minPrice?: number;
  maxPrice?: number;
}

const priceOptions: PriceOption[] = [
  { label: 'Tot €10', maxPrice: 10 },
  { label: 'Tot €25', maxPrice: 25 },
  { label: 'Tot €50', maxPrice: 50 },
  { label: '€100+', minPrice: 100 },
];

export function PriceFilterButtons({ filters, onFiltersChange }: PriceFilterButtonsProps) {
  const isActive = (option: PriceOption) => {
    if (option.minPrice !== undefined && option.maxPrice === undefined) {
      return filters.minPrice === option.minPrice && !filters.maxPrice;
    }
    if (option.maxPrice !== undefined && option.minPrice === undefined) {
      return filters.maxPrice === option.maxPrice && !filters.minPrice;
    }
    return false;
  };

  const handleClick = (option: PriceOption) => {
    if (isActive(option)) {
      // Clear price filter
      onFiltersChange({
        ...filters,
        minPrice: undefined,
        maxPrice: undefined,
        page: 1,
      });
    } else {
      // Apply price filter
      onFiltersChange({
        ...filters,
        minPrice: option.minPrice,
        maxPrice: option.maxPrice,
        page: 1,
      });
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {priceOptions.map((option) => (
        <Button
          key={option.label}
          variant={isActive(option) ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleClick(option)}
          className="rounded-full"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

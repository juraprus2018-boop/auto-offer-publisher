import { Link } from 'react-router-dom';
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
} from 'lucide-react';
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

export function CategoryGrid() {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Categorieën</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="py-12">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Categorieën</h2>
          <Link to="/categorien" className="text-sm font-medium text-primary hover:underline">
            Bekijk alle
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map((category, index) => {
            const IconComponent = category.icon ? iconMap[category.icon] || MoreHorizontal : MoreHorizontal;

            return (
              <Link
                key={category.id}
                to={`/categorie/${category.slug}`}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Card className="group h-full border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300">
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="mb-3 p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    {category.product_count > 0 && (
                      <span className="text-xs text-muted-foreground mt-1">
                        {category.product_count} deals
                      </span>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

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

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Alle Categorieën</h1>
          <p className="text-muted-foreground">
            Ontdek deals per categorie
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {categories?.map((category) => {
              const IconComponent = category.icon
                ? iconMap[category.icon] || MoreHorizontal
                : MoreHorizontal;

              return (
                <Link key={category.id} to={`/categorie/${category.slug}`}>
                  <Card className="group h-full border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center h-full">
                      <div className="mb-4 p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
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
                      <div className="mt-3 flex items-center gap-1 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Bekijk deals
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Categories;

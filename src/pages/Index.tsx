import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { TopDealsSection } from '@/components/home/TopDealsSection';
import { RecentDealsSection } from '@/components/home/RecentDealsSection';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <CategoryGrid />
      <TopDealsSection />
      <RecentDealsSection />
    </Layout>
  );
};

export default Index;

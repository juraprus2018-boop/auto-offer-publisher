import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
  onSearch?: (query: string) => void;
}

export function Layout({ children, onSearch }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header onSearch={onSearch} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

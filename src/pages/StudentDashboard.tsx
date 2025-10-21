import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Wallet, Users, LogOut } from 'lucide-react';
import MenuSection from '@/components/student/MenuSection';
import CartSection from '@/components/student/CartSection';
import WalletSection from '@/components/student/WalletSection';
import TransferSection from '@/components/student/TransferSection';
import OrdersSection from '@/components/student/OrdersSection';

const StudentDashboard = () => {
  const { signOut, user } = useAuth();
  const { items } = useCart();
  const [activeTab, setActiveTab] = useState<'menu' | 'cart' | 'wallet' | 'transfer' | 'orders'>('menu');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-heading text-glow">CANTEEN SYSTEM</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-border bg-card/30 backdrop-blur-sm sticky top-[73px] z-40">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 py-2">
            <Button
              variant={activeTab === 'menu' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('menu')}
              className="gap-2"
            >
              Menu
            </Button>
            <Button
              variant={activeTab === 'cart' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('cart')}
              className="gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Cart {items.length > 0 && `(${items.length})`}
            </Button>
            <Button
              variant={activeTab === 'wallet' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('wallet')}
              className="gap-2"
            >
              <Wallet className="h-4 w-4" />
              Wallet
            </Button>
            <Button
              variant={activeTab === 'transfer' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('transfer')}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              Transfer
            </Button>
            <Button
              variant={activeTab === 'orders' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('orders')}
              className="gap-2"
            >
              My Orders
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'menu' && <MenuSection />}
        {activeTab === 'cart' && <CartSection />}
        {activeTab === 'wallet' && <WalletSection />}
        {activeTab === 'transfer' && <TransferSection />}
        {activeTab === 'orders' && <OrdersSection />}
      </main>
    </div>
  );
};

export default StudentDashboard;

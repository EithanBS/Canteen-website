import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

const CanteenDashboard = () => {
  const { signOut, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: orders } = useQuery({
    queryKey: ['canteen-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, profiles(email, full_name), order_items(*, menu_items(name))`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    
    if (error) {
      toast.error('Failed to update order');
      return;
    }
    
    queryClient.invalidateQueries({ queryKey: ['canteen-orders'] });
    toast.success('Order status updated!');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-heading text-glow">CANTEEN DASHBOARD</h1>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-heading text-glow mb-6">INCOMING ORDERS</h2>
        <div className="space-y-4">
          {orders?.map((order) => (
            <Card key={order.id} className="card-glow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
                  <Badge>{order.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Customer: {order.profiles.full_name || order.profiles.email}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.menu_items.name} x{item.quantity}</span>
                      <span className="text-primary">₱{parseFloat(item.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => updateOrderStatus(order.id, 'ready')} disabled={order.status !== 'processing'}>
                    Mark as Ready
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.id, 'completed')} disabled={order.status !== 'ready'}>
                    Complete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default CanteenDashboard;

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, Package } from 'lucide-react';

const OrdersSection = () => {
  const { user } = useAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_items (name)
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="text-center text-muted-foreground">Loading orders...</div>;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4" />;
      case 'ready':
        return <Package className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'processing':
        return 'secondary';
      case 'ready':
        return 'default';
      case 'completed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-heading text-glow mb-6">MY ORDERS</h2>
      
      <div className="space-y-4">
        {orders?.map((order) => (
          <Card key={order.id} className="card-glow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Order #{order.id.slice(0, 8)}
                </CardTitle>
                <Badge variant={getStatusVariant(order.status)} className="gap-1">
                  {getStatusIcon(order.status)}
                  {order.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(order.created_at).toLocaleString()}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.menu_items.name} x{item.quantity}</span>
                    <span className="text-primary">₱{parseFloat(item.price).toFixed(2)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-border flex justify-between font-heading">
                  <span>Total</span>
                  <span className="text-primary">₱{parseFloat(order.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {!orders?.length && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-xl text-muted-foreground">No orders yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersSection;

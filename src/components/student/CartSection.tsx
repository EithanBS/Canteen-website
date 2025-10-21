import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import PinDialog from '@/components/PinDialog';

const CartSection = () => {
  const { items, updateQuantity, removeItem, clearCart, total } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const queryClient = useQueryClient();

  const handleCheckout = async (pin: string) => {
    setLoading(true);
    try {
      // Verify wallet and PIN
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (walletError) throw walletError;

      // Verify PIN (in production, this should be done server-side)
      const { data: pinCheck } = await supabase.rpc('verify_pin', {
        user_id: user?.id,
        input_pin: pin,
      });

      if (!pinCheck) {
        toast.error('Invalid PIN!');
        return;
      }

      const totalAmount = total();
      
      if (parseFloat(wallet.balance) < totalAmount) {
        toast.error('Insufficient balance!');
        return;
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id,
          total_amount: totalAmount,
          status: 'processing',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items and update stock
      for (const item of items) {
        await supabase.from('order_items').insert({
          order_id: order.id,
          menu_item_id: item.id,
          quantity: item.quantity,
          price: item.price,
        });

        // Update stock
        const { data: menuItem } = await supabase
          .from('menu_items')
          .select('stock')
          .eq('id', item.id)
          .single();

        if (menuItem) {
          await supabase
            .from('menu_items')
            .update({ stock: menuItem.stock - item.quantity })
            .eq('id', item.id);
        }
      }

      // Update wallet balance
      await supabase
        .from('wallets')
        .update({ balance: parseFloat(wallet.balance) - totalAmount })
        .eq('user_id', user?.id);

      // Create transaction record
      await supabase.from('transactions').insert({
        from_user_id: user?.id,
        amount: totalAmount,
        type: 'order',
        status: 'completed',
      });

      clearCart();
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order placed successfully!');
      setShowPinDialog(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <p className="text-xl text-muted-foreground">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-heading text-glow mb-6">SHOPPING CART</h2>
      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id} className="card-glow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-heading text-lg text-glow">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">₱{item.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                      className="w-20 text-center"
                      min="1"
                      max={item.stock}
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="w-24 text-right font-heading text-primary">
                    ₱{(item.price * item.quantity).toFixed(2)}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="card-glow border-glow">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span className="text-glow">TOTAL</span>
              <span className="text-2xl font-heading text-primary">₱{total().toFixed(2)}</span>
            </CardTitle>
          </CardHeader>
          <CardFooter>
            <Button
              onClick={() => setShowPinDialog(true)}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Processing...' : 'Checkout'}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <PinDialog
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        onConfirm={handleCheckout}
        title="Confirm Order"
        description="Enter your PIN to complete the purchase"
      />
    </div>
  );
};

export default CartSection;

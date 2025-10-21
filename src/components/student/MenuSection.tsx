import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/hooks/useCart';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

const MenuSection = () => {
  const { addItem } = useCart();

  const { data: menuItems, isLoading } = useQuery({
    queryKey: ['menuItems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const handleAddToCart = (item: any) => {
    if (item.stock === 0) {
      toast.error('Item out of stock!');
      return;
    }
    
    addItem({
      id: item.id,
      name: item.name,
      price: parseFloat(item.price),
      stock: item.stock,
    });
    toast.success(`${item.name} added to cart!`);
  };

  if (isLoading) {
    return <div className="text-center text-muted-foreground">Loading menu...</div>;
  }

  return (
    <div>
      <h2 className="text-3xl font-heading text-glow mb-6">AVAILABLE ITEMS</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems?.map((item) => (
          <Card key={item.id} className="card-glow border-glow overflow-hidden">
            {item.image_url && (
              <div className="w-full h-48 bg-muted/20 flex items-center justify-center">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-glow">{item.name}</span>
                <span className="text-primary font-heading">₱{parseFloat(item.price).toFixed(2)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Stock: <span className={item.stock > 0 ? 'text-primary' : 'text-destructive'}>{item.stock}</span>
              </p>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleAddToCart(item)}
                disabled={item.stock === 0}
                className="w-full gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MenuSection;

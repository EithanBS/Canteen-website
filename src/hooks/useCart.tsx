import { create } from 'zustand';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCart = create<CartStore>((set, get) => ({
  items: [],
  
  addItem: (item) => {
    const items = get().items;
    const existingItem = items.find(i => i.id === item.id);
    
    if (existingItem) {
      if (existingItem.quantity < item.stock) {
        set({
          items: items.map(i =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          )
        });
      }
    } else {
      set({ items: [...items, { ...item, quantity: 1 }] });
    }
  },
  
  removeItem: (id) => {
    set({ items: get().items.filter(i => i.id !== id) });
  },
  
  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id);
      return;
    }
    
    set({
      items: get().items.map(i =>
        i.id === id ? { ...i, quantity: Math.min(quantity, i.stock) } : i
      )
    });
  },
  
  clearCart: () => set({ items: [] }),
  
  total: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
}));

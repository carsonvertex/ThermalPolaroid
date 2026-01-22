import { create } from 'zustand';

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface CartState {
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  taxRate: number;
  
  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  calculateTotals: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  subtotal: 0,
  taxAmount: 0,
  total: 0,
  taxRate: 0.1, // 10% default tax rate
  
  addItem: (item) => {
    const items = get().items;
    const existingItem = items.find((i) => i.productId === item.productId);
    
    if (existingItem) {
      // Update quantity if item already exists
      set({
        items: items.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
      });
    } else {
      // Add new item
      set({ items: [...items, { ...item, quantity: 1 }] });
    }
    
    get().calculateTotals();
  },
  
  removeItem: (productId) => {
    set({
      items: get().items.filter((item) => item.productId !== productId),
    });
    get().calculateTotals();
  },
  
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    
    set({
      items: get().items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      ),
    });
    get().calculateTotals();
  },
  
  clearCart: () => {
    set({
      items: [],
      subtotal: 0,
      taxAmount: 0,
      total: 0,
    });
  },
  
  calculateTotals: () => {
    const items = get().items;
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const taxAmount = subtotal * get().taxRate;
    const total = subtotal + taxAmount;
    
    set({ subtotal, taxAmount, total });
  },
}));


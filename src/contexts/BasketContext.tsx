import React, { createContext, useContext, useState, useEffect } from 'react';
import { BasketItem, BasketContextType } from '@/types/basket';
import { Product } from '@/data/products';
import { toast } from '@/components/ui/use-toast';

const BasketContext = createContext<BasketContextType | undefined>(undefined);

export const useBasket = () => {
  const context = useContext(BasketContext);
  if (!context) {
    throw new Error('useBasket must be used within a BasketProvider');
  }
  return context;
};

export const BasketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<BasketItem[]>([]);

  // Load basket from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('quickshop-basket');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setItems(parsed.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt)
        })));
      } catch (e) {
        console.error('Failed to load basket from localStorage');
      }
    }
  }, []);

  // Save basket to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('quickshop-basket', JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product) => {
    setItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        id: `${product.id}-${Date.now()}`,
        product,
        quantity: 1,
        addedAt: new Date()
      }];
    });
    toast({ title: `${product.name} added to basket` });
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems(prev => 
      prev.map(item => 
        item.product.id === productId 
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearBasket = () => {
    setItems([]);
    toast({ title: 'Basket cleared' });
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const sortedByAisle = [...items].sort((a, b) => a.product.aisle - b.product.aisle);

  return (
    <BasketContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearBasket,
      totalItems,
      totalPrice,
      sortedByAisle
    }}>
      {children}
    </BasketContext.Provider>
  );
};
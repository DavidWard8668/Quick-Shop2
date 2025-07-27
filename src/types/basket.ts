import { Product } from '@/data/products';

export interface BasketItem {
  id: string;
  product: Product;
  quantity: number;
  addedAt: Date;
}

export interface BasketContextType {
  items: BasketItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearBasket: () => void;
  totalItems: number;
  totalPrice: number;
  sortedByAisle: BasketItem[];
}
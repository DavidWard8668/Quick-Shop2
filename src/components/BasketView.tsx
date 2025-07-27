import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { useBasket } from '@/contexts/BasketContext';

const BasketView: React.FC = () => {
  const { sortedByAisle, updateQuantity, removeItem, clearBasket, totalItems, totalPrice } = useBasket();

  if (sortedByAisle.length === 0) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Your basket is empty</p>
          <p className="text-sm text-gray-400 mt-2">Search for products to add them</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Basket ({totalItems} items)
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearBasket}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-lg font-semibold text-green-600">
          Total: £{totalPrice.toFixed(2)}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {sortedByAisle.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{item.product.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">Aisle {item.product.aisle}</Badge>
                <span className="text-sm text-gray-500">£{item.product.price.toFixed(2)} each</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                className="h-8 w-8 p-0"
              >
                <Minus className="h-3 w-3" />
              </Button>
              
              <span className="font-medium min-w-[2rem] text-center">{item.quantity}</span>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeItem(item.product.id)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 ml-2"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default BasketView;
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { useBasket } from '@/contexts/BasketContext';

const StoreMap: React.FC = () => {
  const { sortedByAisle } = useBasket();
  
  const aisleNumbers = [...new Set(sortedByAisle.map(item => item.product.aisle))].sort((a, b) => a - b);
  
  const getAisleColor = (aisle: number) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800', 
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-red-100 text-red-800',
      'bg-orange-100 text-orange-800'
    ];
    return colors[(aisle - 1) % colors.length];
  };

  if (aisleNumbers.length === 0) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Store Route
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-gray-500">
          Add items to see your optimised route
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Optimised Route
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Follow this order to minimise walking time
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
              S
            </div>
            <span className="font-medium">Start at Entrance</span>
          </div>
          
          {aisleNumbers.map((aisle, index) => {
            const aisleItems = sortedByAisle.filter(item => item.product.aisle === aisle);
            return (
              <div key={aisle} className="flex items-start gap-2 p-3 border rounded-lg">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getAisleColor(aisle)}>
                      Aisle {aisle}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {aisleItems.length} item{aisleItems.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {aisleItems.map(item => (
                      <div key={item.id} className="text-sm text-gray-700">
                        {item.product.name} (×{item.quantity})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          
          <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
            <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
              ✓
            </div>
            <span className="font-medium">Checkout</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StoreMap;
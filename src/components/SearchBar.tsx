import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, Plus } from 'lucide-react';
import { mockProducts, Product } from '@/data/products';
import { useBasket } from '@/contexts/BasketContext';

interface SearchBarProps {
  onProductSelect?: (product: Product) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onProductSelect }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { addItem } = useBasket();

  const filteredProducts = useMemo(() => {
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase();
    return mockProducts.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(searchTerm);
      const synonymMatch = product.synonyms.some(synonym => 
        synonym.toLowerCase().includes(searchTerm)
      );
      return nameMatch || synonymMatch;
    }).slice(0, 8); // Limit results
  }, [query]);

  const handleProductSelect = (product: Product) => {
    addItem(product);
    onProductSelect?.(product);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search for products..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-4 py-3 text-lg"
        />
      </div>
      
      {isOpen && filteredProducts.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer"
              onClick={() => handleProductSelect(product)}
            >
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-500">
                  Aisle {product.aisle} • {product.section} • £{product.price.toFixed(2)}
                </p>
              </div>
              <Button size="sm" variant="ghost">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </Card>
      )}
      
      {isOpen && query && filteredProducts.length === 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 p-4 text-center text-gray-500">
          No products found for "{query}"
        </Card>
      )}
    </div>
  );
};

export default SearchBar;
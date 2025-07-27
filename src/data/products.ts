export interface Product {
  id: string;
  name: string;
  synonyms: string[];
  aisle: number;
  section?: string;
  price: number;
}

export const mockProducts: Product[] = [
  { id: '1', name: 'Whole Milk', synonyms: ['milk', 'full fat milk'], aisle: 3, section: 'Dairy', price: 1.25 },
  { id: '2', name: 'Semi Skimmed Milk', synonyms: ['milk', 'semi milk'], aisle: 3, section: 'Dairy', price: 1.20 },
  { id: '3', name: 'White Bread', synonyms: ['bread', 'loaf'], aisle: 1, section: 'Bakery', price: 0.85 },
  { id: '4', name: 'Brown Bread', synonyms: ['bread', 'wholemeal'], aisle: 1, section: 'Bakery', price: 0.95 },
  { id: '5', name: 'Bananas', synonyms: ['banana', 'fruit'], aisle: 7, section: 'Fresh Produce', price: 1.10 },
  { id: '6', name: 'Apples', synonyms: ['apple', 'fruit'], aisle: 7, section: 'Fresh Produce', price: 1.50 },
  { id: '7', name: 'Chicken Breast', synonyms: ['chicken', 'meat'], aisle: 5, section: 'Meat & Poultry', price: 4.50 },
  { id: '8', name: 'Cheddar Cheese', synonyms: ['cheese', 'cheddar'], aisle: 3, section: 'Dairy', price: 2.75 },
  { id: '9', name: 'Eggs', synonyms: ['egg', 'free range'], aisle: 3, section: 'Dairy', price: 2.20 },
  { id: '10', name: 'Pasta', synonyms: ['spaghetti', 'noodles'], aisle: 2, section: 'Dry Goods', price: 1.00 },
  { id: '11', name: 'Rice', synonyms: ['basmati', 'long grain'], aisle: 2, section: 'Dry Goods', price: 2.50 },
  { id: '12', name: 'Tomatoes', synonyms: ['tomato', 'cherry tomatoes'], aisle: 7, section: 'Fresh Produce', price: 1.80 },
  { id: '13', name: 'Carrots', synonyms: ['carrot', 'veg'], aisle: 7, section: 'Fresh Produce', price: 0.70 },
  { id: '14', name: 'Yoghurt', synonyms: ['yogurt', 'greek yogurt'], aisle: 3, section: 'Dairy', price: 1.40 },
  { id: '15', name: 'Cereal', synonyms: ['cornflakes', 'breakfast'], aisle: 4, section: 'Breakfast', price: 3.25 },
  { id: '16', name: 'Orange Juice', synonyms: ['juice', 'oj'], aisle: 6, section: 'Drinks', price: 2.00 },
  { id: '17', name: 'Tea Bags', synonyms: ['tea', 'english breakfast'], aisle: 4, section: 'Hot Drinks', price: 2.80 },
  { id: '18', name: 'Biscuits', synonyms: ['cookies', 'digestives'], aisle: 4, section: 'Snacks', price: 1.60 },
  { id: '19', name: 'Washing Up Liquid', synonyms: ['fairy liquid', 'dish soap'], aisle: 8, section: 'Cleaning', price: 1.95 },
  { id: '20', name: 'Toilet Roll', synonyms: ['loo roll', 'tissue'], aisle: 8, section: 'Household', price: 4.50 }
];
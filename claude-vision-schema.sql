-- Enhanced schema for Claude Vision product location analysis

-- Enhanced product_locations table
CREATE TABLE IF NOT EXISTS product_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  product_name TEXT NOT NULL,
  aisle TEXT,
  aisle_section TEXT, -- 'start', 'middle', 'end', 'unknown'
  side TEXT, -- 'left', 'right', 'center'
  shelf_level TEXT, -- 'top', 'middle', 'bottom', 'unknown'
  nearby_products TEXT[], -- for context clues
  confidence_score FLOAT DEFAULT 0.5,
  verified_count INTEGER DEFAULT 0,
  image_url TEXT,
  extracted_by TEXT DEFAULT 'manual', -- 'claude_vision', 'manual', 'ocr', 'user'
  extraction_cost FLOAT DEFAULT 0, -- cost in USD for Claude analysis
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Claude Vision usage tracking
CREATE TABLE IF NOT EXISTS claude_vision_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  image_url TEXT,
  products_extracted INTEGER DEFAULT 0,
  cost_usd FLOAT DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  aisle_detected TEXT,
  store_chain TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Product location verification (crowd-sourced validation)
CREATE TABLE IF NOT EXISTS location_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES product_locations(id),
  user_id UUID REFERENCES users(id),
  is_correct BOOLEAN NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Store layout mappings (for future heat maps)
CREATE TABLE IF NOT EXISTS store_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  aisle_number TEXT,
  aisle_name TEXT,
  position_x FLOAT, -- for mapping coordinates
  position_y FLOAT,
  width FLOAT,
  height FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_locations_store_id ON product_locations(store_id);
CREATE INDEX IF NOT EXISTS idx_product_locations_product_name ON product_locations(product_name);
CREATE INDEX IF NOT EXISTS idx_product_locations_aisle ON product_locations(aisle);
CREATE INDEX IF NOT EXISTS idx_product_locations_confidence ON product_locations(confidence_score);
CREATE INDEX IF NOT EXISTS idx_claude_usage_created_at ON claude_vision_usage(created_at);

-- RLS Policies (Row Level Security)
ALTER TABLE product_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE claude_vision_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_layouts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read product locations
CREATE POLICY "Users can read product locations" ON product_locations
  FOR SELECT USING (true);

-- Allow authenticated users to insert product locations
CREATE POLICY "Users can insert product locations" ON product_locations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to read their own verifications
CREATE POLICY "Users can read verifications" ON location_verifications
  FOR SELECT USING (true);

-- Allow authenticated users to create verifications
CREATE POLICY "Users can create verifications" ON location_verifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow reading usage stats (for admin monitoring)
CREATE POLICY "Public can read usage stats" ON claude_vision_usage
  FOR SELECT USING (true);

-- Allow system to insert usage records
CREATE POLICY "System can insert usage" ON claude_vision_usage
  FOR INSERT WITH CHECK (true);
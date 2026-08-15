-- Create the platform_reviews table
CREATE TABLE IF NOT EXISTS platform_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE platform_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read approved reviews
CREATE POLICY "Anyone can read approved reviews" 
  ON platform_reviews 
  FOR SELECT 
  USING (status = 'approved');

-- Policy: Anyone can insert a new review
CREATE POLICY "Anyone can insert reviews" 
  ON platform_reviews 
  FOR INSERT 
  WITH CHECK (true);

-- Policy: Admins can manage all reviews
CREATE POLICY "Admins can manage platform reviews" 
  ON platform_reviews 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'developer')
    )
  );

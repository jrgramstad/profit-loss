-- P&L Transaction Manager Database Schema
-- This schema creates the pl_transactions table for storing financial transactions

CREATE TABLE pl_transactions (
  id SERIAL PRIMARY KEY,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL,  -- 'income' or 'expense'
  category TEXT,
  property TEXT,
  job TEXT,  -- keeping for data migration, but won't use
  account TEXT NOT NULL,
  transaction_type TEXT NOT NULL,  -- 'business' or 'personal'
  source TEXT,
  original_id TEXT,  -- preserve original Google Sheets ID
  created_at TIMESTAMP DEFAULT NOW(),
  modified_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for improved query performance
CREATE INDEX idx_pl_transactions_date ON pl_transactions(transaction_date);
CREATE INDEX idx_pl_transactions_property ON pl_transactions(property);
CREATE INDEX idx_pl_transactions_category ON pl_transactions(category);
CREATE INDEX idx_pl_transactions_type ON pl_transactions(transaction_type);

-- Add a comment to the table
COMMENT ON TABLE pl_transactions IS 'Stores all profit and loss transactions for the real estate business';

-- Enable Row Level Security (RLS) - can be configured in Supabase dashboard
ALTER TABLE pl_transactions ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations for authenticated users
-- Adjust this policy based on your security requirements
CREATE POLICY "Allow all operations for authenticated users" ON pl_transactions
  FOR ALL
  USING (auth.role() = 'authenticated');

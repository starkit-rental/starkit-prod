#!/bin/bash
# Run the inventory buffer migration
# Usage: ./scripts/run-migration.sh

set -e

echo "Running inventory buffer migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set"
  echo "Please set it in your .env.local file or export it"
  exit 1
fi

# Run the migration
psql "$DATABASE_URL" < supabase/migrations/20260227_add_product_buffer_and_unavailability.sql

echo "Migration completed successfully!"
echo ""
echo "Summary of changes:"
echo "- Added buffer_before and buffer_after columns to products table"
echo "- Added unavailable_from, unavailable_to, unavailable_reason columns to stock_items table"
echo "- Created index on stock_items for faster unavailability queries"

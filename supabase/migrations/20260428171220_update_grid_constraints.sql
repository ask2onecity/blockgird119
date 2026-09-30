/*
  # Update blocks table constraints for 12 cols x 99 rows grid

  1. Changes
    - Update `row` CHECK constraint from 1-12 to 1-99
    - Update `col` CHECK constraint from 1-99 to 1-12
    - This matches the new grid orientation: 12 columns (horizontal) x 99 rows (vertical)

  2. Important Notes
    - Block ID format remains: row(2 digits) + col(2 digits)
    - Pricing formula updated: price = 99 + (99 - row) * 12 + (12 - col)
    - Bottom-right (row=99, col=12) = $99 (cheapest)
    - Top-left (row=1, col=1) = $1,286 (most expensive)
*/

-- Drop old constraints and add new ones
ALTER TABLE blocks DROP CONSTRAINT IF EXISTS blocks_row_check;
ALTER TABLE blocks DROP CONSTRAINT IF EXISTS blocks_col_check;

ALTER TABLE blocks ADD CONSTRAINT blocks_row_check CHECK (row >= 1 AND row <= 99);
ALTER TABLE blocks ADD CONSTRAINT blocks_col_check CHECK (col >= 1 AND col <= 12);

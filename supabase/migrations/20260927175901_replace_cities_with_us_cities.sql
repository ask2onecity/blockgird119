/*
# Replace fictional cities with US cities

1. Changes
  - Update the 4 seeded cities from fictional names to real US cities
  - Update slugs, descriptions, and theme colors

2. Notes
  - City IDs remain the same (UPDATE not DELETE/INSERT) so existing data is preserved
*/

UPDATE cities SET name = 'New York', slug = 'new-york', description = 'The city that never sleeps — a global hub of finance, art, and culture', theme_color = '#1e40af' WHERE slug = 'neo-tokyo';
UPDATE cities SET name = 'Los Angeles', slug = 'los-angeles', description = 'City of angels — entertainment, sunshine, and innovation', theme_color = '#f97316' WHERE slug = 'cyber-london';
UPDATE cities SET name = 'Miami', slug = 'miami', description = 'Magic City — beaches, nightlife, and tropical energy', theme_color = '#06b6d4' WHERE slug = 'solar-dubai';
UPDATE cities SET name = 'Chicago', slug = 'chicago', description = 'The Windy City — architecture, deep-dish, and lakefront living', theme_color = '#7c3aed' WHERE slug = 'arctic-reykjavik';

-- Update district names to match new city names
UPDATE districts SET name = c.name || ' - District ' || UPPER(districts.letter)
FROM cities c
WHERE districts.city_id = c.id;
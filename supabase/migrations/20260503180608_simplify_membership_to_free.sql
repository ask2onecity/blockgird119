/*
  # Simplify Membership to Single Free Tier

  1. Changes
    - Deactivate existing paid tiers (Bronze, Silver, Gold)
    - Create a single free "Member" tier with all features enabled
    - All members get full access at no cost

  2. New Data
    - Single "Member" tier: price = 0, all features enabled
*/

-- Deactivate existing paid tiers
UPDATE membership_tiers SET is_active = false WHERE slug IN ('bronze', 'silver', 'gold');

-- Insert single free tier
INSERT INTO membership_tiers (name, slug, price_monthly, price_yearly, max_blocks, max_images, can_custom_image, can_social_links, can_works_showcase, priority_support, badge_color, description, sort_order, is_active)
VALUES (
  'Member', 'member', 0, 0,
  999, 50, true, true, true, true,
  '#10b981',
  'All features, completely free',
  0, true
) ON CONFLICT (slug) DO UPDATE SET
  price_monthly = 0, price_yearly = 0,
  max_blocks = 999, max_images = 50,
  can_custom_image = true, can_social_links = true,
  can_works_showcase = true, priority_support = true,
  is_active = true, description = 'All features, completely free';

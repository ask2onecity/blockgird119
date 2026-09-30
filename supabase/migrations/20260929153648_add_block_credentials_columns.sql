/*
# Add block_hash and access_key columns to blocks table

## Purpose
Users purchase blocks and receive a unique hash + access key as proof of ownership.
Previously these credentials were only shown once in the checkout modal and never stored,
so users had no way to retrieve them later from their dashboard. This migration adds two
columns to the blocks table to persistently store those credentials.

## Changes
1. New Columns on `blocks` table:
   - `block_hash` (text, nullable) — SHA-256 hash generated at purchase time, serves as a unique fingerprint for the block ownership.
   - `access_key` (text, nullable) — 32-char hex key generated at purchase time, used for verification.

Both columns are nullable because existing blocks purchased before this migration don't have credentials yet.

## Security
- No RLS policy changes. The existing policies on `blocks` already control read/write access.
- These columns are set once at purchase time and should not be user-editable through normal flows.
*/

ALTER TABLE blocks
  ADD COLUMN IF NOT EXISTS block_hash text,
  ADD COLUMN IF NOT EXISTS access_key text;

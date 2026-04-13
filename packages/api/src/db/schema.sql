-- idle_vibes D1 schema
-- Adapted from the original Supabase migration.
-- Primary key is github_user_id (text) from GitHub OAuth.

CREATE TABLE IF NOT EXISTS profiles (
  github_user_id TEXT PRIMARY KEY,
  username       TEXT UNIQUE NOT NULL,
  avatar_url     TEXT,
  total_xp       INTEGER NOT NULL DEFAULT 0,
  aria_shards    INTEGER NOT NULL DEFAULT 0,
  awakened       INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS colony_state (
  github_user_id TEXT PRIMARY KEY REFERENCES profiles(github_user_id),
  saved_at       TEXT NOT NULL DEFAULT (datetime('now')),
  colony_data    TEXT NOT NULL,  -- JSON blob
  prestige_data  TEXT NOT NULL   -- JSON blob
);

CREATE TABLE IF NOT EXISTS market_listings (
  id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  seller_id      TEXT NOT NULL REFERENCES profiles(github_user_id),
  item_id        TEXT NOT NULL,
  item_data      TEXT NOT NULL,  -- JSON
  price          INTEGER NOT NULL CHECK (price > 0),
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
  listed_at      TEXT NOT NULL DEFAULT (datetime('now')),
  sold_at        TEXT
);

CREATE INDEX IF NOT EXISTS idx_market_status ON market_listings(status);
CREATE INDEX IF NOT EXISTS idx_market_seller ON market_listings(seller_id);

CREATE TABLE IF NOT EXISTS global_events (
  id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  event_type     TEXT NOT NULL,
  title          TEXT NOT NULL,
  progress       INTEGER NOT NULL DEFAULT 0,
  target         INTEGER NOT NULL CHECK (target > 0),
  starts_at      TEXT NOT NULL,
  ends_at        TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_active ON global_events(ends_at);

CREATE TABLE IF NOT EXISTS global_event_contributions (
  event_id       TEXT NOT NULL REFERENCES global_events(id),
  github_user_id TEXT NOT NULL REFERENCES profiles(github_user_id),
  amount         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (event_id, github_user_id)
);

-- Seed: initial global event
INSERT OR IGNORE INTO global_events (id, event_type, title, progress, target, starts_at, ends_at)
VALUES (
  'mega_project_v1',
  'mega_project',
  'Global Mainframe v1',
  0,
  1000000,
  datetime('now'),
  datetime('now', '+28 days')
);

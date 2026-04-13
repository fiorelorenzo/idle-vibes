-- idle_vibes initial database schema
-- See GDD §15 for schema design rationale

-- User profiles
CREATE TABLE profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      text NOT NULL UNIQUE,
  avatar_url    text,
  total_xp      int DEFAULT 0,
  aria_shards   int DEFAULT 0,
  awakened      boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

-- Colony state (overwritten on prestige)
CREATE TABLE colony_state (
  user_id       uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  last_save     timestamptz DEFAULT now(),
  map_data      jsonb NOT NULL DEFAULT '{}'::jsonb,
  proxy_data    jsonb NOT NULL DEFAULT '[]'::jsonb,
  building_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  resource_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  vibe_history  jsonb NOT NULL DEFAULT '[]'::jsonb
);

-- Persistent progression (survives prestige)
CREATE TABLE prestige_data (
  user_id             uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  tech_tree_unlocks   jsonb NOT NULL DEFAULT '[]'::jsonb,
  clean_arch_points   int DEFAULT 0,
  prestige_count      int DEFAULT 0,
  last_prestige_at    timestamptz,
  codex_unlocks       jsonb NOT NULL DEFAULT '[]'::jsonb
);

-- Fragment market
CREATE TABLE market_listings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id     text NOT NULL,
  item_data   jsonb,
  price       int NOT NULL CHECK (price > 0),
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
  listed_at   timestamptz DEFAULT now(),
  sold_at     timestamptz
);

-- Cooperative Mega-Projects
CREATE TABLE global_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  text NOT NULL,
  title       text NOT NULL,
  progress    int DEFAULT 0,
  target      int NOT NULL CHECK (target > 0),
  starts_at   timestamptz NOT NULL,
  ends_at     timestamptz NOT NULL
);

CREATE TABLE global_event_contributions (
  event_id    uuid REFERENCES global_events(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE,
  amount      int DEFAULT 0,
  PRIMARY KEY (event_id, user_id)
);

-- Indexes
CREATE INDEX idx_market_listings_status ON market_listings(status) WHERE status = 'active';
CREATE INDEX idx_market_listings_seller ON market_listings(seller_id);
CREATE INDEX idx_global_events_active ON global_events(ends_at) WHERE ends_at > now();

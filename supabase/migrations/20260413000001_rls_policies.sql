-- Row Level Security policies
-- RLS is enabled on every table. No exceptions.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE colony_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestige_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_event_contributions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read any profile, but only update their own
CREATE POLICY "profiles: public read"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "profiles: owner write"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: owner insert"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Colony state: owner only
CREATE POLICY "colony_state: owner only"
ON colony_state
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Prestige data: owner only
CREATE POLICY "prestige_data: owner only"
ON prestige_data
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Market listings: anyone can read active listings, only owner can insert/update
CREATE POLICY "market_listings: public read"
ON market_listings FOR SELECT
USING (status = 'active');

CREATE POLICY "market_listings: owner read own"
ON market_listings FOR SELECT
USING (auth.uid() = seller_id);

CREATE POLICY "market_listings: owner insert"
ON market_listings FOR INSERT
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "market_listings: owner update"
ON market_listings FOR UPDATE
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);

-- Global events: read-only for all authenticated users
CREATE POLICY "global_events: public read"
ON global_events FOR SELECT
USING (auth.role() = 'authenticated');

-- Global event contributions: users can read all, but only insert/update their own
CREATE POLICY "global_event_contributions: public read"
ON global_event_contributions FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "global_event_contributions: owner write"
ON global_event_contributions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "global_event_contributions: owner update"
ON global_event_contributions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Seed data: NPC vendor listings for the Fragment Market
-- These provide a cold-start floor so new players always have something to buy.
-- Stock refreshes daily via a scheduled Edge Function.

-- Note: This seed runs after auth setup. NPC vendor uses a service-role insert
-- with a reserved UUID for the "NPC Vendor" profile.

-- The NPC vendor profile is created by the setup script, not here,
-- to avoid auth dependency issues. See docs/setup.md.

-- Initial global Mega-Project event
INSERT INTO global_events (event_type, title, progress, target, starts_at, ends_at)
VALUES (
  'mega_project',
  'Global Mainframe v1',
  0,
  1000000,
  now(),
  now() + interval '4 weeks'
);

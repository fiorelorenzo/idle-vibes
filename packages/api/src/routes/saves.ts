import { Hono } from 'hono'
import type { AppEnv } from '../index'

const saves = new Hono<AppEnv>()

/** GET /saves — Load the user's cloud save */
saves.get('/', async (c) => {
  const user = c.get('user')
  const userId = String(user.id)

  const row = await c.env.DB.prepare(
    'SELECT colony_data, prestige_data, saved_at FROM colony_state WHERE github_user_id = ?',
  ).bind(userId).first()

  if (!row) return c.json(null, 404)

  return c.json({
    colony: JSON.parse(row.colony_data as string),
    prestige: JSON.parse(row.prestige_data as string),
    savedAt: row.saved_at,
  })
})

/** PUT /saves — Upload the user's cloud save */
saves.put('/', async (c) => {
  const user = c.get('user')
  const userId = String(user.id)
  const body = await c.req.json()

  // Upsert profile
  await c.env.DB.prepare(`
    INSERT INTO profiles (github_user_id, username, avatar_url, total_xp, awakened)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(github_user_id) DO UPDATE SET
      username = excluded.username,
      avatar_url = excluded.avatar_url,
      total_xp = excluded.total_xp,
      awakened = excluded.awakened
  `).bind(
    userId,
    user.login,
    user.avatar_url,
    body.totalXp ?? 0,
    body.awakened ? 1 : 0,
  ).run()

  // Upsert colony state
  await c.env.DB.prepare(`
    INSERT INTO colony_state (github_user_id, colony_data, prestige_data, saved_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(github_user_id) DO UPDATE SET
      colony_data = excluded.colony_data,
      prestige_data = excluded.prestige_data,
      saved_at = excluded.saved_at
  `).bind(
    userId,
    JSON.stringify(body.colony),
    JSON.stringify(body.prestige),
  ).run()

  return c.json({ ok: true })
})

export { saves }

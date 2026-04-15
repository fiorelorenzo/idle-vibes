import { Hono } from 'hono'
import type { AppEnv } from '../index'

const saves = new Hono<AppEnv>()

/** GET /saves — Load the user's cloud save */
saves.get('/', async (c) => {
  const user = c.get('user')
  const userId = String(user.id)

  const row = await c.env.DB.prepare(
    'SELECT snapshot_data, saved_at FROM colony_state WHERE github_user_id = ?',
  ).bind(userId).first()

  if (!row) return c.json(null, 404)

  let snapshot: unknown
  try {
    snapshot = JSON.parse(row.snapshot_data as string)
  } catch {
    return c.json({ error: 'corrupt save' }, 500)
  }

  return c.json({
    snapshot,
    savedAt: row.saved_at,
  })
})

/** PUT /saves — Upload the user's cloud save */
saves.put('/', async (c) => {
  const user = c.get('user')
  const userId = String(user.id)
  const body = (await c.req.json()) as { snapshot?: unknown; savedAt?: number }

  if (!body.snapshot || typeof body.snapshot !== 'object') {
    return c.json({ error: 'missing snapshot' }, 400)
  }

  // Summary stats we hoist out of the snapshot for leaderboard queries.
  const snapshot = body.snapshot as {
    meta?: { echoes?: number; totalPrestiges?: number }
    run?: { deepestLayer?: string }
    awakened?: boolean
  }
  const echoes = Number(snapshot.meta?.echoes ?? 0)
  const totalPrestiges = Number(snapshot.meta?.totalPrestiges ?? 0)
  const deepestLayer = String(snapshot.run?.deepestLayer ?? 'surface')
  const awakened = snapshot.awakened ? 1 : 0

  // Upsert profile with summary stats
  await c.env.DB.prepare(`
    INSERT INTO profiles (github_user_id, username, avatar_url, echoes, total_prestiges, deepest_layer, awakened)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(github_user_id) DO UPDATE SET
      username = excluded.username,
      avatar_url = excluded.avatar_url,
      echoes = excluded.echoes,
      total_prestiges = excluded.total_prestiges,
      deepest_layer = excluded.deepest_layer,
      awakened = excluded.awakened
  `).bind(
    userId,
    user.login,
    user.avatar_url,
    echoes,
    totalPrestiges,
    deepestLayer,
    awakened,
  ).run()

  // Upsert snapshot blob
  await c.env.DB.prepare(`
    INSERT INTO colony_state (github_user_id, snapshot_data, saved_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(github_user_id) DO UPDATE SET
      snapshot_data = excluded.snapshot_data,
      saved_at = excluded.saved_at
  `).bind(
    userId,
    JSON.stringify(body.snapshot),
  ).run()

  return c.json({ ok: true })
})

/** DELETE /saves — Drop the user's cloud save (useful for manual wipes) */
saves.delete('/', async (c) => {
  const user = c.get('user')
  const userId = String(user.id)
  await c.env.DB.prepare('DELETE FROM colony_state WHERE github_user_id = ?').bind(userId).run()
  return c.json({ ok: true })
})

export { saves }

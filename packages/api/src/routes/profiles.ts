import { Hono } from 'hono'
import type { AppEnv } from '../index'

const profiles = new Hono<AppEnv>()

/** GET /profiles/me — Get current user's profile */
profiles.get('/me', async (c) => {
  const user = c.get('user')
  const userId = String(user.id)

  const row = await c.env.DB.prepare(
    'SELECT * FROM profiles WHERE github_user_id = ?',
  ).bind(userId).first()

  if (!row) {
    return c.json({
      github_user_id: userId,
      username: user.login,
      avatar_url: user.avatar_url,
      echoes: 0,
      total_prestiges: 0,
      deepest_layer: 'surface',
      awakened: false,
    })
  }

  return c.json(row)
})

/** GET /profiles/:id — Get a user's public profile */
profiles.get('/:id', async (c) => {
  const id = c.req.param('id')

  const row = await c.env.DB.prepare(
    'SELECT github_user_id, username, avatar_url, echoes, total_prestiges, deepest_layer, awakened FROM profiles WHERE github_user_id = ?',
  ).bind(id).first()

  if (!row) return c.json({ error: 'Profile not found' }, 404)
  return c.json(row)
})

export { profiles }

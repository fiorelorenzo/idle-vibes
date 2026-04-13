import { Hono } from 'hono'
import type { AppEnv } from '../index'

const leaderboards = new Hono<AppEnv>()

/** GET /leaderboards/:metric — Get top players for a metric */
leaderboards.get('/:metric', async (c) => {
  const metric = c.req.param('metric')
  const limit = Math.min(Number(c.req.query('limit') ?? 50), 100)

  let query: string
  switch (metric) {
    case 'xp':
      query = 'SELECT username, avatar_url, total_xp AS score FROM profiles ORDER BY total_xp DESC LIMIT ?'
      break
    case 'prestige':
      query = `
        SELECT p.username, p.avatar_url,
          json_extract(cs.prestige_data, '$.prestigeCount') AS score
        FROM profiles p
        JOIN colony_state cs ON cs.github_user_id = p.github_user_id
        ORDER BY score DESC LIMIT ?
      `
      break
    case 'shards':
      query = 'SELECT username, avatar_url, aria_shards AS score FROM profiles ORDER BY aria_shards DESC LIMIT ?'
      break
    default:
      return c.json({ error: `Unknown metric: ${metric}` }, 400)
  }

  const { results } = await c.env.DB.prepare(query).bind(limit).all()
  return c.json(results)
})

export { leaderboards }

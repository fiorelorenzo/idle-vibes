import { Hono } from 'hono'
import type { AppEnv } from '../index'

const leaderboards = new Hono<AppEnv>()

/** GET /leaderboards/:metric — Get top players for a metric */
leaderboards.get('/:metric', async (c) => {
  const metric = c.req.param('metric')
  const limit = Math.min(Number(c.req.query('limit') ?? 50), 100)

  let query: string
  switch (metric) {
    case 'echoes':
      query = 'SELECT username, avatar_url, echoes AS score FROM profiles ORDER BY echoes DESC LIMIT ?'
      break
    case 'prestige':
      query = 'SELECT username, avatar_url, total_prestiges AS score FROM profiles ORDER BY total_prestiges DESC LIMIT ?'
      break
    case 'depth':
      query = `
        SELECT username, avatar_url,
          CASE deepest_layer
            WHEN 'main' THEN 4
            WHEN 'abyss' THEN 3
            WHEN 'deep' THEN 2
            WHEN 'shallow' THEN 1
            ELSE 0
          END AS score
        FROM profiles
        ORDER BY score DESC LIMIT ?
      `
      break
    default:
      return c.json({ error: `Unknown metric: ${metric}` }, 400)
  }

  const { results } = await c.env.DB.prepare(query).bind(limit).all()
  return c.json(results)
})

export { leaderboards }

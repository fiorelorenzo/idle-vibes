import { Hono } from 'hono'
import type { AppEnv } from '../index'

const events = new Hono<AppEnv>()

/** GET /events — Get active global events */
events.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM global_events WHERE ends_at > datetime('now') ORDER BY starts_at DESC",
  ).all()

  return c.json(results)
})

/** GET /events/:id — Get a specific event with user's contribution */
events.get('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const event = await c.env.DB.prepare(
    'SELECT * FROM global_events WHERE id = ?',
  ).bind(id).first()

  if (!event) return c.json({ error: 'Event not found' }, 404)

  const contribution = await c.env.DB.prepare(
    'SELECT amount FROM global_event_contributions WHERE event_id = ? AND github_user_id = ?',
  ).bind(id, String(user.id)).first()

  return c.json({
    ...event,
    userContribution: contribution?.amount ?? 0,
  })
})

/** POST /events/:id/contribute — Add contribution to a global event */
events.post('/:id/contribute', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = await c.req.json()
  const amount = body.amount as number

  if (!amount || amount <= 0) {
    return c.json({ error: 'Invalid amount' }, 400)
  }

  // Upsert contribution
  await c.env.DB.prepare(`
    INSERT INTO global_event_contributions (event_id, github_user_id, amount)
    VALUES (?, ?, ?)
    ON CONFLICT(event_id, github_user_id) DO UPDATE SET
      amount = global_event_contributions.amount + excluded.amount
  `).bind(id, String(user.id), amount).run()

  // Update event progress
  await c.env.DB.prepare(
    'UPDATE global_events SET progress = progress + ? WHERE id = ?',
  ).bind(amount, id).run()

  return c.json({ ok: true })
})

export { events }

import { Hono } from 'hono'
import type { AppEnv } from '../index'

const market = new Hono<AppEnv>()

/** GET /market/listings — Get active market listings */
market.get('/listings', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM market_listings WHERE status = ? ORDER BY listed_at DESC LIMIT 100',
  ).bind('active').all()

  return c.json(results)
})

/** GET /market/listings/mine — Get current user's listings */
market.get('/listings/mine', async (c) => {
  const user = c.get('user')
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM market_listings WHERE seller_id = ? ORDER BY listed_at DESC',
  ).bind(String(user.id)).all()

  return c.json(results)
})

/** POST /market/listings — Create a new listing */
market.post('/listings', async (c) => {
  const user = c.get('user')
  const body = await c.req.json()

  const result = await c.env.DB.prepare(`
    INSERT INTO market_listings (seller_id, item_id, item_data, price)
    VALUES (?, ?, ?, ?)
    RETURNING *
  `).bind(
    String(user.id),
    body.itemId,
    JSON.stringify(body.itemData),
    body.price,
  ).first()

  return c.json(result, 201)
})

/** PATCH /market/listings/:id/cancel — Cancel own listing */
market.patch('/listings/:id/cancel', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const result = await c.env.DB.prepare(`
    UPDATE market_listings SET status = 'cancelled'
    WHERE id = ? AND seller_id = ? AND status = 'active'
  `).bind(id, String(user.id)).run()

  if (!result.meta.changes) return c.json({ error: 'Listing not found or not yours' }, 404)
  return c.json({ ok: true })
})

export { market }

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { githubAuth } from './auth/github'
import { saves } from './routes/saves'
import { profiles } from './routes/profiles'
import { market } from './routes/market'
import { events } from './routes/events'
import { leaderboards } from './routes/leaderboards'

export interface Env {
  DB: D1Database
}

export type AppEnv = {
  Bindings: Env
  Variables: { user: import('./auth/github').GitHubUser }
}

const app = new Hono<AppEnv>()

// CORS for VS Code extension requests
app.use('*', cors({ origin: '*' }))

// Health check (no auth)
app.get('/health', (c) => c.json({ ok: true }))

// All other routes require GitHub auth
app.use('*', githubAuth)

// Mount routes
app.route('/saves', saves)
app.route('/profiles', profiles)
app.route('/market', market)
app.route('/events', events)
app.route('/leaderboards', leaderboards)

export default app

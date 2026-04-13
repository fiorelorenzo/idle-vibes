import type { Context, Next } from 'hono'
import type { AppEnv } from '../index'

export interface GitHubUser {
  id: number
  login: string
  avatar_url: string
}

const tokenCache = new Map<string, { user: GitHubUser; expiresAt: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/** Verify the GitHub access token and attach the user to the context. */
export async function githubAuth(c: Context<AppEnv>, next: Next): Promise<Response | void> {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing Authorization header' }, 401)
  }

  const token = header.slice(7)

  // Check cache
  const cached = tokenCache.get(token)
  if (cached && cached.expiresAt > Date.now()) {
    c.set('user', cached.user)
    return next()
  }

  // Verify with GitHub
  const res = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'idle-vibes-api',
      'Accept': 'application/vnd.github+json',
    },
  })

  if (!res.ok) {
    return c.json({ error: 'Invalid GitHub token' }, 401)
  }

  const ghUser = (await res.json()) as GitHubUser

  // Cache the result
  tokenCache.set(token, { user: ghUser, expiresAt: Date.now() + CACHE_TTL_MS })

  // Evict old entries
  if (tokenCache.size > 1000) {
    const now = Date.now()
    for (const [key, val] of tokenCache) {
      if (val.expiresAt < now) tokenCache.delete(key)
    }
  }

  c.set('user', ghUser)
  return next()
}

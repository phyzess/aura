import { Hono } from 'hono'
import type { Env } from '@/types/env'
import { handleGetMe } from '@/handlers/user/me.handler'
import { handlePull } from '@/handlers/sync/pull.handler'
import { handlePush } from '@/handlers/sync/push.handler'

export const createAppRoutes = () => {
  const app = new Hono<{ Bindings: Env }>()
  
  app.get('/me', handleGetMe)
  app.post('/sync/pull', handlePull)
  app.post('/sync/push', handlePush)
  
  return app
}


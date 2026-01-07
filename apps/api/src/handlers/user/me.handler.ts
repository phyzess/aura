import type { Context } from 'hono'
import type { User as DomainUser } from '@aura/domain'
import type { Env } from '@/types/env'
import { createAuth } from '@/auth'
import { toMillis } from '@/utils/date'

const buildUserResponse = (user: any): DomainUser => ({
  id: user.id,
  email: user.email,
  name: user.name ?? user.email,
  createdAt: toMillis(user.createdAt),
  updatedAt: toMillis(user.updatedAt)
})

export const handleGetMe = async (c: Context<{ Bindings: Env }>) => {
  const auth = createAuth(c.env, c.req.raw.cf)
  
  const session = await auth.api.getSession({
    headers: c.req.raw.headers
  })
  
  if (!session?.user) {
    return c.json({ user: null })
  }
  
  const user = buildUserResponse(session.user)
  
  return c.json<{ user: DomainUser | null }>({ user })
}


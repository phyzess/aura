import { Hono } from 'hono'
import type { Env } from '@/types/env'
import { createAuth } from '@/auth'
import { generateVerificationCode, generateVerificationEmailHTML, sendEmail } from '@/auth/email'
import { verifyTurnstile } from '@/auth/turnstile'

export const createAuthRoutes = () => {
  const app = new Hono<{ Bindings: Env }>()
  
  app.post('/verify-turnstile', async (c) => {
    const body = await c.req.json().catch(() => null) as {
      token?: string
    } | null
    
    if (!body || typeof body.token !== 'string') {
      return c.json({ error: 'Missing turnstile token' }, 400)
    }
    
    const secretKey = c.env.TURNSTILE_SECRET_KEY
    if (!secretKey) {
      return c.json({ success: true })
    }
    
    const remoteIp = c.req.header('CF-Connecting-IP')
    const result = await verifyTurnstile(body.token, secretKey, remoteIp)
    
    if (!result.success) {
      return c.json({ error: result.error || 'Verification failed' }, 400)
    }
    
    return c.json({ success: true })
  })
  
  app.post('/email/send-code', async (c) => {
    const body = await c.req.json().catch(() => null) as {
      email?: string
    } | null
    
    if (!body || typeof body.email !== 'string' || !body.email.includes('@')) {
      return c.json({ error: 'Invalid email address' }, 400)
    }
    
    const email = body.email.toLowerCase().trim()
    const code = generateVerificationCode()
    
    await c.env.AUTH_KV.put(`email-verify:${email}`, code, {
      expirationTtl: 600
    })
    
    const emailResult = await sendEmail({
      to: email,
      subject: 'Verify your email - Aura',
      html: generateVerificationEmailHTML(code)
    })
    
    if (!emailResult.success) {
      return c.json({ error: emailResult.error || 'Failed to send email' }, 500)
    }
    
    return c.json({ success: true })
  })
  
  app.post('/email/verify-code', async (c) => {
    const body = await c.req.json().catch(() => null) as {
      email?: string
      code?: string
    } | null
    
    if (
      !body ||
      typeof body.email !== 'string' ||
      typeof body.code !== 'string'
    ) {
      return c.json({ error: 'Invalid request' }, 400)
    }
    
    const email = body.email.toLowerCase().trim()
    const storedCode = await c.env.AUTH_KV.get(`email-verify:${email}`)
    
    if (!storedCode || storedCode !== body.code) {
      return c.json({ error: 'Invalid or expired verification code' }, 400)
    }
    
    await c.env.AUTH_KV.delete(`email-verify:${email}`)
    
    return c.json({ success: true, email })
  })
  
  app.on('GET', '/*', (c) => {
    const auth = createAuth(c.env, c.req.raw.cf)
    return auth.handler(c.req.raw)
  })
  
  app.on('POST', '/*', (c) => {
    const auth = createAuth(c.env, c.req.raw.cf)
    return auth.handler(c.req.raw)
  })
  
  return app
}


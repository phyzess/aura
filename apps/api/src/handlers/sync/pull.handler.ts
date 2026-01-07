import type { Context } from 'hono'
import type { SyncPayload } from '@aura/domain'
import type { Env } from '@/types/env'
import { createAuth } from '@/auth'
import { createDb } from '@/db'
import { createWorkspaceData } from '@/data/workspace.data'
import { createCollectionData } from '@/data/collection.data'
import { createTabData } from '@/data/tab.data'

const buildSyncResponse = (
  workspaces: any[],
  collections: any[],
  tabs: any[]
): SyncPayload => ({
  workspaces,
  collections,
  tabs,
  lastSyncTimestamp: Date.now()
})

export const handlePull = async (c: Context<{ Bindings: Env }>) => {
  const auth = createAuth(c.env, c.req.raw.cf)
  
  const session = await auth.api.getSession({
    headers: c.req.raw.headers
  })
  
  if (!session?.user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  const body = await c.req.json().catch(() => null) as {
    lastSyncTimestamp?: unknown
  } | null
  
  const lastSyncRaw = body && typeof body === 'object' 
    ? body.lastSyncTimestamp 
    : undefined
    
  const lastSyncTimestamp = 
    typeof lastSyncRaw === 'number' && Number.isFinite(lastSyncRaw)
      ? lastSyncRaw
      : 0
  
  const userId = session.user.id
  const db = createDb(c.env.DB)
  
  const workspaceData = createWorkspaceData(db)
  const collectionData = createCollectionData(db)
  const tabData = createTabData(db)
  
  const [workspaces, collections, tabs] = await Promise.all([
    workspaceData.findByUserId(userId, lastSyncTimestamp),
    collectionData.findByUserId(userId, lastSyncTimestamp),
    tabData.findByUserId(userId, lastSyncTimestamp)
  ])
  
  const response = buildSyncResponse(workspaces, collections, tabs)
  
  console.log('[sync/pull] response summary', {
    userId,
    workspacesCount: workspaces.length,
    collectionsCount: collections.length,
    tabsCount: tabs.length,
    lastSyncTimestamp: response.lastSyncTimestamp
  })
  
  return c.json(response)
}


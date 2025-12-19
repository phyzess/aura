import { atom } from 'jotai'
import { workspacesAtom, activeWorkspaceIdAtom } from './atoms'

export const activeWorkspaceAtom = atom((get) => {
  const workspaces = get(workspacesAtom)
  const activeId = get(activeWorkspaceIdAtom)
  return workspaces.find((w) => w.id === activeId) || null
})


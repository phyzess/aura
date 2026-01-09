import { atom } from "jotai";
import type { Workspace } from "@/types";

export const workspacesAtom = atom<Workspace[]>([]);
export const activeWorkspaceIdAtom = atom<string | null>(null);


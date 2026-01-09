import { atom } from "jotai";
import type { StateCommit } from "@/types/history";

export const historyCommitsAtom = atom<Map<string, StateCommit>>(new Map());
export const historyHeadAtom = atom<string | null>(null);
export const historyChildrenAtom = atom<Map<string | null, string>>(new Map());

export const canUndoAtom = atom((get) => {
	const head = get(historyHeadAtom);
	if (!head) return false;

	const commits = get(historyCommitsAtom);
	const currentCommit = commits.get(head);
	return !!currentCommit?.parentHash;
});

export const canRedoAtom = atom((get) => {
	const head = get(historyHeadAtom);
	const children = get(historyChildrenAtom);

	return !!children.get(head);
});


import { atom } from "jotai";
import type { User } from "@/types";

export const currentUserAtom = atom<User | null>(null);
export const authStatusAtom = atom<"idle" | "signingOut">("idle");
export const authErrorAtom = atom<string | null>(null);

import { atom } from "jotai";
import type { Collection } from "@/types";

export const collectionsAtom = atom<Collection[]>([]);


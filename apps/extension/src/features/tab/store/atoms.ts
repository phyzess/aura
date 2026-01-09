import { atom } from "jotai";
import type { TabItem } from "@/types";

export const tabsAtom = atom<TabItem[]>([]);


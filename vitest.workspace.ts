import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
	"packages/shared",
	"packages/domain",
	"apps/api",
	"apps/extension",
]);


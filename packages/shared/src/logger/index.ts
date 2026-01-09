/**
 * Shared logger module based on LogTape
 * Re-exports LogTape core functionality and provides utilities
 */

export type { Logger, LogRecord, Sink } from "@logtape/logtape";
export { configure, getConsoleSink, getLogger } from "@logtape/logtape";

export * from "./types";
export * from "./utils";

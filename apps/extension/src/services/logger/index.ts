/**
 * Logger service for Extension
 * Configures LogTape with console and IndexedDB sinks
 */

export { getIndexedDBSink, getAllLogs, getLogs, getLogStats, clearAllLogs } from "./indexeddb";
export { exportLogs, formatLogSize, formatTimestamp } from "./export";


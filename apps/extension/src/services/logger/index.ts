/**
 * Logger service for Extension
 * Configures LogTape with console and IndexedDB sinks
 */

export { exportLogs, formatLogSize, formatTimestamp } from "./export";
export {
	clearAllLogs,
	getAllLogs,
	getIndexedDBSink,
	getLogStats,
	getLogs,
} from "./indexeddb";

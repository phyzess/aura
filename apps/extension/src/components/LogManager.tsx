/**
 * Log Manager Component
 * Provides UI for viewing, exporting, and clearing logs
 */

import type { LogStats } from "@aura/shared/logger";
import { useEffect, useState } from "react";
import { errorLogger } from "@/config/logger";
import {
	clearAllLogs,
	exportLogs,
	formatLogSize,
	formatTimestamp,
	getLogStats,
} from "@/services/logger";

export function LogManager() {
	const [stats, setStats] = useState<LogStats | null>(null);
	const [loading, setLoading] = useState(false);

	const loadStats = async () => {
		try {
			const logStats = await getLogStats();
			setStats(logStats);
		} catch (error) {
			errorLogger.error("Failed to load log stats", { error });
		}
	};

	useEffect(() => {
		loadStats();
	}, []);

	const handleExport = async () => {
		setLoading(true);
		try {
			await exportLogs();
		} catch (error) {
			errorLogger.error("Failed to export logs", { error });
		} finally {
			setLoading(false);
		}
	};

	const handleClear = async () => {
		if (!confirm("Are you sure you want to clear all logs?")) {
			return;
		}

		setLoading(true);
		try {
			await clearAllLogs();
			await loadStats();
		} catch (error) {
			errorLogger.error("Failed to clear logs", { error });
		} finally {
			setLoading(false);
		}
	};

	if (!stats) {
		return <div>Loading...</div>;
	}

	return (
		<div className="space-y-4 p-4 border rounded-lg">
			<h3 className="text-lg font-semibold">Developer Tools - Logs</h3>

			<div className="grid grid-cols-2 gap-4">
				<div>
					<p className="text-sm text-gray-600">Total Logs</p>
					<p className="text-2xl font-bold">{stats.total}</p>
				</div>
				<div>
					<p className="text-sm text-gray-600">Storage Size</p>
					<p className="text-2xl font-bold">
						{formatLogSize(stats.sizeInBytes || 0)}
					</p>
				</div>
			</div>

			{stats.total > 0 && (
				<div>
					<p className="text-sm text-gray-600 mb-2">Logs by Level</p>
					<div className="space-y-1">
						{Object.entries(stats.byLevel).map(([level, count]) => (
							<div key={level} className="flex justify-between text-sm">
								<span className="capitalize">{level}</span>
								<span className="font-mono">{count}</span>
							</div>
						))}
					</div>
				</div>
			)}

			{stats.oldestTimestamp && stats.newestTimestamp && (
				<div className="text-xs text-gray-500">
					<p>Oldest: {formatTimestamp(stats.oldestTimestamp)}</p>
					<p>Newest: {formatTimestamp(stats.newestTimestamp)}</p>
				</div>
			)}

			<div className="flex gap-2">
				<button
					type="button"
					onClick={handleExport}
					disabled={loading || stats.total === 0}
					className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
				>
					📥 Export Logs
				</button>
				<button
					type="button"
					onClick={handleClear}
					disabled={loading || stats.total === 0}
					className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
				>
					🗑️ Clear Logs
				</button>
			</div>

			<p className="text-xs text-gray-500">
				Logs are stored locally and automatically limited to 1000 entries.
			</p>
		</div>
	);
}

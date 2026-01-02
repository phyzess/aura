export interface ChangelogEntry {
	version: string;
	date?: string;
	changes: {
		type: "Major" | "Minor" | "Patch";
		items: string[];
	}[];
}

export function parseChangelog(markdown: string): ChangelogEntry[] {
	const entries: ChangelogEntry[] = [];
	const lines = markdown.split("\n");

	let currentEntry: ChangelogEntry | null = null;
	let currentType: string | null = null;
	let currentItems: string[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();

		// ## 1.2.0
		if (line.startsWith("## ")) {
			// Save previous entry
			if (currentEntry && currentType && currentItems.length > 0) {
				currentEntry.changes.push({
					type: currentType as any,
					items: [...currentItems],
				});
			}
			if (currentEntry) {
				entries.push(currentEntry);
			}

			// Start new entry
			const versionMatch = line.match(/##\s+([\d.]+)/);
			if (versionMatch) {
				currentEntry = {
					version: versionMatch[1],
					changes: [],
				};
				currentType = null;
				currentItems = [];
			}
		}
		// ### Minor Changes
		else if (line.startsWith("### ")) {
			// Save previous type
			if (currentEntry && currentType && currentItems.length > 0) {
				currentEntry.changes.push({
					type: currentType as any,
					items: [...currentItems],
				});
			}

			// Start new type
			const typeMatch = line.match(/###\s+(\w+)\s+Changes/);
			if (typeMatch) {
				currentType = typeMatch[1];
				currentItems = [];
			}
		}
		// - Feature item
		else if (line.startsWith("- ") && currentEntry && currentType) {
			const item = line.substring(2).trim();
			if (item) {
				currentItems.push(item);
			}
		}
		// Nested list items (indented with spaces or tabs)
		else if (
			(line.startsWith("  - ") || line.startsWith("\t- ")) &&
			currentItems.length > 0
		) {
			const item = line.replace(/^\s+- /, "").trim();
			if (item) {
				// Append to last item
				currentItems[currentItems.length - 1] += ` ${item}`;
			}
		}
	}

	// Save last entry
	if (currentEntry && currentType && currentItems.length > 0) {
		currentEntry.changes.push({
			type: currentType as any,
			items: [...currentItems],
		});
	}
	if (currentEntry) {
		entries.push(currentEntry);
	}

	return entries;
}


import type React from "react";

interface HighlightTextProps {
	text: string;
	query: string;
	className?: string;
	highlightClassName?: string;
}

export const HighlightText: React.FC<HighlightTextProps> = ({
	text,
	query,
	className = "",
	highlightClassName = "bg-accent/20 text-accent font-semibold rounded px-0.5",
}) => {
	if (!query.trim()) {
		return <span className={className}>{text}</span>;
	}

	const parts: Array<{ text: string; isHighlight: boolean }> = [];
	const lowerText = text.toLowerCase();
	const lowerQuery = query.toLowerCase();

	let lastIndex = 0;
	let index = lowerText.indexOf(lowerQuery);

	while (index !== -1) {
		// Add text before match
		if (index > lastIndex) {
			parts.push({
				text: text.substring(lastIndex, index),
				isHighlight: false,
			});
		}

		// Add matched text
		parts.push({
			text: text.substring(index, index + query.length),
			isHighlight: true,
		});

		lastIndex = index + query.length;
		index = lowerText.indexOf(lowerQuery, lastIndex);
	}

	// Add remaining text
	if (lastIndex < text.length) {
		parts.push({
			text: text.substring(lastIndex),
			isHighlight: false,
		});
	}

	return (
		<span className={className}>
			{parts.map((part, i) =>
				part.isHighlight ? (
					<mark key={i} className={highlightClassName}>
						{part.text}
					</mark>
				) : (
					<span key={i}>{part.text}</span>
				),
			)}
		</span>
	);
};

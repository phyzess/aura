import type React from "react";

export const AuraLogo: React.FC<{ className?: string; size?: number }> = ({
	className,
	size,
}) => (
	<img
		src="/icon.svg"
		alt="Aura logo"
		className={className}
		width={size}
		height={size}
	/>
);

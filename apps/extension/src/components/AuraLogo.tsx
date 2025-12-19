import type React from "react";

export const AuraLogo: React.FC<{ className?: string }> = ({ className }) => (
	<img src="/icon.svg" alt="Aura logo" className={className} />
);

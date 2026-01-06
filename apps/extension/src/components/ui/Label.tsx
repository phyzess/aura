import * as React from "react";
import { cn } from "@/lib/utils";

export interface LabelProps
	extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
	({ className, ...props }, ref) => {
		const baseClass =
			"block text-[11px] font-semibold text-secondary mb-1 ml-0.5";

		const classes = cn(baseClass, className);

		return <label ref={ref} className={classes} {...props} />;
	},
);

Label.displayName = "Label";

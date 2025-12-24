import * as React from "react";
import { cn } from "@/lib/utils";

export type StackGap = "none" | "xs" | "sm" | "md" | "lg";

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
	direction?: "row" | "column";
	gap?: StackGap;
	align?: "start" | "center" | "end";
	justify?: "start" | "center" | "end" | "between";
}

const directionClassName: Record<NonNullable<StackProps["direction"]>, string> = {
	row: "flex-row",
	column: "flex-col",
};

const gapClassName: Record<StackGap, string> = {
	none: "",
	xs: "gap-1",
	sm: "gap-2",
	md: "gap-3",
	lg: "gap-4",
};

const alignClassName: Record<NonNullable<StackProps["align"]>, string> = {
	start: "items-start",
	center: "items-center",
	end: "items-end",
};

const justifyClassName: Record<NonNullable<StackProps["justify"]>, string> = {
	start: "justify-start",
	center: "justify-center",
	end: "justify-end",
	between: "justify-between",
};

export const Stack: React.FC<StackProps> = ({
	direction = "row",
	gap = "sm",
	align = "center",
	justify = "start",
	className,
	...props
}) => {
	return (
		<div
			className={cn(
				"flex",
				directionClassName[direction],
				gapClassName[gap],
				alignClassName[align],
				justifyClassName[justify],
				className,
			)}
			{...props}
		/>
	);
};

export type HStackProps = Omit<StackProps, "direction">;
export type VStackProps = Omit<StackProps, "direction">;

export const HStack: React.FC<HStackProps> = (props) => {
	return <Stack direction="row" {...props} />;
};

export const VStack: React.FC<VStackProps> = (props) => {
	return <Stack direction="column" {...props} />;
};


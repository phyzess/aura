import { motion } from "motion/react";
import * as React from "react";
import {
	Children,
	cloneElement,
	createContext,
	isValidElement,
	useContext,
	useState,
} from "react";
import type { PopoverAlign, PopoverPosition } from "react-tiny-popover";
import { Popover } from "@/components/ui/Popover";
import {
	menuSwingDropVariants,
	menuSwingTransition,
	menuSwingUpVariants,
} from "@/config/animations";
import { cn } from "@/lib/utils";

interface MenuContextValue {
	closeMenu: () => void;
}

const MenuContext = createContext<MenuContextValue | undefined>(undefined);

const useMenuContext = () => {
	const context = useContext(MenuContext);
	if (!context) {
		throw new Error("Menu.Item must be used within a Menu");
	}
	return context;
};

interface MenuProps {
	children: React.ReactNode;
	positions?: PopoverPosition[];
	align?: PopoverAlign;
	contentClassName?: string;
	contentWidth?: string;
}

const MenuRoot: React.FC<MenuProps> = ({
	children,
	positions = ["bottom"],
	align = "end",
	contentClassName,
	contentWidth = "w-52",
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const closeMenu = () => setIsOpen(false);

	// Separate trigger and content from children
	let trigger: React.ReactNode = null;
	const contentParts: React.ReactNode[] = [];

	Children.forEach(children, (child) => {
		if (isValidElement(child)) {
			if (
				child.type === MenuContent ||
				child.type === MenuHeader ||
				child.type === MenuSeparator
			) {
				contentParts.push(child);
			} else if (child.type === React.Fragment) {
				// Handle fragments (e.g., <><Menu.Header /><Menu.Separator /></>)
				Children.forEach(child.props.children, (fragmentChild) => {
					if (isValidElement(fragmentChild)) {
						if (
							fragmentChild.type === MenuContent ||
							fragmentChild.type === MenuHeader ||
							fragmentChild.type === MenuSeparator
						) {
							contentParts.push(fragmentChild);
						}
					}
				});
			} else {
				trigger = child;
			}
		}
	});

	const handleTriggerClick = (e: React.MouseEvent) => {
		if (isValidElement(trigger) && trigger.props.onClick) {
			trigger.props.onClick(e);
		}
		setIsOpen(!isOpen);
	};

	const triggerElement = isValidElement(trigger)
		? cloneElement(trigger as React.ReactElement, {
				onClick: handleTriggerClick,
			})
		: trigger;

	// 根据 Menu 位置选择动画变体和变换原点
	const primaryPosition = positions[0];
	const variants =
		primaryPosition === "top" ? menuSwingUpVariants : menuSwingDropVariants;

	// 根据 positions 和 align 确定变换原点
	const verticalOrigin = primaryPosition === "top" ? "bottom" : "top";
	const horizontalOrigin =
		align === "start" ? "left" : align === "end" ? "right" : "center";
	const transformOrigin = `${verticalOrigin} ${horizontalOrigin}`;

	return (
		<MenuContext.Provider value={{ closeMenu }}>
			<Popover
				isOpen={isOpen}
				onClickOutside={closeMenu}
				positions={positions}
				align={align}
				containerClassName="z-200"
				disableWrapper
				content={
					<motion.div
						key={isOpen ? "open" : "closed"}
						variants={variants}
						initial="hidden"
						animate="visible"
						exit="exit"
						transition={menuSwingTransition}
						style={{ transformOrigin }}
						className={cn(
							"bg-surface-elevated rounded-2xl shadow-lg overflow-hidden",
							contentWidth,
							contentClassName,
						)}
					>
						{contentParts}
					</motion.div>
				}
			>
				{triggerElement}
			</Popover>
		</MenuContext.Provider>
	);
};

interface MenuContentProps {
	children: React.ReactNode;
}

const MenuContent: React.FC<MenuContentProps> = ({ children }) => {
	return <div className="p-1.5 flex flex-col gap-0.5">{children}</div>;
};

interface MenuHeaderProps {
	children: React.ReactNode;
	className?: string;
}

const MenuHeader: React.FC<MenuHeaderProps> = ({ children, className }) => {
	return <div className={cn("px-4 py-2.5", className)}>{children}</div>;
};

interface MenuItemProps {
	children: React.ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	variant?: "default" | "danger";
	icon?: React.ReactNode;
	className?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({
	children,
	onClick,
	disabled = false,
	variant = "default",
	icon,
	className,
}) => {
	const { closeMenu } = useMenuContext();

	const handleClick = () => {
		if (disabled) return;
		onClick?.();
		closeMenu();
	};

	const variantClasses =
		variant === "danger"
			? "text-danger hover:bg-danger-soft"
			: "text-secondary hover:bg-surface-muted hover:text-accent";

	return (
		<button
			type="button"
			onClick={handleClick}
			disabled={disabled}
			className={cn(
				"w-full flex items-center gap-2 px-3 py-2 text-body font-semibold rounded-lg transition-colors text-left justify-start",
				variantClasses,
				disabled && "opacity-50 cursor-not-allowed",
				className,
			)}
		>
			{icon && <span className="shrink-0">{icon}</span>}
			<span>{children}</span>
		</button>
	);
};

const MenuSeparator: React.FC = () => {
	return <div className="h-px bg-surface-muted my-1 mx-1" />;
};

export const Menu = Object.assign(MenuRoot, {
	Content: MenuContent,
	Item: MenuItem,
	Separator: MenuSeparator,
	Header: MenuHeader,
});

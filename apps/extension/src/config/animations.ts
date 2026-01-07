/**
 * 统一的动画配置系统
 * 基于 Motion (原 Framer Motion) 的动画变体和过渡配置
 */

import type { Transition, Variants } from "motion/react";

// ========== 无障碍支持 ==========
/**
 * 检测用户是否偏好减少动画
 * 支持 prefers-reduced-motion 媒体查询
 */
export const prefersReducedMotion = (): boolean => {
	if (typeof window === "undefined") return false;
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * 根据用户偏好返回动画时长
 * 如果用户偏好减少动画,返回 0
 */
export const getAnimationDuration = (duration: number): number => {
	return prefersReducedMotion() ? 0 : duration;
};

// ========== 动画时长 ==========
export const DURATIONS = {
	fast: 0.15,
	normal: 0.25,
	slow: 0.35,
	verySlow: 0.5,
} as const;

// ========== 缓动函数 ==========
export const EASINGS = {
	// 标准缓动
	smooth: [0.22, 1, 0.36, 1] as const,
	// 弹性缓动
	bounce: [0.34, 1.56, 0.64, 1] as const,
	// 快速进入
	easeOut: [0, 0, 0.2, 1] as const,
	// 快速退出
	easeIn: [0.4, 0, 1, 1] as const,
} as const;

// ========== 弹簧配置 ==========
export const SPRINGS = {
	// 柔和弹簧
	soft: {
		type: "spring" as const,
		damping: 25,
		stiffness: 300,
	},
	// 标准弹簧
	default: {
		type: "spring" as const,
		damping: 20,
		stiffness: 400,
	},
	// 强劲弹簧
	snappy: {
		type: "spring" as const,
		damping: 15,
		stiffness: 500,
	},
} as const;

// ========== 通用过渡配置 ==========
export const TRANSITIONS = {
	fast: {
		duration: DURATIONS.fast,
		ease: EASINGS.smooth,
	},
	normal: {
		duration: DURATIONS.normal,
		ease: EASINGS.smooth,
	},
	slow: {
		duration: DURATIONS.slow,
		ease: EASINGS.smooth,
	},
	spring: SPRINGS.default,
	springFast: SPRINGS.snappy,
	springSlow: SPRINGS.soft,
} as const satisfies Record<string, Transition>;

// ========== 动画变体 ==========

/**
 * 淡入淡出
 */
export const fadeVariants: Variants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1 },
	exit: { opacity: 0 },
};

/**
 * 从下方滑入
 */
export const slideUpVariants: Variants = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: 20 },
};

/**
 * 从右侧滑入 (Drawer)
 */
export const slideRightVariants: Variants = {
	hidden: { x: "100%" },
	visible: { x: 0 },
	exit: { x: "100%" },
};

/**
 * 从左侧滑入
 */
export const slideLeftVariants: Variants = {
	hidden: { x: "-100%" },
	visible: { x: 0 },
	exit: { x: "-100%" },
};

/**
 * 缩放 + 淡入 (Modal)
 */
export const scaleVariants: Variants = {
	hidden: { opacity: 0, scale: 0.95 },
	visible: { opacity: 1, scale: 1 },
	exit: { opacity: 0, scale: 0.95 },
};

/**
 * 列表项交错动画
 */
export const staggerContainerVariants: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.05,
			delayChildren: 0.1,
		},
	},
};

export const staggerItemVariants: Variants = {
	hidden: { opacity: 0, y: 10 },
	visible: { opacity: 1, y: 0 },
};

/**
 * 卡片悬停效果
 */
export const cardHoverVariants = {
	rest: { y: 0, scale: 1 },
	hover: { y: -2, scale: 1.01 },
	tap: { scale: 0.98 },
} as const;

// ========== 组合配置 ==========

/**
 * Drawer 完整配置
 */
export const drawerAnimation = {
	variants: slideRightVariants,
	transition: TRANSITIONS.spring,
	initial: "hidden" as const,
	animate: "visible" as const,
	exit: "exit" as const,
};

/**
 * Modal 完整配置
 */
export const modalAnimation = {
	variants: scaleVariants,
	transition: TRANSITIONS.normal,
	initial: "hidden" as const,
	animate: "visible" as const,
	exit: "exit" as const,
};

/**
 * 遮罩层配置
 */
export const overlayAnimation = {
	variants: fadeVariants,
	transition: { duration: DURATIONS.fast },
	initial: "hidden" as const,
	animate: "visible" as const,
	exit: "exit" as const,
};

/**
 * Menu 摆动下落动画 (从上往下，以顶部为轴心摆动)
 */
export const menuSwingDropVariants: Variants = {
	hidden: { opacity: 0, y: -20, rotateZ: -12 },
	visible: { opacity: 1, y: 0, rotateZ: 0 },
	exit: { opacity: 0, y: -10, rotateZ: -6 },
};

/**
 * Menu 摆动弹起动画 (从下往上，以底部为轴心摆动)
 */
export const menuSwingUpVariants: Variants = {
	hidden: { opacity: 0, y: 20, rotateZ: 12 },
	visible: { opacity: 1, y: 0, rotateZ: 0 },
	exit: { opacity: 0, y: 10, rotateZ: 6 },
};

/**
 * Menu 弹簧配置 (低阻尼，产生摆动效果)
 */
export const menuSwingTransition: Transition = {
	type: "spring",
	damping: 10,
	stiffness: 180,
	mass: 0.9,
};

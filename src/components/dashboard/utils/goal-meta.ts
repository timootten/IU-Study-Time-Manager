import {
	FileText,
	GraduationCap,
	type LucideIcon,
	Presentation,
	Target,
} from "lucide-react";

import type { GoalCategory } from "#/lib/server/study-manager";

export const GOAL_CATEGORIES: {
	value: GoalCategory;
	label: string;
	icon: LucideIcon;
}[] = [
	{ value: "exam", label: "Exam", icon: GraduationCap },
	{ value: "project", label: "Project", icon: FileText },
	{ value: "presentation", label: "Presentation", icon: Presentation },
	{ value: "other", label: "Other", icon: Target },
];

export const CATEGORY_COLORS: Record<
	string,
	{ bg: string; text: string; dot: string; border: string }
> = {
	exam: {
		bg: "bg-amber-500/10",
		text: "text-amber-700 dark:text-amber-300",
		dot: "bg-amber-500",
		border: "border-amber-500/25",
	},
	project: {
		bg: "bg-emerald-500/10",
		text: "text-emerald-700 dark:text-emerald-300",
		dot: "bg-emerald-500",
		border: "border-emerald-500/25",
	},
	presentation: {
		bg: "bg-purple-500/10",
		text: "text-purple-700 dark:text-purple-300",
		dot: "bg-purple-500",
		border: "border-purple-500/25",
	},
	other: {
		bg: "bg-gray-500/10",
		text: "text-gray-700 dark:text-gray-300",
		dot: "bg-gray-500",
		border: "border-gray-500/25",
	},
};

export const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
	active: {
		bg: "bg-emerald-500/12",
		text: "text-emerald-700 dark:text-emerald-300",
	},
	paused: {
		bg: "bg-amber-500/12",
		text: "text-amber-700 dark:text-amber-300",
	},
	completed: {
		bg: "bg-violet-500/12",
		text: "text-violet-700 dark:text-violet-300",
	},
	failed: {
		bg: "bg-rose-500/12",
		text: "text-rose-700 dark:text-rose-300",
	},
};

export function getCategoryMeta(category: GoalCategory) {
	return (
		GOAL_CATEGORIES.find((c) => c.value === category) ?? GOAL_CATEGORIES[3]
	);
}

export function daysRemaining(endIso: string) {
	const diff = new Date(endIso).getTime() - Date.now();
	return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

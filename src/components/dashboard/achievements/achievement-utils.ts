import { CATEGORY_COLORS } from "#/components/dashboard/utils/goal-meta";

export function getAchievementCategoryColors(category: string) {
	return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.other;
}

export function formatAchievementDateTime(iso: string) {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(iso));
}

type GradeEntry = {
	grade: string;
	min: number;
	max: number;
	mid: number;
	label: string;
};

const GRADE_TABLE: GradeEntry[] = [
	{ grade: "1.0", min: 96, max: 100, mid: 98, label: "sehr gut" },
	{ grade: "1.3", min: 91, max: 95.9, mid: 93, label: "sehr gut" },
	{ grade: "1.7", min: 86, max: 90.9, mid: 88, label: "gut" },
	{ grade: "2.0", min: 81, max: 85.9, mid: 83, label: "gut" },
	{ grade: "2.3", min: 76, max: 80.9, mid: 78, label: "gut" },
	{ grade: "2.7", min: 71, max: 75.9, mid: 73, label: "befriedigend" },
	{ grade: "3.0", min: 66, max: 70.9, mid: 68, label: "befriedigend" },
	{ grade: "3.3", min: 61, max: 65.9, mid: 63, label: "befriedigend" },
	{ grade: "3.7", min: 56, max: 60.9, mid: 58, label: "ausreichend" },
	{ grade: "4.0", min: 50, max: 55.9, mid: 53, label: "ausreichend" },
	{ grade: "5.0", min: 0, max: 49.9, mid: 25, label: "nicht ausreichend" },
];

export function gradeToPoints(grade: string): number | null {
	const entry = GRADE_TABLE.find((e) => e.grade === grade);
	return entry ? entry.mid : null;
}

export function pointsToGrade(points: number): string | null {
	for (const entry of GRADE_TABLE) {
		if (points >= entry.min && points <= entry.max) {
			return entry.grade;
		}
	}
	return null;
}

export function getGradeLabel(grade: string): string | null {
	const entry = GRADE_TABLE.find((e) => e.grade === grade);
	return entry?.label ?? null;
}

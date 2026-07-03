import { Star } from "lucide-react";

import {
	formatAchievementDateTime,
	getAchievementCategoryColors,
	getGradeLabel,
} from "#/components/dashboard/achievements/achievement-utils";
import { getCategoryMeta } from "#/components/dashboard/utils/goal-meta";
import type { StudyAchievementView } from "#/lib/server/study-manager";

type AchievementCardProps = {
	achievement: StudyAchievementView;
	onSelect: (achievement: StudyAchievementView) => void;
};

export default function AchievementCard({
	achievement,
	onSelect,
}: AchievementCardProps) {
	const cat = getCategoryMeta(achievement.category);
	const catColors = getAchievementCategoryColors(achievement.category);
	const CatIcon = cat.icon;
	const gradeLabel = achievement.grade
		? getGradeLabel(achievement.grade)
		: null;

	return (
		<button
			type="button"
			onClick={() => onSelect(achievement)}
			className="group flex flex-col rounded-2xl border border-(--line) bg-(--surface-strong) p-4 text-left transition hover:border-(--brand)/30 hover:shadow-md cursor-pointer sm:p-5"
		>
			<div className="mb-3 flex items-center justify-between">
				<span
					className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${catColors.bg} ${catColors.text} ${catColors.border}`}
				>
					<CatIcon size={12} />
					{cat.label}
				</span>
			</div>

			<h3 className="text-sm font-bold text-(--sea-ink)">
				{achievement.goalTitle ?? achievement.name ?? "Achievement"}
			</h3>

			{achievement.goalTitle && achievement.name && (
				<p className="mt-0.5 text-xs text-(--sea-ink-soft)">
					{achievement.name}
				</p>
			)}

			{(achievement.grade || achievement.points !== null) && (
				<div className="mt-2 flex items-center gap-3">
					{achievement.grade && (
						<span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
							<Star size={11} />
							{achievement.grade}
						</span>
					)}
					{achievement.points !== null && (
						<span className="text-xs font-semibold text-(--sea-ink-soft)">
							{achievement.points}%
						</span>
					)}
					{gradeLabel && (
						<span className="text-[11px] italic text-(--sea-ink-soft)">
							{gradeLabel}
						</span>
					)}
				</div>
			)}

			{achievement.notes && (
				<p className="mt-2 line-clamp-2 whitespace-pre-line text-xs text-(--sea-ink-soft)">
					{achievement.notes}
				</p>
			)}

			<div className="mt-auto pt-3 text-[11px] text-(--sea-ink-soft)">
				{formatAchievementDateTime(achievement.achievedAtIso)}
			</div>
		</button>
	);
}

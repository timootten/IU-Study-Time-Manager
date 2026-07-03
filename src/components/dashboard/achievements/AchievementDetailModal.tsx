import { Pencil, Star, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
	formatAchievementDateTime,
	getAchievementCategoryColors,
	getGradeLabel,
} from "#/components/dashboard/achievements/achievement-utils";
import DashboardModal from "#/components/dashboard/ui/DashboardModal";
import { getCategoryMeta } from "#/components/dashboard/utils/goal-meta";
import type { StudyAchievementView } from "#/lib/server/study-manager";

type AchievementDetailModalProps = {
	achievement: StudyAchievementView;
	onClose: () => void;
	onEdit: () => void;
	onDelete: () => void;
};

export default function AchievementDetailModal({
	achievement,
	onClose,
	onEdit,
	onDelete,
}: AchievementDetailModalProps) {
	const { t } = useTranslation();
	const cat = getCategoryMeta(achievement.category);
	const catColors = getAchievementCategoryColors(achievement.category);
	const CatIcon = cat.icon;
	const gradeLabel = achievement.grade
		? getGradeLabel(achievement.grade)
		: null;

	return (
		<DashboardModal
			open
			title={
				achievement.goalTitle ??
				achievement.name ??
				t("achievements.detail.fallbackTitle")
			}
			onClose={onClose}
			footer={
				<div className="flex items-center justify-between">
					<button
						type="button"
						onClick={onDelete}
						className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 cursor-pointer"
					>
						<Trash2 size={13} />
						{t("achievements.detail.deleteBtn")}
					</button>
					<button
						type="button"
						onClick={onEdit}
						className="inline-flex items-center gap-1.5 rounded-lg bg-(--brand) px-4 py-2 text-xs font-bold text-white hover:opacity-90 cursor-pointer"
					>
						<Pencil size={13} />
						{t("achievements.detail.editBtn")}
					</button>
				</div>
			}
		>
			<div className="space-y-5">
				<div className="flex flex-wrap items-center gap-2">
					<span
						className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${catColors.bg} ${catColors.text} ${catColors.border}`}
					>
						<CatIcon size={12} />
						{t(`goals.category.${achievement.category}`)}
					</span>
				</div>

				{achievement.goalTitle && achievement.name && (
					<div>
						<p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-(--sea-ink-soft)">
							{t("achievements.detail.nameLabel")}
						</p>
						<p className="text-sm text-(--sea-ink)">{achievement.name}</p>
					</div>
				)}

				{(achievement.grade || achievement.points !== null) && (
					<div className="rounded-xl border border-(--line) bg-(--surface) p-4">
						<div className="grid grid-cols-2 gap-3 text-center">
							{achievement.grade && (
								<div>
									<p className="text-lg font-bold text-(--brand)">
										<Star size={14} className="mr-1 inline" />
										{achievement.grade}
									</p>
									<p className="text-[10px] text-(--sea-ink-soft)">
										{t("achievements.detail.gradeLabel")}
										{gradeLabel ? ` · ${gradeLabel}` : ""}
									</p>
								</div>
							)}
							{achievement.points !== null && (
								<div>
									<p className="text-lg font-bold text-(--sea-ink)">
										{achievement.points}%
									</p>
									<p className="text-[10px] text-(--sea-ink-soft)">
										{t("achievements.detail.scoreLabel")}
									</p>
								</div>
							)}
						</div>
					</div>
				)}

				{achievement.notes && (
					<div>
						<p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-(--sea-ink-soft)">
							{t("achievements.detail.notesLabel")}
						</p>
						<p className="whitespace-pre-line text-sm leading-relaxed text-(--sea-ink)">
							{achievement.notes}
						</p>
					</div>
				)}

				<div className="rounded-xl border border-(--line) bg-(--surface) px-4 py-3">
					<p className="text-[10px] font-semibold uppercase tracking-wide text-(--sea-ink-soft)">
						{t("achievements.detail.dateLabel")}
					</p>
					<p className="mt-1 text-xs font-medium text-(--sea-ink)">
						{formatAchievementDateTime(achievement.achievedAtIso)}
					</p>
				</div>
			</div>
		</DashboardModal>
	);
}

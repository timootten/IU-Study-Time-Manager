import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
	CATEGORY_COLORS,
	daysRemaining,
	getCategoryMeta,
	STATUS_BADGE,
} from "#/components/dashboard/utils/goal-meta";
import { useLangParam, withLang } from "#/lib/i18n/paths";
import type {
	StudyGoalProgressView,
	StudyGoalView,
} from "#/lib/server/study-manager";

type GoalCardProps = {
	goal: StudyGoalView;
	progress?: StudyGoalProgressView;
};

export default function GoalCard({ goal, progress }: GoalCardProps) {
	const lang = useLangParam();
	const { t } = useTranslation();
	const cat = getCategoryMeta(goal.category);
	const catColors = CATEGORY_COLORS[goal.category];
	const statusBadge = STATUS_BADGE[goal.status] ?? STATUS_BADGE.active;
	const days = daysRemaining(goal.endDateIso);
	const CatIcon = cat.icon;

	return (
		<Link
			to={withLang(lang, "/dashboard/goals/$goalId")}
			params={{ goalId: goal.id }}
			className="group flex flex-col rounded-2xl border border-(--line) bg-(--surface-strong) p-4 text-left no-underline transition hover:border-(--brand)/30 hover:shadow-md sm:p-5"
		>
			<div className="mb-3 flex items-center justify-between">
				<span
					className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${catColors.bg} ${catColors.text} ${catColors.border}`}
				>
					<CatIcon size={12} />
					{t(`goals.category.${goal.category}`)}
				</span>
				<div className="flex items-center gap-2">
					<span
						className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusBadge.bg} ${statusBadge.text}`}
					>
						{t(`goals.status.${goal.status}`)}
					</span>
					<span
						className="h-3.5 w-3.5 rounded-full border border-(--line)"
						style={{ backgroundColor: goal.color }}
						title={`Goal color: ${goal.color}`}
					/>
				</div>
			</div>

			<div className="flex items-start gap-2">
				<span
					className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full border border-(--line)"
					style={{ backgroundColor: goal.color }}
					aria-hidden
				/>
				<h3 className="line-clamp-2 text-sm font-bold text-(--sea-ink) group-hover:text-(--brand)">
					{goal.title}
				</h3>
			</div>

			{goal.description && (
				<p className="mt-1 line-clamp-2 text-xs text-(--sea-ink-soft)">
					{goal.description}
				</p>
			)}

			{progress && (
				<div className="mt-3">
					<div className="mb-1 flex items-center justify-between text-[11px] text-(--sea-ink-soft)">
						<span>
							{progress.actualHours.toFixed(1)}h / {progress.targetHours}h
						</span>
						<span className="font-semibold">{progress.completionRate}%</span>
					</div>
					<div className="h-1.5 w-full overflow-hidden rounded-full bg-(--line)">
						<div
							className="h-full rounded-full bg-(--brand) transition-all"
							style={{
								width: `${Math.min(100, progress.completionRate)}%`,
							}}
						/>
					</div>
				</div>
			)}

			<div className="mt-auto flex items-center gap-3 pt-3 text-[11px] text-(--sea-ink-soft)">
				<span className="inline-flex items-center gap-1">
					<Clock size={11} />
					{goal.targetHours} {t("goals.targetHours")}
				</span>
				{goal.status === "active" && (
					<span
						className={
							days <= 7 ? "font-semibold text-rose-600 dark:text-rose-400" : ""
						}
					>
						{days} {t("goals.days")}
					</span>
				)}
			</div>
		</Link>
	);
}

import { ChevronDown, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import DashboardSearchInput from "#/components/dashboard/ui/DashboardSearchInput";
import { GOAL_CATEGORIES } from "#/components/dashboard/utils/goal-meta";
import type { GoalCategory, StudyGoalView } from "#/lib/server/study-manager";

type AchievementFiltersProps = {
	searchQuery: string;
	categoryFilter: GoalCategory | "all";
	goalFilter: string;
	goalsWithAchievements: StudyGoalView[];
	onSearchChange: (value: string) => void;
	onCategoryChange: (value: GoalCategory | "all") => void;
	onGoalChange: (value: string) => void;
	onCreate: () => void;
};

export default function AchievementFilters({
	searchQuery,
	categoryFilter,
	goalFilter,
	goalsWithAchievements,
	onSearchChange,
	onCategoryChange,
	onGoalChange,
	onCreate,
}: AchievementFiltersProps) {
	const { t } = useTranslation();

	return (
		<div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<DashboardSearchInput
				value={searchQuery}
				placeholder={t("achievements.searchPlaceholder")}
				onChange={onSearchChange}
			/>

			<div className="flex items-center gap-2">
				<div className="relative">
					<select
						value={categoryFilter}
						onChange={(event) =>
							onCategoryChange(event.target.value as GoalCategory | "all")
						}
						className="h-9 appearance-none rounded-lg border border-(--line) bg-(--input-field-bg) pl-3 pr-8 text-xs font-semibold text-(--sea-ink) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
					>
						<option value="all">{`${t("goals.all")} ${t("goals.categoryLabel")}`}</option>
						{GOAL_CATEGORIES.map((category) => (
							<option key={category.value} value={category.value}>
								{t(`goals.category.${category.value}`)}
							</option>
						))}
					</select>
					<ChevronDown
						size={13}
						className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-(--sea-ink-soft)"
					/>
				</div>

				{goalsWithAchievements.length > 0 && (
					<div className="relative">
						<select
							value={goalFilter}
							onChange={(event) => onGoalChange(event.target.value)}
							className="h-9 max-w-45 appearance-none truncate rounded-lg border border-(--line) bg-(--input-field-bg) pl-3 pr-8 text-xs font-semibold text-(--sea-ink) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
						>
							<option value="all">{`${t("goals.all")} ${t("nav.goals")}`}</option>
							{goalsWithAchievements.map((goal) => (
								<option key={goal.id} value={goal.id}>
									{goal.title}
								</option>
							))}
						</select>
						<ChevronDown
							size={13}
							className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-(--sea-ink-soft)"
						/>
					</div>
				)}

				<button
					type="button"
					onClick={onCreate}
					className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-(--brand) px-3.5 text-xs font-bold text-white transition hover:opacity-90"
				>
					<Plus size={15} />
					<span className="hidden sm:inline">
						{t("achievements.emptyState.addButton")}
					</span>
				</button>
			</div>
		</div>
	);
}

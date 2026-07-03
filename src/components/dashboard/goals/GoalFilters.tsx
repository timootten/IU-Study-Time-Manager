import { ChevronDown, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import DashboardSearchInput from "#/components/dashboard/ui/DashboardSearchInput";
import { GOAL_CATEGORIES } from "#/components/dashboard/utils/goal-meta";
import type { GoalCategory } from "#/lib/server/study-manager";

const STATUS_FILTERS = [
	"all",
	"active",
	"paused",
	"completed",
	"failed",
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];

type GoalFiltersProps = {
	searchQuery: string;
	statusFilter: StatusFilter;
	categoryFilter: GoalCategory | "all";
	onSearchChange: (value: string) => void;
	onStatusChange: (value: StatusFilter) => void;
	onCategoryChange: (value: GoalCategory | "all") => void;
	onCreate: () => void;
};

export default function GoalFilters({
	searchQuery,
	statusFilter,
	categoryFilter,
	onSearchChange,
	onStatusChange,
	onCategoryChange,
	onCreate,
}: GoalFiltersProps) {
	const { t } = useTranslation();
	return (
		<div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<DashboardSearchInput
				value={searchQuery}
				placeholder={t("goals.searchGoals")}
				onChange={onSearchChange}
			/>

			<div className="flex items-center gap-2">
				<div className="relative">
					<select
						value={statusFilter}
						onChange={(event) =>
							onStatusChange(event.target.value as StatusFilter)
						}
						className="h-9 appearance-none rounded-lg border border-(--line) bg-(--input-field-bg) pl-3 pr-8 text-xs font-semibold text-(--sea-ink) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
					>
						{STATUS_FILTERS.map((s) => (
							<option key={s} value={s}>
								{s === "all" ? t("goals.allStatuses") : t(`goals.status.${s}`)}
							</option>
						))}
					</select>
					<ChevronDown
						size={13}
						className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-(--sea-ink-soft)"
					/>
				</div>

				<div className="relative">
					<select
						value={categoryFilter}
						onChange={(event) =>
							onCategoryChange(event.target.value as GoalCategory | "all")
						}
						className="h-9 appearance-none rounded-lg border border-(--line) bg-(--input-field-bg) pl-3 pr-8 text-xs font-semibold text-(--sea-ink) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
					>
						<option value="all">{t("goals.all")}</option>
						{GOAL_CATEGORIES.map((c) => (
							<option key={c.value} value={c.value}>
								{t(`goals.category.${c.value}`)}
							</option>
						))}
					</select>
					<ChevronDown
						size={13}
						className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-(--sea-ink-soft)"
					/>
				</div>

				<button
					type="button"
					onClick={onCreate}
					className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-(--brand) px-3.5 text-xs font-bold text-white transition hover:opacity-90"
				>
					<Plus size={15} />
					<span className="hidden sm:inline">{t("goals.createGoal")}</span>
				</button>
			</div>
		</div>
	);
}

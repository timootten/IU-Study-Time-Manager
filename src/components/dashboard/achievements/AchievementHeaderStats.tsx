import { getGradeLabel } from "#/components/dashboard/achievements/achievement-utils";

type AchievementHeaderStatsProps = {
	avgGrade: number | null;
	avgPoints: number | null;
	gradeCount: number;
	pointsCount: number;
};

export default function AchievementHeaderStats({
	avgGrade,
	avgPoints,
	gradeCount,
	pointsCount,
}: AchievementHeaderStatsProps) {
	if (avgGrade === null && avgPoints === null) return null;

	return (
		<div className="flex items-center gap-4">
			{avgGrade !== null && (
				<div className="text-right">
					<p className="text-lg font-bold tabular-nums text-(--sea-ink)">
						{avgGrade.toFixed(1)}
					</p>
					<p className="text-[10px] font-medium text-(--sea-ink-soft)">
						Ø Grade ({gradeCount})
						{getGradeLabel(avgGrade.toFixed(1)) && (
							<span className="ml-1 text-(--brand)">
								· {getGradeLabel(avgGrade.toFixed(1))}
							</span>
						)}
					</p>
				</div>
			)}
			{avgPoints !== null && (
				<div className="text-right">
					<p className="text-lg font-bold tabular-nums text-(--sea-ink)">
						{avgPoints.toFixed(0)}%
					</p>
					<p className="text-[10px] font-medium text-(--sea-ink-soft)">
						Ø Score ({pointsCount})
					</p>
				</div>
			)}
		</div>
	);
}

interface PlanActualPoint {
	month: string;
	plannedHours: number;
	actualHours: number;
}

interface PlanActualChartProps {
	points: PlanActualPoint[];
}

export default function PlanActualChart({ points }: PlanActualChartProps) {
	const maxValue = Math.max(
		1,
		...points.map((point) => Math.max(point.plannedHours, point.actualHours)),
	);

	return (
		<div className="space-y-3">
			{points.map((point) => (
				<div
					key={point.month}
					className="rounded-xl border border-(--line) p-3"
				>
					<div className="flex items-center justify-between gap-3">
						<p className="text-sm font-semibold text-(--sea-ink)">
							{point.month}
						</p>
						<p className="text-xs text-(--sea-ink-soft)">
							{point.actualHours.toFixed(1)}h / {point.plannedHours.toFixed(1)}h
						</p>
					</div>
					<div className="mt-2 space-y-2">
						<div className="space-y-1">
							<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-(--sea-ink-soft)">
								Planned
							</p>
							<div className="h-2 w-full overflow-hidden rounded-full bg-(--line)">
								<div
									className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand),var(--lagoon-deep))]"
									style={{ width: `${(point.plannedHours / maxValue) * 100}%` }}
								/>
							</div>
						</div>
						<div className="space-y-1">
							<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-(--sea-ink-soft)">
								Actual
							</p>
							<div className="h-2 w-full overflow-hidden rounded-full bg-(--line)">
								<div
									className="h-full rounded-full bg-[linear-gradient(90deg,var(--palm),var(--brand))]"
									style={{ width: `${(point.actualHours / maxValue) * 100}%` }}
								/>
							</div>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

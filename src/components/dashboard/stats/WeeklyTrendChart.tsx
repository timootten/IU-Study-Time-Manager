interface WeeklyTrendPoint {
	label: string;
	hours: number;
}

interface WeeklyTrendChartProps {
	points: WeeklyTrendPoint[];
}

function toPath(points: WeeklyTrendPoint[], width: number, height: number) {
	if (points.length === 0) {
		return "";
	}

	const maxValue = Math.max(1, ...points.map((point) => point.hours));
	const xStep = points.length > 1 ? width / (points.length - 1) : width;

	return points
		.map((point, index) => {
			const x = index * xStep;
			const y = height - (point.hours / maxValue) * height;
			return `${index === 0 ? "M" : "L"}${x},${y}`;
		})
		.join(" ");
}

export default function WeeklyTrendChart({ points }: WeeklyTrendChartProps) {
	const width = 520;
	const height = 170;
	const strokePath = toPath(points, width, height);
	const areaPath = `${strokePath} L${width},${height} L0,${height} Z`;

	return (
		<div className="rounded-2xl border border-(--line) p-3 sm:p-4">
			<svg
				viewBox={`0 0 ${width} ${height + 24}`}
				className="h-52 w-full"
				role="img"
				aria-label="Weekly focus trend"
			>
				<defs>
					<linearGradient id="focusTrendStroke" x1="0" x2="0" y1="0" y2="1">
						<stop offset="0%" stopColor="var(--brand)" />
						<stop offset="100%" stopColor="var(--lagoon-deep)" />
					</linearGradient>
					<linearGradient id="focusTrendArea" x1="0" x2="0" y1="0" y2="1">
						<stop offset="0%" stopColor="var(--lagoon)" stopOpacity="0.35" />
						<stop offset="100%" stopColor="var(--lagoon)" stopOpacity="0.05" />
					</linearGradient>
				</defs>
				<path d={areaPath} fill="url(#focusTrendArea)" />
				<path
					d={strokePath}
					fill="none"
					stroke="url(#focusTrendStroke)"
					strokeWidth="4"
					strokeLinecap="round"
				/>
			</svg>
			<div className="mt-2 grid grid-cols-5 gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-(--sea-ink-soft) sm:grid-cols-10">
				{points.map((point) => (
					<p key={point.label} className="truncate text-center">
						{point.label}
					</p>
				))}
			</div>
		</div>
	);
}

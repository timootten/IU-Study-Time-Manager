import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	Bell,
	BellOff,
	BookOpen,
	CalendarClock,
	ChevronLeft,
	ChevronRight,
	Clock,
	Edit2,
	GraduationCap,
	Plus,
	Trash2,
	UploadCloud,
} from "lucide-react";
import { type CSSProperties, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import CalendarSessionModal from "#/components/dashboard/calendar/CalendarSessionModal";
import {
	type CalendarSession,
	dayLabels,
	formatDateShort,
	formatDuration,
	formatTime,
	getCalendarGrid,
	getSessionStyle,
	type IcsImportDraft,
	isSameDay,
	monthNames,
	plannedDurationMin,
	type SpanSegment,
} from "#/components/dashboard/calendar/calendar-utils";
import DashboardRoutePending from "#/components/dashboard/DashboardRoutePending";
import DashboardShell from "#/components/dashboard/DashboardShell";
import DashboardModal from "#/components/dashboard/ui/DashboardModal";
import FieldError from "#/components/dashboard/ui/FieldError";
import { randomBrightColor } from "#/components/dashboard/utils/color-utils";
import { createServiceRouteErrorComponent } from "#/components/errors/RouteServiceError";
import { getUserMessage } from "#/lib/errors/extract-error";
import {
	studyDashboardQueryKey,
	studyDashboardQueryOptions,
} from "#/lib/queries/study-dashboard";
import { requireAuthSession } from "#/lib/server/require-auth";
import type { StudyCalendarImportView } from "#/lib/server/study-manager";
import {
	createCalendarImports,
	deleteCalendarImport,
	deleteStudySession,
	updateCalendarImport,
} from "#/lib/server/study-manager";

const calendarRouteErrorComponent = createServiceRouteErrorComponent({
	unavailableTitle: "Calendar temporarily unavailable",
	fallbackTitle: "Unable to load calendar",
	fallbackDescription:
		"This calendar page could not be loaded right now. Please try again.",
});

export const Route = createFileRoute("/$lang/dashboard/calendar")({
	staleTime: 0,
	preloadStaleTime: 0,
	pendingMs: 120,
	pendingMinMs: 250,
	loader: async ({ context }) => {
		await requireAuthSession();
		await context.queryClient.fetchQuery(studyDashboardQueryOptions());
	},
	pendingComponent: DashboardRoutePending,
	errorComponent: calendarRouteErrorComponent,
	component: CalendarPage,
});

function CalendarPage() {
	const { t, i18n } = useTranslation();
	const { data: snapshot, error } = useQuery(studyDashboardQueryOptions());

	if (!snapshot) {
		throw error ?? new Error("Missing study dashboard data.");
	}

	const today = new Date();
	const [viewYear, setViewYear] = useState(today.getFullYear());
	const [viewMonth, setViewMonth] = useState(today.getMonth());
	const [selectedDay, setSelectedDay] = useState<number | null>(
		today.getDate(),
	);
	const [showSessionModal, setShowSessionModal] = useState(false);
	const [showImportModal, setShowImportModal] = useState(false);
	const [editingSession, setEditingSession] = useState<CalendarSession | null>(
		null,
	);
	const [importDraft, setImportDraft] = useState<IcsImportDraft | null>(null);
	const [showImportValidation, setShowImportValidation] = useState(false);
	const [importToDelete, setImportToDelete] =
		useState<StudyCalendarImportView | null>(null);
	const [showEditImportModal, setShowEditImportModal] = useState(false);
	const [editingImport, setEditingImport] =
		useState<StudyCalendarImportView | null>(null);
	const [showEditImportValidation, setShowEditImportValidation] =
		useState(false);
	const [deleteSession, setDeleteSession] = useState<CalendarSession | null>(
		null,
	);

	const queryClient = useQueryClient();
	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: studyDashboardQueryKey });

	const deleteMutation = useMutation({
		mutationFn: deleteStudySession,
		onSuccess: () => {
			toast.success(t("toast.sessionDeleted"));
			setDeleteSession(null);
			invalidate();
		},
		onError: (err) =>
			toast.error(getUserMessage(err, t("toast.sessionDeleteFailed"))),
	});

	const importMutation = useMutation({
		mutationFn: createCalendarImports,
		onSuccess: (data: { sessionCount: number }) => {
			toast.success(t("toast.importSuccess", { count: data.sessionCount }));
			setImportDraft(null);
			setShowImportValidation(false);
			invalidate();
		},
		onError: (err) => toast.error(getUserMessage(err, t("toast.importFailed"))),
	});

	const updateImportMutation = useMutation({
		mutationFn: updateCalendarImport,
		onSuccess: () => {
			toast.success(t("toast.importUpdated"));
			invalidate();
			setShowEditImportModal(false);
			setEditingImport(null);
			setShowEditImportValidation(false);
		},
		onError: (err) =>
			toast.error(getUserMessage(err, t("toast.importUpdateFailed"))),
	});

	const deleteImportMutation = useMutation({
		mutationFn: deleteCalendarImport,
		onSuccess: () => {
			toast.success(t("toast.importRemoved"));
			invalidate();
		},
		onError: (err) =>
			toast.error(getUserMessage(err, t("toast.importRemoveFailed"))),
	});

	const sessions: CalendarSession[] = snapshot.detailedPlans;
	const calendarImports: StudyCalendarImportView[] = snapshot.calendarImports;

	const visibleSessions = useMemo(() => {
		const importMap = new Map(calendarImports.map((c) => [c.id, c.visible]));
		return sessions.filter(
			(s) => !s.importId || importMap.get(s.importId) !== false,
		);
	}, [sessions, calendarImports]);
	const importCounts = useMemo(() => {
		const counts = new Map<string, number>();
		for (const session of sessions as CalendarSession[]) {
			if (!session.importId) continue;
			counts.set(session.importId, (counts.get(session.importId) ?? 0) + 1);
		}
		return counts;
	}, [sessions]);

	const importNameValue = importDraft?.name.trim() ?? "";
	const importDraftError = !importDraft
		? "Select an ICS file to import."
		: null;
	const importNameError = importDraft
		? !importNameValue
			? "Name is required."
			: importNameValue.length < 2
				? "Name must be at least 2 characters."
				: null
		: null;
	const hasImportErrors = !!(importDraftError || importNameError);

	const editImportNameValue = editingImport?.name.trim() ?? "";
	const editImportNameError = editingImport
		? !editImportNameValue
			? "Name is required."
			: editImportNameValue.length < 2
				? "Name must be at least 2 characters."
				: null
		: null;

	/* sessions that span the selected day (including multi-day) */
	const selectedDaySessions = useMemo(() => {
		if (selectedDay == null) return [];
		const dayStart = new Date(viewYear, viewMonth, selectedDay);
		const dayEnd = new Date(viewYear, viewMonth, selectedDay, 23, 59, 59, 999);
		return visibleSessions.filter((s) => {
			const start = new Date(s.startIso);
			const end = s.endIso ? new Date(s.endIso) : start;
			return start <= dayEnd && end >= dayStart;
		});
	}, [visibleSessions, selectedDay, viewYear, viewMonth]);

	/* upcoming sessions (from today onwards) */
	const upcoming = useMemo(() => {
		const now = Date.now();
		return visibleSessions
			.filter(
				(s) =>
					new Date(s.startIso).getTime() >= now && s.status !== "completed",
			)
			.sort(
				(a, b) =>
					new Date(a.startIso).getTime() - new Date(b.startIso).getTime(),
			)
			.slice(0, 8);
	}, [visibleSessions]);

	const MONTH_NAMES = monthNames(i18n.language);
	const DAY_LABELS = dayLabels(i18n.language);
	const cells = getCalendarGrid(viewYear, viewMonth);

	/* compute span layout for multi-day sessions */
	const spanLayout = useMemo(() => {
		const cellSegments = new Map<number, SpanSegment[]>();
		const rowMaxLane = new Map<number, number>();
		for (let i = 0; i < cells.length; i++) cellSegments.set(i, []);

		const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

		const ranges: {
			session: CalendarSession;
			firstDay: number;
			lastDay: number;
		}[] = [];
		for (const s of visibleSessions) {
			const start = new Date(s.startIso);
			const end = s.endIso ? new Date(s.endIso) : start;
			const monthStart = new Date(viewYear, viewMonth, 1);
			const monthEnd = new Date(viewYear, viewMonth, daysInMonth, 23, 59, 59);
			if (end < monthStart || start > monthEnd) continue;
			const firstDay = start < monthStart ? 1 : start.getDate();
			const endDateOnly = new Date(
				end.getFullYear(),
				end.getMonth(),
				end.getDate(),
			);
			const lastDay = end > monthEnd ? daysInMonth : endDateOnly.getDate();
			ranges.push({ session: s, firstDay, lastDay });
		}

		ranges.sort((a, b) => {
			const spanDiff = b.lastDay - b.firstDay - (a.lastDay - a.firstDay);
			if (spanDiff !== 0) return spanDiff;
			return a.firstDay - b.firstDay;
		});

		const numRows = cells.length / 7;
		for (let row = 0; row < numRows; row++) {
			const rowStart = row * 7;
			const rowCells = cells.slice(rowStart, rowStart + 7);
			const rowDays = rowCells.filter((d): d is number => d != null);
			if (rowDays.length === 0) {
				rowMaxLane.set(row, -1);
				continue;
			}
			const rowFirstDay = Math.min(...rowDays);
			const rowLastDay = Math.max(...rowDays);
			const rowRanges = ranges.filter(
				(r) => r.firstDay <= rowLastDay && r.lastDay >= rowFirstDay,
			);
			const lanes: Set<number>[] = [];
			let maxLane = -1;

			for (const r of rowRanges) {
				const cols: number[] = [];
				for (let col = 0; col < 7; col++) {
					const d = rowCells[col];
					if (d != null && d >= r.firstDay && d <= r.lastDay) cols.push(col);
				}
				if (cols.length === 0) continue;

				let lane = -1;
				for (let l = 0; l < lanes.length; l++) {
					if (!cols.some((c) => lanes[l].has(c))) {
						lane = l;
						break;
					}
				}
				if (lane === -1) {
					lane = lanes.length;
					lanes.push(new Set());
				}
				for (const c of cols) lanes[lane].add(c);
				if (lane > maxLane) maxLane = lane;

				const minCol = Math.min(...cols);
				const maxCol = Math.max(...cols);
				const colSpan = maxCol - minCol + 1;
				for (const col of cols) {
					cellSegments.get(rowStart + col)?.push({
						session: r.session,
						lane,
						isRowStart: col === minCol,
						isRowEnd: col === maxCol,
						endsInRow: maxCol < 6,
						colSpan,
					});
				}
			}
			rowMaxLane.set(row, maxLane);
		}

		return { cellSegments, rowMaxLane };
	}, [visibleSessions, cells, viewYear, viewMonth]);

	function prevMonth() {
		if (viewMonth === 0) {
			setViewMonth(11);
			setViewYear((y) => y - 1);
		} else {
			setViewMonth((m) => m - 1);
		}
		setSelectedDay(null);
	}

	function nextMonth() {
		if (viewMonth === 11) {
			setViewMonth(0);
			setViewYear((y) => y + 1);
		} else {
			setViewMonth((m) => m + 1);
		}
		setSelectedDay(null);
	}

	function goToToday() {
		setViewYear(today.getFullYear());
		setViewMonth(today.getMonth());
		setSelectedDay(today.getDate());
	}

	function handleEdit(session: CalendarSession) {
		if (session.source === "ics") {
			toast.info(t("toast.icsImportInfo"));
			return;
		}
		setEditingSession(session);
		setShowSessionModal(true);
	}

	return (
		<DashboardShell
			title={t("calendar.title")}
			description={t("calendar.description")}
		>
			<div className="flex flex-col gap-6 xl:flex-row">
				{/* ─── calendar grid ─── */}
				<div className="min-w-0 flex-1">
					{/* month header */}
					<div className="mb-4 flex items-center justify-between">
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={prevMonth}
								className="grid h-8 w-8 place-items-center rounded-lg border border-(--line) bg-(--surface) text-(--sea-ink-soft) transition hover:bg-(--link-bg-hover) hover:text-(--sea-ink)"
							>
								<ChevronLeft size={16} />
							</button>
							<h2 className="min-w-40 text-center text-lg font-bold text-(--sea-ink)">
								{MONTH_NAMES[viewMonth]} {viewYear}
							</h2>
							<button
								type="button"
								onClick={nextMonth}
								className="grid h-8 w-8 place-items-center rounded-lg border border-(--line) bg-(--surface) text-(--sea-ink-soft) transition hover:bg-(--link-bg-hover) hover:text-(--sea-ink)"
							>
								<ChevronRight size={16} />
							</button>
						</div>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setShowImportModal(true)}
								className="inline-flex h-9 items-center gap-2 rounded-lg border border-(--line) bg-(--surface) px-3 text-xs font-semibold text-(--sea-ink-soft) transition hover:bg-(--link-bg-hover) hover:text-(--sea-ink)"
							>
								<UploadCloud size={15} />
								<span className="hidden sm:inline">{t("calendar.import")}</span>
							</button>

							<button
								type="button"
								onClick={goToToday}
								className="inline-flex h-9 items-center rounded-lg border border-(--line) bg-(--surface) px-3.5 text-xs font-semibold text-(--sea-ink-soft) transition hover:bg-(--link-bg-hover) hover:text-(--sea-ink)"
							>
								{t("calendar.today")}
							</button>
							<button
								type="button"
								onClick={() => {
									setEditingSession(null);
									setShowSessionModal(true);
								}}
								className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-(--brand) px-2.5 text-xs font-bold text-white transition hover:opacity-90 sm:px-3.5"
							>
								<Plus size={15} />
								<span className="hidden sm:inline">
									{t("calendar.addSession")}
								</span>
							</button>
						</div>
					</div>

					{/* day-of-week headers */}
					<div className="grid grid-cols-7 gap-px text-center text-xs font-semibold text-(--sea-ink-soft)">
						{DAY_LABELS.map((d) => (
							<div key={d} className="py-2">
								{d}
							</div>
						))}
					</div>

					{/* grid cells */}
					<div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-(--line) bg-(--line)">
						{cells.map((day, idx) => {
							const isToday =
								day != null &&
								viewYear === today.getFullYear() &&
								viewMonth === today.getMonth() &&
								day === today.getDate();
							const isSelected = day != null && day === selectedDay;
							const key = day
								? `${viewYear}-${viewMonth}-${day}`
								: `empty-${idx}`;

							const row = Math.floor(idx / 7);
							const maxLane = spanLayout.rowMaxLane.get(row) ?? -1;
							const maxVisibleLanes = 2;
							const visibleLaneCount = Math.min(maxLane + 1, maxVisibleLanes);
							const segments = spanLayout.cellSegments.get(idx) ?? [];
							const overflow = segments.filter(
								(s) => s.lane >= maxVisibleLanes,
							).length;

							return (
								<button
									type="button"
									key={key}
									disabled={day == null}
									onClick={() => day != null && setSelectedDay(day)}
									className={`relative flex min-h-18 flex-col items-start overflow-visible p-1.5 text-left transition [--calendar-cell-pad:0.375rem] sm:min-h-22 sm:p-2 sm:[--calendar-cell-pad:0.5rem] ${
										day == null
											? "cursor-default bg-(--surface)/40"
											: isSelected
												? "bg-(--link-bg-hover) ring-2 ring-(--brand) ring-inset"
												: "bg-(--surface-strong) hover:bg-(--link-bg-hover)"
									}`}
								>
									{day != null && (
										<>
											<span
												className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold sm:h-7 sm:w-7 sm:text-sm ${
													isToday
														? "bg-(--brand) text-white"
														: "text-(--sea-ink)"
												}`}
											>
												{day}
											</span>
											{/* session span bars */}
											{visibleLaneCount > 0 && (
												<div className="mt-auto flex w-full flex-col gap-0.5 overflow-visible pt-1">
													{Array.from(
														{ length: visibleLaneCount },
														(_, laneIdx) => {
															const seg = segments.find(
																(s) => s.lane === laneIdx,
															);
															if (!seg) {
																return (
																	<div
																		// biome-ignore lint/suspicious/noArrayIndexKey: stable lane count, index is safe
																		key={`empty-${laneIdx}`}
																		className="h-3.5 sm:h-4"
																	/>
																);
															}
															const colors = getSessionStyle(seg.session);
															const isSingle = seg.isRowStart && seg.isRowEnd;

															/* continuation cells: invisible spacer (the start cell's bar covers this area) */
															if (!seg.isRowStart) {
																return (
																	<div
																		key={`cont-${seg.session.id}`}
																		className="h-3.5 sm:h-4"
																	/>
																);
															}

															const roundedClass = isSingle
																? "rounded"
																: seg.endsInRow
																	? "rounded-l rounded-r"
																	: "rounded-l";
															const extraCells = seg.colSpan - 1;
															const spanStyle: CSSProperties | undefined =
																isSingle
																	? undefined
																	: seg.endsInRow
																		? {
																				width: `calc(${seg.colSpan} * 100% + ${extraCells} * (1px + (2 * var(--calendar-cell-pad))))`,
																			}
																		: {
																				width: `calc(${seg.colSpan} * 100% + ${extraCells} * (1px + (2 * var(--calendar-cell-pad))) + var(--calendar-cell-pad))`,
																				marginRight:
																					"calc(var(--calendar-cell-pad) * -1)",
																			};
															const overflowClass = isSingle
																? "truncate"
																: "overflow-hidden text-ellipsis whitespace-nowrap";

															// Icon for category
															let CatIcon = null;
															if (seg.session.category === "course")
																CatIcon = GraduationCap;
															else if (seg.session.category === "learning")
																CatIcon = BookOpen;

															return (
																<span
																	key={seg.session.id}
																	style={{
																		...spanStyle,
																		backgroundColor: colors.bg,
																		color: colors.text,
																	}}
																	className={`pointer-events-none relative z-10 flex items-center gap-1 h-3.5 px-1.5 text-[9px] font-medium leading-3.5 sm:h-4 sm:text-[10px] sm:leading-4 ${roundedClass} ${overflowClass}`}
																>
																	{CatIcon && (
																		<CatIcon
																			size={10}
																			className="shrink-0 mr-0.5 opacity-80"
																		/>
																	)}
																	{seg.session.name || seg.session.goalTitle}
																</span>
															);
														},
													)}
													{overflow > 0 && (
														<span className="px-1 text-[8px] leading-none text-(--sea-ink-soft)">
															+{overflow} {t("calendar.more")}
														</span>
													)}
												</div>
											)}
										</>
									)}
								</button>
							);
						})}
					</div>

					{/* selected day detail */}
					{selectedDay != null && (
						<div className="mt-5">
							<h3 className="mb-3 text-sm font-bold text-(--sea-ink)">
								{MONTH_NAMES[viewMonth]} {selectedDay}, {viewYear}
							</h3>
							{selectedDaySessions.length === 0 ? (
								<p className="rounded-xl border border-dashed border-(--line) px-4 py-6 text-center text-sm text-(--sea-ink-soft)">
									{t("calendar.noSessions")}
								</p>
							) : (
								<div className="space-y-2">
									{selectedDaySessions.map((s) => {
										const colors = getSessionStyle(s);
										return (
											<div
												key={s.id}
												style={{
													borderColor: colors.border,
													backgroundColor: colors.bg,
												}}
												className="flex items-start gap-3 rounded-xl border px-4 py-3"
											>
												<span
													style={{ backgroundColor: colors.dot }}
													className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
												/>
												<div className="min-w-0 flex-1">
													<p className="truncate text-sm font-semibold text-(--sea-ink) flex items-center gap-1">
														{s.category === "course" && (
															<GraduationCap size={12} />
														)}
														{s.category === "learning" && (
															<BookOpen size={12} />
														)}
														{s.name || s.goalTitle}
													</p>
													<p className="text-xs" style={{ color: colors.text }}>
														{formatTime(s.startIso)}
														{s.endIso && <> – {formatTime(s.endIso)}</>}
														<span className="mx-1.5 opacity-40">·</span>
														{s.durationSec
															? formatDuration(s.durationSec)
															: s.endIso
																? plannedDurationMin(s.startIso, s.endIso)
																: "–"}
													</p>
													{s.notes && (
														<p className="mt-0.5 whitespace-pre-line text-[11px] leading-snug text-(--sea-ink-soft)">
															{s.notes}
														</p>
													)}
												</div>
												<div className="flex items-center gap-2">
													<div className="flex items-center gap-1">
														<button
															type="button"
															onClick={() => handleEdit(s)}
															className="inline-flex h-7 w-7 items-center justify-center rounded-md text-(--sea-ink-soft) hover:bg-(--link-bg-hover) hover:text-(--sea-ink) disabled:cursor-not-allowed disabled:opacity-50"
														>
															<Edit2 size={13} />
														</button>
														<button
															type="button"
															onClick={() => setDeleteSession(s)}
															className="inline-flex h-7 w-7 items-center justify-center rounded-md text-(--sea-ink-soft) hover:bg-rose-500/10 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
														>
															<Trash2 size={13} />
														</button>
													</div>
													<span className="shrink-0 rounded-md border border-(--line) bg-(--surface) px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-(--sea-ink-soft)">
														{t(`goals.status.${s.status}`)}
													</span>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</div>
					)}
				</div>

				{/* ─── upcoming sidebar ─── */}
				<aside className="w-full shrink-0 xl:w-80">
					<div className="rounded-2xl border border-(--line) bg-(--surface-strong) p-4 sm:p-5">
						<div className="mb-4 flex items-center gap-2">
							<CalendarClock size={18} className="text-(--brand)" />
							<h3 className="text-sm font-bold text-(--sea-ink)">
								{t("calendar.upcomingSessions")}
							</h3>
						</div>

						{upcoming.length === 0 ? (
							<p className="py-6 text-center text-sm text-(--sea-ink-soft)">
								{t("calendar.noUpcoming")}
							</p>
						) : (
							<ol className="space-y-2.5">
								{upcoming.map((s) => {
									const colors = getSessionStyle(s);
									const startDate = new Date(s.startIso);
									const isSessionToday = isSameDay(startDate, today);

									return (
										<li key={s.id}>
											<div
												style={{
													borderColor: colors.border,
													backgroundColor: colors.bg,
												}}
												className="flex items-start gap-3 rounded-xl border px-3 py-2.5"
											>
												<button
													type="button"
													onClick={() => {
														setViewYear(startDate.getFullYear());
														setViewMonth(startDate.getMonth());
														setSelectedDay(startDate.getDate());
													}}
													className="flex min-w-0 flex-1 items-start gap-3 text-left"
												>
													<span
														style={{ backgroundColor: colors.dot }}
														className="mt-1 h-2 w-2 shrink-0 rounded-full"
													/>
													<div className="min-w-0 flex-1">
														<p className="truncate text-sm font-medium text-(--sea-ink) flex items-center gap-1">
															{s.category === "course" && (
																<GraduationCap size={12} />
															)}
															{s.category === "learning" && (
																<BookOpen size={12} />
															)}
															{s.name || s.goalTitle}
														</p>
														<div className="mt-0.5 flex items-center gap-1.5 text-xs text-(--sea-ink-soft)">
															<Clock size={11} />
															{isSessionToday
																? `${t("calendar.today")}, ${formatTime(s.startIso)}`
																: `${formatDateShort(s.startIso)}, ${formatTime(s.startIso)}`}
															<span className="opacity-40">·</span>
															{s.endIso
																? plannedDurationMin(s.startIso, s.endIso)
																: "–"}
														</div>
														{s.notes && (
															<p className="mt-0.5 whitespace-pre-line text-[11px] leading-snug text-(--sea-ink-soft)">
																{s.notes}
															</p>
														)}
													</div>
												</button>
												<div className="flex items-center gap-1">
													<button
														type="button"
														onClick={() => handleEdit(s)}
														className="inline-flex h-7 w-7 items-center justify-center rounded-md text-(--sea-ink-soft) hover:bg-(--link-bg-hover) hover:text-(--sea-ink) disabled:cursor-not-allowed disabled:opacity-50"
													>
														<Edit2 size={13} />
													</button>
													<button
														type="button"
														onClick={() => setDeleteSession(s)}
														className="inline-flex h-7 w-7 items-center justify-center rounded-md text-(--sea-ink-soft) hover:bg-rose-500/10 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
													>
														<Trash2 size={13} />
													</button>
												</div>
											</div>
										</li>
									);
								})}
							</ol>
						)}
					</div>

					{/* summary counts */}
					<div className="mt-4 grid grid-cols-2 gap-3">
						<div className="rounded-xl border border-(--line) bg-(--surface-strong) px-4 py-3 text-center">
							<p className="text-2xl font-bold text-(--brand)">
								{
									visibleSessions.filter((s) => {
										const d = new Date(s.startIso);
										return (
											d.getMonth() === viewMonth && d.getFullYear() === viewYear
										);
									}).length
								}
							</p>
							<p className="mt-0.5 text-[11px] font-medium text-(--sea-ink-soft)">
								{t("calendar.thisMonth")}
							</p>
						</div>
						<div className="rounded-xl border border-(--line) bg-(--surface-strong) px-4 py-3 text-center">
							<p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
								{visibleSessions.filter((s) => s.status === "completed").length}
							</p>
							<p className="mt-0.5 text-[11px] font-medium text-(--sea-ink-soft)">
								{t("calendar.completed")}
							</p>
						</div>
					</div>
				</aside>
			</div>

			{showSessionModal && (
				<CalendarSessionModal
					selectedDate={
						selectedDay
							? new Date(viewYear, viewMonth, selectedDay)
							: new Date()
					}
					goals={snapshot.goals}
					editing={editingSession}
					onClose={() => {
						setShowSessionModal(false);
						setEditingSession(null);
					}}
					onSaved={() => {
						setShowSessionModal(false);
						setEditingSession(null);
						invalidate();
					}}
				/>
			)}

			{deleteSession && (
				<DashboardModal
					open
					title={t("modal.deleteSession")}
					description={t("modal.deleteWarning")}
					onClose={() => setDeleteSession(null)}
					footer={
						<div className="flex justify-end gap-2">
							<button
								type="button"
								onClick={() => setDeleteSession(null)}
								className="rounded-lg border border-(--line) bg-(--surface-strong) px-4 py-2 text-xs font-semibold text-(--sea-ink) hover:bg-(--link-bg-hover)"
							>
								{t("common.cancel")}
							</button>
							<button
								type="button"
								onClick={() =>
									deleteMutation.mutate({
										data: { sessionId: deleteSession.id },
									})
								}
								className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:opacity-90"
							>
								{t("common.delete")}
							</button>
						</div>
					}
				>
					<p className="text-sm text-(--sea-ink-soft)">
						{t("modal.deleteSessionConfirm", {
							title: deleteSession.goalTitle,
						})}
					</p>
				</DashboardModal>
			)}

			{showImportModal && (
				<DashboardModal
					open
					title={t("modal.icsImports")}
					description={t("modal.icsImportsDescription")}
					onClose={() => {
						setShowImportModal(false);
						setShowImportValidation(false);
					}}
					footer={
						<div className="flex justify-end gap-2">
							<button
								type="button"
								onClick={() => {
									setShowImportModal(false);
									setShowImportValidation(false);
								}}
								className="rounded-lg border border-(--line) bg-(--surface-strong) px-4 py-2 text-xs font-semibold text-(--sea-ink) hover:bg-(--link-bg-hover)"
							>
								{t("common.close")}
							</button>
						</div>
					}
				>
					<div className="space-y-5">
						<section className="space-y-3">
							<div className="flex items-center justify-between">
								<h4 className="text-sm font-bold text-(--sea-ink)">
									{t("calendar.importedCalendars")}
								</h4>
								<span className="text-xs text-(--sea-ink-soft)">
									{calendarImports.length} {t("calendar.total")}
								</span>
							</div>
							{calendarImports.length === 0 ? (
								<p className="rounded-xl border border-dashed border-(--line) px-4 py-4 text-center text-xs text-(--sea-ink-soft)">
									{t("calendar.noImportsYet")}
								</p>
							) : (
								<div className="space-y-2">
									{calendarImports.map((entry) => (
										<div
											key={entry.id}
											className="flex items-center justify-between rounded-xl border border-(--line) bg-(--surface) px-4 py-3"
										>
											<div className="flex items-center gap-3">
												<label className="flex items-center gap-2">
													<input
														type="checkbox"
														checked={entry.visible ?? true}
														onChange={(e) =>
															updateImportMutation.mutate({
																data: {
																	importId: entry.id,
																	name: entry.name,
																	color: entry.color,
																	visible: e.target.checked,
																},
															})
														}
														className="h-4 w-4 rounded border-(--line) text-(--brand)"
													/>
												</label>
												<button
													type="button"
													onClick={() => {
														setEditingImport(entry);
														setShowEditImportModal(true);
														setShowEditImportValidation(false);
													}}
													className="h-3 w-3 rounded-full border border-(--line) cursor-pointer"
													style={{ backgroundColor: entry.color }}
													aria-label={t("common.editName", {
														name: entry.name,
													})}
												/>
												<div>
													<p className="text-sm font-semibold text-(--sea-ink)">
														{entry.name}
													</p>
													<p className="text-xs text-(--sea-ink-soft)">
														{importCounts.get(entry.id) ?? 0}{" "}
														{t("calendar.sessions")}
													</p>
												</div>
											</div>
											<div className="flex items-center gap-2">
												<button
													type="button"
													onClick={() =>
														updateImportMutation.mutate({
															data: {
																importId: entry.id,
																name: entry.name,
																color: entry.color,
																visible: entry.visible,
																notificationsEnabled:
																	entry.notificationsEnabled === false,
															},
														})
													}
													className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
														entry.notificationsEnabled !== false
															? "text-(--brand) hover:bg-(--brand)/10"
															: "text-(--sea-ink-soft) hover:bg-(--link-bg-hover) hover:text-(--sea-ink)"
													}`}
													aria-label={
														entry.notificationsEnabled !== false
															? t("calendar.notificationsOn")
															: t("calendar.notificationsOff")
													}
													title={
														entry.notificationsEnabled !== false
															? t("calendar.notificationsEnabled")
															: t("calendar.notificationsDisabled")
													}
												>
													{entry.notificationsEnabled !== false ? (
														<Bell size={13} />
													) : (
														<BellOff size={13} />
													)}
												</button>
												<button
													type="button"
													onClick={() => {
														setEditingImport(entry);
														setShowEditImportModal(true);
														setShowEditImportValidation(false);
													}}
													className="inline-flex h-7 w-7 items-center justify-center rounded-md text-(--sea-ink-soft) hover:bg-(--link-bg-hover) hover:text-(--sea-ink)"
												>
													<Edit2 size={13} />
												</button>
												<button
													type="button"
													onClick={() => setImportToDelete(entry)}
													className="rounded-lg border border-(--line) bg-(--surface-strong) px-3 py-1.5 text-xs font-semibold text-(--sea-ink-soft) hover:bg-rose-500/10 hover:text-rose-600"
												>
													{t("common.remove")}
												</button>
											</div>
										</div>
									))}
								</div>
							)}
						</section>

						<form
							className="space-y-3"
							onSubmit={(e) => {
								e.preventDefault();
								setShowImportValidation(true);
								if (!importDraft || hasImportErrors || importMutation.isPending)
									return;
								importMutation.mutate({
									data: {
										imports: [
											{
												name: importDraft.name.trim() || "",
												color: importDraft.color,
												icsText: importDraft.icsText,
												notificationsEnabled:
													importDraft.notificationsEnabled ?? true,
											},
										],
									},
								});
							}}
						>
							<div className="flex items-center justify-between">
								<h4 className="text-sm font-bold text-(--sea-ink)">
									{t("calendar.addNewImport")}
								</h4>
								<span className="text-xs text-(--sea-ink-soft)">
									{t("calendar.singleIcsFile")}
								</span>
							</div>
							<div className="rounded-xl border border-dashed border-(--line) bg-(--surface) px-4 py-4">
								<div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
									<div>
										<p className="text-sm font-semibold text-(--sea-ink)">
											{t("calendar.dropIcs")}
										</p>
										<p className="text-xs text-(--sea-ink-soft)">
											{t("calendar.selectOneIcs")}
										</p>
									</div>
									<label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-(--line) bg-(--surface-strong) px-3 py-2 text-xs font-semibold text-(--sea-ink-soft) hover:bg-(--link-bg-hover)">
										<input
											type="file"
											accept=".ics,text/calendar"
											onChange={async (e) => {
												const f = (e.target as HTMLInputElement).files?.[0];
												if (!f) return;
												try {
													const text = await f.text();
													const draft: IcsImportDraft = {
														id: `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`,
														fileName: f.name,
														name: "",
														color: randomBrightColor(),
														icsText: text,
													};
													setImportDraft(draft);
												} finally {
													(e.target as HTMLInputElement).value = "";
												}
											}}
											className="sr-only"
										/>
										<span className="text-(--sea-ink-soft)">
											{t("calendar.chooseFile")}
										</span>
									</label>
								</div>
							</div>
							{showImportValidation && importDraftError && (
								<FieldError message={importDraftError} />
							)}
							{/* single-file upload: show form inline for the uploaded file */}
							{importDraft && (
								<div className="mt-3 rounded-xl border border-(--line) bg-(--surface-strong) px-4 py-3">
									<div className="flex items-center justify-between">
										<p className="text-sm font-semibold text-(--sea-ink)">
											{t("calendar.selectedIcs")}
										</p>
										<div className="flex items-center gap-2">
											<button
												type="button"
												onClick={() => setImportDraft(null)}
												className="rounded-lg border px-3 py-1 text-xs"
											>
												{t("common.remove")}
											</button>
										</div>
									</div>
									<div className="mt-3">
										<label
											htmlFor="calendar-import-name"
											className="mb-1 block text-xs font-semibold text-(--sea-ink)"
										>
											{t("common.name")}
										</label>
										<input
											id="calendar-import-name"
											data-autofocus
											type="text"
											value={importDraft.name}
											onChange={(e) =>
												setImportDraft((p) =>
													p ? { ...p, name: e.target.value } : p,
												)
											}
											maxLength={120}
											className="h-10 w-full rounded-xl border border-(--line) bg-(--input-field-bg) px-3 text-sm"
										/>
										{showImportValidation && importNameError && (
											<FieldError message={importNameError} />
										)}
									</div>
									<div className="mt-3">
										<label
											htmlFor="calendar-import-color"
											className="mb-1 block text-xs font-semibold text-(--sea-ink)"
										>
											{t("common.color")}
										</label>
										<div className="flex items-center gap-3">
											<label
												className="h-8 w-8 cursor-pointer rounded-full border border-(--line)"
												style={{ backgroundColor: importDraft.color }}
											>
												<input
													id="calendar-import-color"
													type="color"
													value={importDraft.color}
													onChange={(e) =>
														setImportDraft((p) =>
															p ? { ...p, color: e.target.value } : p,
														)
													}
													className="sr-only"
												/>
											</label>
											<button
												type="button"
												onClick={() =>
													setImportDraft((p) =>
														p ? { ...p, color: randomBrightColor() } : p,
													)
												}
												className="rounded-lg border border-(--line) bg-(--surface) px-3 py-2 text-xs font-semibold text-(--sea-ink-soft) hover:bg-(--link-bg-hover)"
											>
												{t("common.random")}
											</button>
										</div>
									</div>
									<div className="mt-3">
										<label className="flex items-center gap-2 text-xs font-semibold text-(--sea-ink) cursor-pointer">
											<input
												type="checkbox"
												checked={importDraft.visible ?? true}
												onChange={(e) =>
													setImportDraft((p) =>
														p ? { ...p, visible: e.target.checked } : p,
													)
												}
												className="h-4 w-4 rounded border-(--line) text-(--brand) focus:ring-2 focus:ring-(--brand)/40"
											/>
											<span>{t("calendar.visibleOnCalendar")}</span>
										</label>
									</div>
									<div className="mt-3">
										<label className="flex items-center gap-2 text-xs font-semibold text-(--sea-ink) cursor-pointer">
											<input
												type="checkbox"
												checked={importDraft.notificationsEnabled ?? true}
												onChange={(e) =>
													setImportDraft((p) =>
														p
															? {
																	...p,
																	notificationsEnabled: e.target.checked,
																}
															: p,
													)
												}
												className="h-4 w-4 rounded border-(--line) text-(--brand) focus:ring-2 focus:ring-(--brand)/40"
											/>
											<span>{t("calendar.sendReminders")}</span>
										</label>
									</div>
									<div className="mt-4 flex justify-end gap-2">
										<button
											type="button"
											onClick={() => setImportDraft(null)}
											className="rounded-lg border border-(--line) px-4 py-2 text-xs font-semibold"
										>
											{t("common.cancel")}
										</button>
										<button
											type="submit"
											disabled={!importDraft || importMutation.isPending}
											className="rounded-lg bg-(--brand) px-4 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
										>
											<UploadCloud size={14} className="inline-block mr-2" />
											{importMutation.isPending
												? t("calendar.importing")
												: t("calendar.import")}
										</button>
									</div>
								</div>
							)}
						</form>
					</div>
				</DashboardModal>
			)}

			{showEditImportModal && editingImport && (
				<DashboardModal
					open
					title={t("modal.editImport")}
					description={t("modal.editImportDescription")}
					onClose={() => {
						setShowEditImportModal(false);
						setEditingImport(null);
						setShowEditImportValidation(false);
					}}
					footer={
						<div className="flex justify-end gap-2">
							<button
								type="button"
								onClick={() => {
									setShowEditImportModal(false);
									setEditingImport(null);
									setShowEditImportValidation(false);
								}}
								className="rounded-lg border border-(--line) bg-(--surface-strong) px-4 py-2 text-xs font-semibold text-(--sea-ink) hover:bg-(--link-bg-hover)"
							>
								{t("common.cancel")}
							</button>
							<button
								type="button"
								onClick={() => {
									if (!editingImport) return;
									setShowEditImportValidation(true);
									if (editImportNameError) return;
									updateImportMutation.mutate({
										data: {
											importId: editingImport.id,
											name: editingImport.name.trim(),
											color: editingImport.color,
											visible: editingImport.visible ?? true,
										},
									});
								}}
								className="rounded-lg bg-(--brand) px-4 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
							>
								{t("common.save")}
							</button>
						</div>
					}
				>
					<form
						className="space-y-4"
						onSubmit={(e) => {
							e.preventDefault();
							if (!editingImport) return;
							setShowEditImportValidation(true);
							if (editImportNameError) return;
							updateImportMutation.mutate({
								data: {
									importId: editingImport.id,
									name: editingImport.name.trim(),
									color: editingImport.color,
									visible: editingImport.visible ?? true,
								},
							});
						}}
					>
						<div>
							<label
								htmlFor="calendar-edit-import-name"
								className="mb-1 block text-xs font-semibold text-(--sea-ink)"
							>
								{t("common.name")}
							</label>
							<input
								id="calendar-edit-import-name"
								value={editingImport.name}
								onChange={(e) =>
									setEditingImport((prev) =>
										prev ? { ...prev, name: e.target.value } : prev,
									)
								}
								className="h-10 w-full rounded-xl border border-(--line) bg-(--input-field-bg) px-3 text-sm"
								maxLength={120}
							/>
							{showEditImportValidation && editImportNameError && (
								<FieldError message={editImportNameError} />
							)}
						</div>
						<div>
							<label
								htmlFor="calendar-edit-import-color"
								className="mb-1 block text-xs font-semibold text-(--sea-ink)"
							>
								{t("common.color")}
							</label>
							<div className="flex items-center gap-3">
								<label
									className="h-8 w-8 cursor-pointer rounded-full border border-(--line)"
									style={{ backgroundColor: editingImport.color }}
								>
									<input
										id="calendar-edit-import-color"
										type="color"
										value={editingImport.color}
										onChange={(e) =>
											setEditingImport((prev) =>
												prev ? { ...prev, color: e.target.value } : prev,
											)
										}
										className="sr-only"
									/>
								</label>
								<button
									type="button"
									onClick={() =>
										setEditingImport((prev) =>
											prev ? { ...prev, color: randomBrightColor() } : prev,
										)
									}
									className="rounded-lg border border-(--line) bg-(--surface) px-3 py-2 text-xs font-semibold text-(--sea-ink-soft) hover:bg-(--link-bg-hover)"
								>
									{t("common.random")}
								</button>
							</div>
						</div>
						<div>
							<label className="flex items-center gap-2 text-xs font-semibold text-(--sea-ink) cursor-pointer">
								<input
									type="checkbox"
									checked={editingImport.visible ?? true}
									onChange={(e) =>
										setEditingImport((prev) =>
											prev ? { ...prev, visible: e.target.checked } : prev,
										)
									}
									className="h-4 w-4 rounded border-(--line) text-(--brand) focus:ring-2 focus:ring-(--brand)/40"
								/>
								<span>{t("calendar.visibleOnCalendar")}</span>
							</label>
						</div>
					</form>
				</DashboardModal>
			)}

			{importToDelete && (
				<DashboardModal
					open
					title={t("modal.removeImport")}
					description={t("modal.removeImportDescription")}
					onClose={() => setImportToDelete(null)}
					footer={
						<div className="flex justify-end gap-2">
							<button
								type="button"
								onClick={() => setImportToDelete(null)}
								className="rounded-lg border border-(--line) bg-(--surface-strong) px-4 py-2 text-xs font-semibold text-(--sea-ink) hover:bg-(--link-bg-hover)"
							>
								{t("common.cancel")}
							</button>
							<button
								type="button"
								onClick={() => {
									if (!importToDelete) return;
									deleteImportMutation.mutate({
										data: { importId: importToDelete.id },
									});
									setImportToDelete(null);
								}}
								className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
							>
								{t("common.remove")}
							</button>
						</div>
					}
				>
					<div>
						<p className="text-sm">{t("calendar.removeImportConfirm")}</p>
						<p className="text-xs text-(--sea-ink-soft) mt-2">
							{t("calendar.removeImportWarning")}
						</p>
					</div>
				</DashboardModal>
			)}
		</DashboardShell>
	);
}

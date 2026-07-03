import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import AdminShell from "#/components/admin/AdminShell";
import AdminUserDeleteModal from "#/components/admin/AdminUserDeleteModal";
import AdminUserEditModal from "#/components/admin/AdminUserEditModal";
import {
	deleteAdminGoal,
	deleteAdminSession,
	deleteAdminUser,
	getAdminUserDetail,
} from "#/lib/server/admin";
import { getAuthSession } from "#/lib/server/auth-session";

const userDetailParams = z.object({
	userId: z.string().min(1),
});

export const Route = createFileRoute("/$lang/admin/users/$userId")({
	params: {
		parse: (params) => userDetailParams.parse(params),
		stringify: ({ userId }) => ({ userId }),
	},
	loader: async ({ params }) => {
		const session = await getAuthSession();
		if (!session?.user || session.user.role !== "admin") {
			throw redirect({ to: "/" });
		}
		return { session, userId: params.userId };
	},
	component: AdminUserDetailPage,
});

type TabId = "settings" | "goals";

function statusBadgeClass(status: string) {
	switch (status) {
		case "active":
			return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
		case "completed":
			return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
		case "paused":
			return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
		case "failed":
			return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
		default:
			return "bg-(--sea-ink-soft)/[0.1] text-(--sea-ink-soft)";
	}
}

function AdminUserDetailPage() {
	const { t } = useTranslation();
	const { userId } = Route.useParams();
	const queryClient = useQueryClient();

	const [activeTab, setActiveTab] = useState<TabId>("settings");
	const [showEditModal, setShowEditModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
	const [deletingSessionId, setDeletingSessionId] = useState<string | null>(
		null,
	);

	const {
		data: detail,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["admin", "userDetail", userId],
		queryFn: () => getAdminUserDetail({ data: { userId } }),
		staleTime: 0,
		refetchOnMount: "always",
		refetchInterval: 10_000,
	});

	const handleDeleteGoal = useCallback(
		async (goalId: string) => {
			setDeletingGoalId(goalId);
			try {
				await deleteAdminGoal({ data: { goalId } });
				toast.success(t("admin.goalDeleted"));
				queryClient.invalidateQueries({
					queryKey: ["admin", "userDetail", userId],
				});
				queryClient.invalidateQueries({ queryKey: ["admin", "kpis"] });
			} catch {
				toast.error(t("common.somethingWentWrong"));
			} finally {
				setDeletingGoalId(null);
			}
		},
		[queryClient, t, userId],
	);

	const handleDeleteSession = useCallback(
		async (sessionId: string) => {
			setDeletingSessionId(sessionId);
			try {
				await deleteAdminSession({ data: { sessionId } });
				toast.success(t("admin.sessionDeleted"));
				queryClient.invalidateQueries({
					queryKey: ["admin", "userDetail", userId],
				});
				queryClient.invalidateQueries({ queryKey: ["admin", "kpis"] });
			} catch {
				toast.error(t("common.somethingWentWrong"));
			} finally {
				setDeletingSessionId(null);
			}
		},
		[queryClient, t, userId],
	);

	if (isLoading) {
		return (
			<AdminShell
				title={t("admin.userDetailTitle")}
				description={t("common.loading")}
			>
				<p className="text-sm text-(--sea-ink-soft)">{t("common.loading")}</p>
			</AdminShell>
		);
	}

	if (error || !detail) {
		return (
			<AdminShell title={t("admin.userDetailTitle")} description="">
				<p className="text-sm text-red-500">{t("common.somethingWentWrong")}</p>
			</AdminShell>
		);
	}

	const { user: viewedUser, goals: userGoals, recentSessions } = detail;
	const tabs: { id: TabId; label: string }[] = [
		{ id: "settings", label: t("admin.userSettings") },
		{ id: "goals", label: t("admin.goalsAndSessions") },
	];

	return (
		<AdminShell title={viewedUser.name} description={viewedUser.email}>
			{/* Tabs */}
			<div
				className="mb-6 flex gap-1 rounded-xl border border-(--line) bg-(--surface-strong) p-1"
				role="tablist"
			>
				{tabs.map((tab) => (
					<button
						key={tab.id}
						type="button"
						role="tab"
						aria-selected={activeTab === tab.id}
						onClick={() => setActiveTab(tab.id)}
						className={`flex-1 rounded-lg px-4 py-2 text-center text-sm font-semibold transition ${
							activeTab === tab.id
								? "bg-background text-(--sea-ink) shadow-sm"
								: "text-(--sea-ink-soft) hover:text-(--sea-ink)"
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{activeTab === "settings" ? (
				/* ═══════════════════ Settings Tab ═══════════════════ */
				<div className="space-y-6">
					{/* User info card */}
					<div className="rounded-2xl border border-(--line) bg-(--surface-strong) p-6">
						<div className="flex items-center justify-between">
							<h3 className="text-base font-bold text-(--sea-ink)">
								{t("admin.userInfo")}
							</h3>
							<button
								type="button"
								onClick={() => setShowEditModal(true)}
								className="inline-flex items-center gap-1.5 rounded-lg bg-(--brand) px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
							>
								<Pencil size={14} />
								{t("admin.editUser")}
							</button>
						</div>
						<div className="mt-4 grid gap-4 sm:grid-cols-2">
							<div>
								<p className="text-xs font-medium text-(--sea-ink-soft)">
									{t("common.name")}
								</p>
								<p className="mt-0.5 text-sm font-medium text-(--sea-ink)">
									{viewedUser.name}
								</p>
							</div>
							<div>
								<p className="text-xs font-medium text-(--sea-ink-soft)">
									{t("auth.email")}
								</p>
								<p className="mt-0.5 text-sm text-(--sea-ink)">
									{viewedUser.email}
								</p>
							</div>
							<div>
								<p className="text-xs font-medium text-(--sea-ink-soft)">
									{t("admin.role")}
								</p>
								<span className="mt-0.5 inline-block rounded-full bg-(--brand)/12 px-2.5 py-0.5 text-xs font-semibold text-(--brand)">
									{viewedUser.role}
								</span>
							</div>
							<div>
								<p className="text-xs font-medium text-(--sea-ink-soft)">
									{t("admin.registered")}
								</p>
								<p className="mt-0.5 text-sm text-(--sea-ink)">
									{viewedUser.createdAt
										? new Date(viewedUser.createdAt).toLocaleDateString()
										: "—"}
								</p>
							</div>
						</div>
					</div>

					{/* Danger Zone */}
					<div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 dark:border-red-900/40 dark:bg-red-950/10">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-base font-bold text-red-600 dark:text-red-400">
									{t("admin.dangerZone")}
								</h3>
								<p className="mt-0.5 text-xs text-(--sea-ink-soft)">
									{t("admin.dangerZoneDescription")}
								</p>
							</div>
							<button
								type="button"
								onClick={() => setShowDeleteModal(true)}
								className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
							>
								<Trash2 size={14} />
								{t("admin.deleteUserShort")}
							</button>
						</div>
					</div>
				</div>
			) : (
				/* ═══════════════ Goals & Sessions Tab ═══════════════ */
				<div className="space-y-8">
					{/* Goals section */}
					<section>
						<h2 className="mb-4 text-lg font-bold text-(--sea-ink)">
							{t("nav.goals")} ({userGoals.length})
						</h2>
						{userGoals.length > 0 ? (
							<div className="overflow-x-auto rounded-2xl border border-(--line)">
								<table className="w-full text-left text-sm">
									<thead className="border-b border-(--line) bg-(--surface-strong)">
										<tr>
											<th className="px-4 py-3 font-semibold text-(--sea-ink)">
												{t("admin.goalTitle")}
											</th>
											<th className="px-4 py-3 font-semibold text-(--sea-ink)">
												{t("admin.status")}
											</th>
											<th className="px-4 py-3 font-semibold text-(--sea-ink)">
												{t("common.category")}
											</th>
											<th className="px-4 py-3 font-semibold text-(--sea-ink)">
												{t("admin.progress")}
											</th>
											<th className="px-4 py-3 font-semibold text-(--sea-ink)">
												{t("admin.period")}
											</th>
											<th className="px-4 py-3 font-semibold text-(--sea-ink)">
												{t("admin.actions")}
											</th>
										</tr>
									</thead>
									<tbody>
										{userGoals.map((g) => (
											<tr
												key={g.id}
												className="border-b border-(--line) transition hover:bg-(--link-bg-hover)"
											>
												<td className="px-4 py-3 font-medium text-(--sea-ink)">
													{g.title}
												</td>
												<td className="px-4 py-3">
													<span
														className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(g.status)}`}
													>
														{g.status}
													</span>
												</td>
												<td className="px-4 py-3 text-(--sea-ink-soft)">
													{g.category}
												</td>
												<td className="px-4 py-3">
													<div className="flex items-center gap-2">
														<div className="h-2 w-20 overflow-hidden rounded-full bg-(--line)">
															<div
																className="h-full rounded-full bg-(--brand) transition-all"
																style={{
																	width: `${g.completionRate}%`,
																}}
															/>
														</div>
														<span className="text-xs text-(--sea-ink-soft)">
															{g.completionRate}%
														</span>
													</div>
												</td>
												<td className="px-4 py-3 text-xs text-(--sea-ink-soft)">
													{g.startDate
														? new Date(g.startDate).toLocaleDateString()
														: "—"}{" "}
													–{" "}
													{g.endDate
														? new Date(g.endDate).toLocaleDateString()
														: "—"}
												</td>
												<td className="px-4 py-3">
													<button
														type="button"
														disabled={deletingGoalId === g.id}
														className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-(--sea-ink-soft) transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
														aria-label={t("common.delete")}
														onClick={() => handleDeleteGoal(g.id)}
													>
														<Trash2 size={16} />
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : (
							<p className="text-sm text-(--sea-ink-soft)">
								{t("admin.noGoals")}
							</p>
						)}
					</section>

					{/* Recent sessions section */}
					<section>
						<h2 className="mb-4 text-lg font-bold text-(--sea-ink)">
							{t("admin.recentSessions")}
						</h2>
						{recentSessions.length > 0 ? (
							<div className="overflow-x-auto rounded-2xl border border-(--line)">
								<table className="w-full text-left text-sm">
									<thead className="border-b border-(--line) bg-(--surface-strong)">
										<tr>
											<th className="px-4 py-3 font-semibold text-(--sea-ink)">
												{t("common.date")}
											</th>
											<th className="px-4 py-3 font-semibold text-(--sea-ink)">
												{t("common.duration")}
											</th>
											<th className="px-4 py-3 font-semibold text-(--sea-ink)">
												{t("common.category")}
											</th>
											<th className="px-4 py-3 font-semibold text-(--sea-ink)">
												{t("admin.goal")}
											</th>
											<th className="px-4 py-3 font-semibold text-(--sea-ink)">
												{t("admin.actions")}
											</th>
										</tr>
									</thead>
									<tbody>
										{recentSessions.map((s) => (
											<tr
												key={s.id}
												className="border-b border-(--line) transition hover:bg-(--link-bg-hover)"
											>
												<td className="px-4 py-3 text-(--sea-ink-soft)">
													{s.startIso
														? new Date(s.startIso).toLocaleDateString()
														: "—"}
												</td>
												<td className="px-4 py-3 text-(--sea-ink-soft)">
													{s.durationSec != null
														? `${Math.round(s.durationSec / 60)} min`
														: "—"}
												</td>
												<td className="px-4 py-3 text-(--sea-ink-soft)">
													{s.category}
												</td>
												<td className="px-4 py-3 text-(--sea-ink-soft)">
													{s.goalTitle ?? "—"}
												</td>
												<td className="px-4 py-3">
													<button
														type="button"
														disabled={deletingSessionId === s.id}
														className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-(--sea-ink-soft) transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
														aria-label={t("common.delete")}
														onClick={() => handleDeleteSession(s.id)}
													>
														<Trash2 size={16} />
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : (
							<p className="text-sm text-(--sea-ink-soft)">
								{t("admin.noSessions")}
							</p>
						)}
					</section>
				</div>
			)}

			{/* Modals */}
			{showEditModal && (
				<AdminUserEditModal
					user={viewedUser}
					onClose={() => setShowEditModal(false)}
				/>
			)}
			{showDeleteModal && (
				<AdminUserDeleteModal
					user={viewedUser}
					isPending={false}
					onCancel={() => setShowDeleteModal(false)}
					onConfirm={async (id) => {
						setShowDeleteModal(false);
						try {
							await deleteAdminUser({ data: { userId: id } });
							toast.success(t("admin.userDeleted"));
							queryClient.invalidateQueries({
								queryKey: ["admin", "userDetail", userId],
							});
							queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
							queryClient.invalidateQueries({ queryKey: ["admin", "kpis"] });
						} catch {
							toast.error(t("common.somethingWentWrong"));
						}
					}}
				/>
			)}
		</AdminShell>
	);
}

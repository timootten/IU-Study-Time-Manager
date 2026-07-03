import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
	type ColumnDef,
	type ColumnFiltersState,
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import {
	ArrowDown,
	ArrowUp,
	ChevronLeft,
	ChevronRight,
	ChevronsUpDown,
	Search,
	Trash2,
	X,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import AdminShell from "#/components/admin/AdminShell";
import AdminUserDeleteModal from "#/components/admin/AdminUserDeleteModal";
import { useLangParam, withLang } from "#/lib/i18n/paths";
import { deleteAdminUser, getAdminUsers } from "#/lib/server/admin";
import { getAuthSession } from "#/lib/server/auth-session";

interface AdminUser {
	id: string;
	name: string;
	email: string;
	role: string;
	createdAt: string | Date;
	goalCount: number;
	sessionCount: number;
	achievementCount: number;
}

const columnHelper = createColumnHelper<AdminUser>();

export const Route = createFileRoute("/$lang/admin/users/")({
	loader: async () => {
		const session = await getAuthSession();
		if (!session?.user || session.user.role !== "admin") {
			throw redirect({ to: "/" });
		}
		return { session };
	},
	component: AdminUsersPage,
});

function AdminUsersPage() {
	const { t } = useTranslation();
	const lang = useLangParam();
	const queryClient = useQueryClient();
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [deleteModalUser, setDeleteModalUser] = useState<AdminUser | null>(
		null,
	);
	const {
		data: users = [],
		isLoading,
		error,
	} = useQuery({
		queryKey: ["admin", "users"],
		queryFn: () => getAdminUsers(),
		staleTime: 0,
		refetchOnMount: "always",
		refetchInterval: 5_000,
	});

	const handleDelete = useCallback(
		async (userId: string) => {
			setDeletingId(userId);
			try {
				await deleteAdminUser({ data: { userId } });
				toast.success(t("admin.userDeleted"));
				queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
				queryClient.invalidateQueries({ queryKey: ["admin", "kpis"] });
			} catch {
				toast.error(t("common.somethingWentWrong"));
			} finally {
				setDeletingId(null);
				setDeleteModalUser(null);
			}
		},
		[queryClient, t],
	);

	// Column definitions
	const columns: ColumnDef<AdminUser>[] = useMemo(
		() => [
			columnHelper.accessor("name", {
				header: t("common.name"),
				cell: (info) => (
					<div className="font-medium text-(--sea-ink)">{info.getValue()}</div>
				),
				enableSorting: true,
				enableGlobalFilter: true,
			}),
			columnHelper.accessor("email", {
				header: t("auth.email"),
				cell: (info) => (
					<div className="text-(--sea-ink-soft)">{info.getValue()}</div>
				),
				enableSorting: true,
				enableGlobalFilter: true,
			}),
			columnHelper.accessor("role", {
				header: t("admin.role"),
				cell: (info) => {
					const role = info.getValue();
					return (
						<span
							className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
								role === "admin"
									? "bg-(--brand)/12 text-(--brand)"
									: "bg-(--sea-ink-soft)/10 text-(--sea-ink-soft)"
							}`}
						>
							{role}
						</span>
					);
				},
				enableSorting: true,
				enableGlobalFilter: true,
			}),
			columnHelper.accessor("createdAt", {
				header: t("admin.registered"),
				cell: (info) => {
					const date = info.getValue();
					return (
						<div className="text-(--sea-ink-soft)">
							{date ? new Date(date).toLocaleDateString() : "—"}
						</div>
					);
				},
				enableSorting: true,
				enableGlobalFilter: true,
			}),
			columnHelper.accessor("goalCount", {
				header: t("nav.goals"),
				cell: (info) => (
					<div className="text-(--sea-ink-soft)">{info.getValue()}</div>
				),
				enableSorting: true,
				enableGlobalFilter: false,
			}),
			columnHelper.accessor("sessionCount", {
				header: t("admin.sessions"),
				cell: (info) => (
					<div className="text-(--sea-ink-soft)">{info.getValue()}</div>
				),
				enableSorting: true,
				enableGlobalFilter: false,
			}),
			columnHelper.accessor("achievementCount", {
				header: t("nav.achievements"),
				cell: (info) => (
					<div className="text-(--sea-ink-soft)">{info.getValue()}</div>
				),
				enableSorting: true,
				enableGlobalFilter: false,
			}),
			columnHelper.display({
				id: "actions",
				header: t("admin.actions"),
				enableGlobalFilter: false,
				cell: (info) => {
					const user = info.row.original;
					return (
						<div className="flex items-center gap-2">
							<Link
								to={withLang(lang, "/admin/users/$userId")}
								params={{ userId: user.id }}
								className="btn-brand inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-semibold no-underline"
							>
								{t("admin.view")}
							</Link>
							<button
								type="button"
								className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-(--sea-ink-soft) transition hover:bg-red-50 hover:text-red-500"
								aria-label={t("common.delete")}
								onClick={() => setDeleteModalUser(user)}
							>
								<Trash2 size={16} />
							</button>
						</div>
					);
				},
			}),
		],
		[t, lang],
	);

	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [globalFilter, setGlobalFilter] = useState("");

	const table = useReactTable({
		data: users,
		columns,
		state: {
			sorting,
			columnFilters,
			globalFilter,
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		globalFilterFn: "includesString",
		initialState: { pagination: { pageSize: 10 } },
	});

	const pageIndex = table.getState().pagination.pageIndex;
	const totalPages = table.getPageCount();
	const canPreviousPage = table.getCanPreviousPage();
	const canNextPage = table.getCanNextPage();
	const roleFilterValue =
		(table.getColumn("role")?.getFilterValue() as string | undefined) ?? "all";

	return (
		<AdminShell
			title={t("admin.usersTitle")}
			description={t("admin.usersSubtitle")}
		>
			{error ? (
				<div className="rounded-lg border border-red-500/30 bg-red-50 p-4 text-sm text-red-600">
					{t("common.somethingWentWrong")}
				</div>
			) : (
				<div className="space-y-4">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
						<div className="relative w-full sm:max-w-sm">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--sea-ink-soft)" />
							<input
								value={globalFilter}
								onChange={(event) => setGlobalFilter(event.target.value)}
								placeholder={t("common.search")}
								className="h-9 w-full rounded-lg border border-(--line) bg-background pl-9 pr-9 text-sm text-(--sea-ink) placeholder:text-(--sea-ink-soft) transition focus:border-(--brand) focus:outline-none focus:ring-1 focus:ring-(--brand)/30"
							/>
							{globalFilter && (
								<button
									onClick={() => setGlobalFilter("")}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-(--sea-ink-soft) transition hover:text-(--sea-ink)"
									type="button"
								>
									<X className="h-4 w-4" />
								</button>
							)}
						</div>
						<div className="flex items-center gap-2">
							<span className="text-xs font-semibold text-(--sea-ink-soft)">
								{t("admin.role")}
							</span>
							<select
								value={roleFilterValue}
								onChange={(event) => {
									const value = event.target.value;
									table
										.getColumn("role")
										?.setFilterValue(value === "all" ? undefined : value);
								}}
								className="h-9 rounded-lg border border-(--line) bg-background px-3 text-sm text-(--sea-ink) transition focus:border-(--brand) focus:outline-none"
							>
								<option value="all">
									{t("common.all", { defaultValue: "All" })}
								</option>
								<option value="admin">Admin</option>
								<option value="user">User</option>
							</select>
						</div>
					</div>

					<div className="overflow-x-auto rounded-2xl border border-(--line)">
						<table className="w-full text-sm">
							<thead className="border-b border-(--line) bg-(--surface-strong)">
								{table.getHeaderGroups().map((headerGroup) => (
									<tr key={headerGroup.id}>
										{headerGroup.headers.map((header) => {
											const sortState = header.column.getIsSorted();
											const canSort = header.column.getCanSort();
											return (
												<th
													key={header.id}
													className="px-4 py-3 text-left font-semibold text-(--sea-ink)"
												>
													{header.isPlaceholder ? null : canSort ? (
														<button
															onClick={header.column.getToggleSortingHandler()}
															className="inline-flex items-center gap-1.5 font-semibold text-(--sea-ink) transition hover:text-(--brand)"
															type="button"
														>
															{flexRender(
																header.column.columnDef.header,
																header.getContext(),
															)}
															<span className="ml-1">
																{sortState === "desc" ? (
																	<ArrowDown className="h-4 w-4" />
																) : sortState === "asc" ? (
																	<ArrowUp className="h-4 w-4" />
																) : (
																	<ChevronsUpDown className="h-3 w-3 opacity-50" />
																)}
															</span>
														</button>
													) : (
														flexRender(
															header.column.columnDef.header,
															header.getContext(),
														)
													)}
												</th>
											);
										})}
									</tr>
								))}
							</thead>
							<tbody>
								{isLoading ? (
									<tr>
										<td
											colSpan={columns.length}
											className="px-4 py-8 text-center text-sm text-(--sea-ink-soft)"
										>
											Loading...
										</td>
									</tr>
								) : table.getRowModel().rows.length === 0 ? (
									<tr>
										<td
											colSpan={columns.length}
											className="px-4 py-8 text-center text-sm text-(--sea-ink-soft)"
										>
											{t("common.noResults")}
										</td>
									</tr>
								) : (
									table.getRowModel().rows.map((row) => (
										<tr
											key={row.id}
											className="border-b border-(--line) transition hover:bg-(--link-bg-hover)"
										>
											{row.getVisibleCells().map((cell) => (
												<td key={cell.id} className="px-4 py-3">
													{flexRender(
														cell.column.columnDef.cell,
														cell.getContext(),
													)}
												</td>
											))}
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>

					<div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
						<div className="text-xs text-(--sea-ink-soft)">
							{t("admin.showingPage", {
								page: pageIndex + 1,
								totalPages: Math.max(1, totalPages),
								totalRows: table.getFilteredRowModel().rows.length,
							})}
						</div>
						<div className="flex items-center gap-1">
							<button
								onClick={() => table.previousPage()}
								disabled={!canPreviousPage}
								className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-(--line) transition ${
									canPreviousPage
										? "cursor-pointer hover:bg-(--link-bg-hover)"
										: "opacity-50"
								}`}
								type="button"
								title="Previous page"
							>
								<ChevronLeft className="h-4 w-4" />
							</button>
							<input
								type="number"
								min={1}
								max={Math.max(1, totalPages)}
								value={pageIndex + 1}
								onChange={(event) => {
									const nextPage = event.target.value
										? Number(event.target.value) - 1
										: 0;
									const clamped = Math.max(
										0,
										Math.min(nextPage, Math.max(0, totalPages - 1)),
									);
									table.setPageIndex(clamped);
								}}
								className="h-8 w-12 rounded-lg border border-(--line) bg-background px-2 text-center text-xs text-(--sea-ink) transition focus:border-(--brand) focus:outline-none"
							/>
							<button
								onClick={() => table.nextPage()}
								disabled={!canNextPage}
								className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-(--line) transition ${
									canNextPage
										? "cursor-pointer hover:bg-(--link-bg-hover)"
										: "opacity-50"
								}`}
								type="button"
								title="Next page"
							>
								<ChevronRight className="h-4 w-4" />
							</button>
						</div>
					</div>
				</div>
			)}
			{deleteModalUser && (
				<AdminUserDeleteModal
					user={deleteModalUser}
					isPending={deletingId === deleteModalUser.id}
					onCancel={() => setDeleteModalUser(null)}
					onConfirm={handleDelete}
				/>
			)}
		</AdminShell>
	);
}

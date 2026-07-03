import { flexRender, type Table as TanStackTable } from "@tanstack/react-table";
import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";
import { cn } from "#/lib/utils";

interface DataTableProps<TData> {
	table: TanStackTable<TData>;
	isLoading?: boolean;
	emptyMessage?: string;
	columns: number;
}

export function DataTable<TData>({
	table,
	isLoading,
	emptyMessage = "No data available",
	columns,
}: DataTableProps<TData>) {
	const { pageIndex, pageSize } = table.getState().pagination;
	const totalPages = table.getPageCount();
	const canPreviousPage = table.getCanPreviousPage();
	const canNextPage = table.getCanNextPage();

	return (
		<div className="space-y-4">
			<div className="overflow-x-auto rounded-2xl border border-(--line)">
				<table className="w-full text-sm">
					<thead className="border-b border-(--line) bg-(--surface-strong)">
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<th
										key={header.id}
										className="px-4 py-3 text-left font-semibold text-(--sea-ink)"
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody>
						{isLoading ? (
							<tr>
								<td colSpan={columns} className="px-4 py-8 text-center">
									<div className="flex items-center justify-center gap-2">
										<div className="h-4 w-4 animate-spin rounded-full border-2 border-(--line) border-t-(--brand)" />
										<span className="text-sm text-(--sea-ink-soft)">
											Loading...
										</span>
									</div>
								</td>
							</tr>
						) : table.getRowModel().rows?.length ? (
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
						) : (
							<tr>
								<td
									colSpan={columns}
									className="px-4 py-8 text-center text-sm text-(--sea-ink-soft)"
								>
									{emptyMessage}
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{/* Pagination */}
			<div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
				<div className="text-xs text-(--sea-ink-soft)">
					Showing page {pageIndex + 1} of {Math.max(1, totalPages)} (
					{table.getFilteredRowModel().rows.length} total)
				</div>

				<div className="flex items-center gap-1">
					<button
						onClick={() => table.setPageIndex(0)}
						disabled={!canPreviousPage}
						className={cn(
							"inline-flex h-8 w-8 items-center justify-center rounded-lg border border-(--line) transition",
							canPreviousPage
								? "cursor-pointer hover:bg-(--link-bg-hover)"
								: "opacity-50",
						)}
						type="button"
						title="First page"
					>
						<ChevronsLeft className="h-4 w-4" />
					</button>
					<button
						onClick={() => table.previousPage()}
						disabled={!canPreviousPage}
						className={cn(
							"inline-flex h-8 w-8 items-center justify-center rounded-lg border border-(--line) transition",
							canPreviousPage
								? "cursor-pointer hover:bg-(--link-bg-hover)"
								: "opacity-50",
						)}
						type="button"
						title="Previous page"
					>
						<ChevronLeft className="h-4 w-4" />
					</button>

					<input
						type="number"
						min={1}
						max={totalPages}
						value={pageIndex + 1}
						onChange={(e) => {
							const page = e.target.value ? Number(e.target.value) - 1 : 0;
							table.setPageIndex(Math.max(0, Math.min(page, totalPages - 1)));
						}}
						className="h-8 w-12 rounded-lg border border-(--line) bg-(--background) px-2 text-center text-xs text-(--sea-ink) transition focus:border-(--brand) focus:outline-none"
					/>

					<button
						onClick={() => table.nextPage()}
						disabled={!canNextPage}
						className={cn(
							"inline-flex h-8 w-8 items-center justify-center rounded-lg border border-(--line) transition",
							canNextPage
								? "cursor-pointer hover:bg-(--link-bg-hover)"
								: "opacity-50",
						)}
						type="button"
						title="Next page"
					>
						<ChevronRight className="h-4 w-4" />
					</button>
					<button
						onClick={() => table.setPageIndex(totalPages - 1)}
						disabled={!canNextPage}
						className={cn(
							"inline-flex h-8 w-8 items-center justify-center rounded-lg border border-(--line) transition",
							canNextPage
								? "cursor-pointer hover:bg-(--link-bg-hover)"
								: "opacity-50",
						)}
						type="button"
						title="Last page"
					>
						<ChevronsRight className="h-4 w-4" />
					</button>

					<select
						value={pageSize}
						onChange={(e) => table.setPageSize(Number(e.target.value))}
						className="ml-2 rounded-lg border border-(--line) bg-(--background) px-2 py-1.5 text-xs text-(--sea-ink) transition focus:border-(--brand) focus:outline-none"
					>
						{[10, 25, 50, 100].map((size) => (
							<option key={size} value={size}>
								{size} rows
							</option>
						))}
					</select>
				</div>
			</div>
		</div>
	);
}

import type { Table } from "@tanstack/react-table";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "#/lib/utils";

interface DataTableToolbarProps<TData> {
	table: Table<TData>;
	searchPlaceholder?: string;
}

export function DataTableToolbar<TData>({
	table,
	searchPlaceholder = "Search...",
}: DataTableToolbarProps<TData>) {
	const [searchValue, setSearchValue] = useState("");

	// Debounced search
	useEffect(() => {
		const timer = setTimeout(() => {
			table.setGlobalFilter(searchValue);
		}, 300);

		return () => clearTimeout(timer);
	}, [searchValue, table]);

	const isFiltered =
		table.getState().globalFilter || table.getState().columnFilters.length > 0;

	return (
		<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div className="relative flex-1">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--sea-ink-soft)" />
				<input
					placeholder={searchPlaceholder}
					value={searchValue}
					onChange={(e) => setSearchValue(e.target.value)}
					className={cn(
						"h-9 w-full rounded-lg border border-(--line) bg-(--background) pl-9 pr-9 text-sm text-(--sea-ink) placeholder:text-(--sea-ink-soft) transition focus:border-(--brand) focus:outline-none focus:ring-1 focus:ring-(--brand)/30",
					)}
				/>
				{searchValue && (
					<button
						onClick={() => setSearchValue("")}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-(--sea-ink-soft) transition hover:text-(--sea-ink)"
						type="button"
					>
						<X className="h-4 w-4" />
					</button>
				)}
			</div>

			{isFiltered && (
				<button
					onClick={() => {
						setSearchValue("");
						table.resetColumnFilters();
						table.setGlobalFilter("");
					}}
					className="inline-flex h-9 items-center gap-2 rounded-lg border border-(--line) bg-(--background) px-3 text-sm font-semibold text-(--sea-ink-soft) transition hover:bg-(--link-bg-hover) hover:text-(--sea-ink)"
					type="button"
				>
					Reset
					<X className="h-4 w-4" />
				</button>
			)}
		</div>
	);
}

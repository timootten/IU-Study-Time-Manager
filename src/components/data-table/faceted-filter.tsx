import type { Column } from "@tanstack/react-table";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "#/lib/utils";

interface DataTableFacetedFilterProps<TData, TValue> {
	column?: Column<TData, TValue>;
	title: string;
	options: {
		label: string;
		value: string;
		icon?: React.ReactNode;
	}[];
}

export function DataTableFacetedFilter<TData, TValue>({
	column,
	title,
	options,
}: DataTableFacetedFilterProps<TData, TValue>) {
	const facets = column?.getFacetedUniqueValues();
	const filterValue = column?.getFilterValue();
	const selectedValues = new Set(Array.isArray(filterValue) ? filterValue : []);
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="relative inline-block">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className={cn(
					"inline-flex h-9 items-center gap-2 rounded-lg border border-(--line) bg-(--background) px-3 text-sm font-semibold transition hover:bg-(--link-bg-hover)",
					selectedValues.size > 0 && "border-(--brand) bg-(--brand)/5",
				)}
				type="button"
			>
				{title}
				{selectedValues.size > 0 && (
					<span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-(--brand)/20 text-xs text-(--brand) font-bold">
						{selectedValues.size}
					</span>
				)}
				<ChevronDown className="ml-1 h-4 w-4 opacity-50" />
			</button>

			{isOpen && (
				<>
					<button
						className="fixed inset-0 z-40 cursor-default"
						onClick={() => setIsOpen(false)}
						type="button"
						aria-label="Close filter menu"
					/>
					<div className="absolute right-0 top-full z-50 mt-1 min-w-48 rounded-lg border border-(--line) bg-(--background) shadow-lg">
						<div className="p-2">
							{options.map((option) => {
								const isSelected = selectedValues.has(option.value);
								return (
									<button
										key={option.value}
										onClick={() => {
											const newValues = new Set(selectedValues);
											if (isSelected) {
												newValues.delete(option.value);
											} else {
												newValues.add(option.value);
											}
											const filterValues = Array.from(newValues);
											column?.setFilterValue(
												filterValues.length ? filterValues : undefined,
											);
										}}
										className={cn(
											"flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition hover:bg-(--link-bg-hover)",
											isSelected &&
												"bg-(--brand)/10 text-(--brand) font-semibold",
										)}
										type="button"
									>
										<div
											className={cn(
												"flex h-4 w-4 items-center justify-center rounded border border-(--line)",
												isSelected && "border-(--brand) bg-(--brand)",
											)}
										>
											{isSelected && <Check className="h-3 w-3 text-white" />}
										</div>
										{option.icon && <span className="mr-1">{option.icon}</span>}
										<span className="flex-1 text-left">{option.label}</span>
										{facets?.get(option.value) && (
											<span className="ml-auto text-xs text-(--sea-ink-soft)">
												({facets.get(option.value)})
											</span>
										)}
									</button>
								);
							})}
						</div>
					</div>
				</>
			)}
		</div>
	);
}

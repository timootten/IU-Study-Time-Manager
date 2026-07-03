import { Plus } from "lucide-react";
import type { ReactNode } from "react";

type SectionCardProps = {
	title: string;
	count?: number;
	onAdd?: () => void;
	children: ReactNode;
};

export default function SectionCard({
	title,
	count,
	onAdd,
	children,
}: SectionCardProps) {
	return (
		<div className="rounded-2xl border border-(--line) bg-(--surface-strong) p-4 sm:p-5">
			<div className="mb-3 flex items-center justify-between">
				<h3 className="text-sm font-bold text-(--sea-ink)">
					{title}{" "}
					{count !== undefined && (
						<span className="ml-1 font-normal text-(--sea-ink-soft)">
							({count})
						</span>
					)}
				</h3>
				{onAdd && (
					<button
						type="button"
						onClick={onAdd}
						className="inline-flex items-center gap-1 rounded-lg bg-(--brand) px-2.5 py-1.5 text-[11px] font-bold text-white hover:opacity-90"
					>
						<Plus size={13} />{" "}
						{typeof window !== "undefined" && window.i18next
							? window.i18next.t("common.add")
							: "Hinzufügen"}
					</button>
				)}
			</div>
			{children}
		</div>
	);
}

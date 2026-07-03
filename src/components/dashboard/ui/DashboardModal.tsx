import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";

interface DashboardModalProps {
	open: boolean;
	title: string;
	description?: string;
	onClose: () => void;
	children: ReactNode;
	footer?: ReactNode;
	closeOnOverlayClick?: boolean;
}

export default function DashboardModal({
	open,
	title,
	description,
	onClose,
	children,
	footer,
	closeOnOverlayClick = true,
}: DashboardModalProps) {
	const dialogRef = useRef<HTMLDivElement | null>(null);
	const contentRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!open) {
			return;
		}

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};

		// Prevent background scrolling
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		window.addEventListener("keydown", onKeyDown);
		return () => {
			window.removeEventListener("keydown", onKeyDown);
			document.body.style.overflow = previousOverflow;
		};
	}, [onClose, open]);

	useEffect(() => {
		if (!open) {
			return;
		}

		const frame = window.requestAnimationFrame(() => {
			const preferredInContent = contentRef.current?.querySelector<HTMLElement>(
				"[data-autofocus], [autofocus]",
			);
			const fallbackInContent = contentRef.current?.querySelector<HTMLElement>(
				'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
			);
			const fallbackInDialog = dialogRef.current?.querySelector<HTMLElement>(
				'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
			);

			const focusTarget =
				preferredInContent ?? fallbackInContent ?? fallbackInDialog;

			if (focusTarget && !focusTarget.hasAttribute("disabled")) {
				focusTarget.focus({ preventScroll: true });
			}
		});

		return () => {
			window.cancelAnimationFrame(frame);
		};
	}, [open]);

	if (!open) {
		return null;
	}

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: Modal overlay with valid role and keyboard handler
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-3 sm:p-6"
			role="presentation"
			onClick={closeOnOverlayClick ? onClose : undefined}
			onKeyDown={(e) => {
				if (closeOnOverlayClick && e.key === "Escape") onClose();
			}}
		>
			<div
				ref={dialogRef}
				className="island-shell w-full max-w-2xl overflow-hidden rounded-3xl"
				role="dialog"
				aria-modal="true"
				onClick={(event) => event.stopPropagation()}
				onKeyDown={(event) => event.stopPropagation()}
			>
				<header className="flex items-start justify-between gap-3 border-b border-(--line) px-4 py-4 sm:px-6">
					<div>
						<h2 className="text-lg font-bold text-(--sea-ink)">{title}</h2>
						{description ? (
							<p className="mt-1 text-sm text-(--sea-ink-soft)">
								{description}
							</p>
						) : null}
					</div>
					<button
						type="button"
						onClick={onClose}
						className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--line) bg-(--surface-strong) text-(--sea-ink)"
					>
						<X size={16} />
					</button>
				</header>

				<div
					ref={contentRef}
					className="max-h-[70vh] overflow-y-auto px-4 py-4 sm:px-6"
				>
					{children}
				</div>

				{footer ? (
					<footer className="border-t border-(--line) px-4 py-4 sm:px-6">
						{footer}
					</footer>
				) : null}
			</div>
		</div>
	);
}

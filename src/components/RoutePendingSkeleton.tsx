export function RoutePendingSkeleton() {
	return (
		<section
			className="page-wrap min-h-[calc(100vh-96px)] pb-24 pt-8 sm:pb-28 sm:pt-12"
			aria-live="polite"
			aria-busy="true"
		>
			<div className="island-shell rounded-3xl p-6 sm:p-8">
				<div className="h-4 w-28 animate-pulse rounded-full bg-(--line)" />
				<div className="mt-4 h-10 w-2/3 animate-pulse rounded-xl bg-(--line) sm:h-12" />
				<div className="mt-4 space-y-3">
					<div className="h-4 w-full animate-pulse rounded-full bg-(--line)" />
					<div className="h-4 w-11/12 animate-pulse rounded-full bg-(--line)" />
					<div className="h-4 w-4/5 animate-pulse rounded-full bg-(--line)" />
				</div>
			</div>

			<div className="mt-6 grid gap-4 sm:grid-cols-2">
				<div className="island-shell rounded-2xl p-5 sm:p-6">
					<div className="h-4 w-32 animate-pulse rounded-full bg-(--line)" />
					<div className="mt-4 h-24 animate-pulse rounded-2xl bg-(--line)" />
				</div>
				<div className="island-shell rounded-2xl p-5 sm:p-6">
					<div className="h-4 w-28 animate-pulse rounded-full bg-(--line)" />
					<div className="mt-4 h-24 animate-pulse rounded-2xl bg-(--line)" />
				</div>
			</div>
		</section>
	);
}

import { useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

interface ServiceUnavailablePageProps {
	title?: string;
	description?: string;
}

export default function ServiceUnavailablePage({
	title = "",
	description = "",
}: ServiceUnavailablePageProps) {
	const { t } = useTranslation();
	const router = useRouter();

	const handleRetry = () => {
		void router.invalidate();
		window.location.reload();
	};

	return (
		<section className="page-wrap min-h-[calc(100vh-96px)] pb-24 pt-10 sm:pb-28 sm:py-14">
			<div className="hero-surface rounded-3xl px-6 py-8 sm:px-10 sm:py-10">
				<p className="island-kicker m-0">{t("errors.systemStatus")}</p>
				<h1 className="display-title mt-3 text-3xl leading-tight sm:text-4xl">
					{title || t("errors.serviceUnavailable")}
				</h1>
				<p className="mt-4 max-w-2xl text-sm text-(--sea-ink-soft) sm:text-base">
					{description || t("errors.serviceUnavailableDescription")}
				</p>
				<div className="mt-6">
					<button
						type="button"
						onClick={handleRetry}
						className="btn-brand rounded-xl px-4 py-2 text-sm font-semibold"
					>
						{t("common.tryAgain")}
					</button>
				</div>
			</div>
		</section>
	);
}

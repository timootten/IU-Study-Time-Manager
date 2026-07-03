import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
	useLocation,
	useRouter,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Toaster } from "sonner";
import CookieNotice from "../components/CookieNotice";
import DashboardBottomNav from "../components/dashboard/DashboardBottomNav";
import NotFoundPage from "../components/errors/NotFoundPage";
import Footer from "../components/Footer";
import Header from "../components/Header";
import OfflineState from "../components/OfflineState";
import PwaRegistration from "../components/PwaRegistration";
import { getServiceUnavailableMessage } from "../lib/errors/service-unavailable";
import { getAuthSession } from "../lib/server/auth-session";
import { getThemeMode } from "../lib/server/theme";
import "#/lib/i18n";
import { zodErrorMap } from "#/lib/i18n/zod-error-map";
import "../styles.css";
import { z } from "zod";
import i18n from "#/lib/i18n";

z.setErrorMap(zodErrorMap);

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	loader: async () => {
		let initialSession: Awaited<ReturnType<typeof getAuthSession>> = null;
		let initialTheme: Awaited<ReturnType<typeof getThemeMode>> = "dark";

		initialSession = await getAuthSession();

		try {
			initialTheme = await getThemeMode();
		} catch {
			initialTheme = "dark";
		}

		return { initialSession, initialTheme };
	},
	errorComponent: RootErrorComponent,
	notFoundComponent: NotFoundPage,
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				name: "description",
				content:
					"Track your IU study time efficiently. Plan modules, log study sessions, and analyze your progress with detailed statistics. Perfect for IU students managing their learning goals.",
			},
			{
				name: "theme-color",
				content: "#fcf7ef",
			},
			{
				name: "theme-color",
				media: "(prefers-color-scheme: light)",
				content: "#fcf7ef",
			},
			{
				name: "theme-color",
				media: "(prefers-color-scheme: dark)",
				content: "#08131b",
			},
			{
				name: "mobile-web-app-capable",
				content: "yes",
			},
			{
				name: "apple-mobile-web-app-capable",
				content: "yes",
			},
			{
				name: "apple-mobile-web-app-status-bar-style",
				content: "default",
			},
			{
				title: "Study Time Manager",
			},
		],
		links: [
			{
				rel: "preload",
				as: "font",
				type: "font/woff2",
				href: "/fonts/manrope-400-latin.woff2",
				crossOrigin: "anonymous",
			},
			{
				rel: "preload",
				as: "font",
				type: "font/woff2",
				href: "/fonts/manrope-500-latin.woff2",
				crossOrigin: "anonymous",
			},
			{
				rel: "preload",
				as: "font",
				type: "font/woff2",
				href: "/fonts/fraunces-500-latin.woff2",
				crossOrigin: "anonymous",
			},
			{
				rel: "stylesheet",
				href: "/fonts/fonts.css",
			},
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/icons/favicon.svg",
			},
			{
				rel: "apple-touch-icon",
				href: "/icons/apple-touch-icon.svg",
			},
			{
				rel: "mask-icon",
				href: "/icons/mask-icon.svg",
				color: "#0f8a8d",
			},
			{
				rel: "manifest",
				href: "/manifest.json",
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootErrorComponent({ error }: { error: unknown }) {
	const { t } = useTranslation();
	const router = useRouter();
	const location = useLocation();
	const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
	const showDashboardBottomNav = location.pathname.includes("/dashboard");
	const serviceUnavailableMessage = getServiceUnavailableMessage(error);
	const description = serviceUnavailableMessage ?? t("errors.connectionError");

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const onOnline = () => {
			void router.invalidate();
			window.location.reload();
		};

		window.addEventListener("online", onOnline);

		return () => {
			window.removeEventListener("online", onOnline);
		};
	}, [router]);

	if (isOffline) {
		return <OfflineState showDashboardBottomNav={showDashboardBottomNav} />;
	}

	return (
		<section className="page-wrap min-h-[calc(100vh-96px)] pb-24 pt-10 sm:pb-28 sm:py-14">
			<div className="hero-surface rounded-3xl px-6 py-8 sm:px-10 sm:py-10">
				<p className="island-kicker m-0">{t("errors.connectionKicker")}</p>
				<h1 className="display-title mt-3 text-3xl leading-tight sm:text-4xl">
					{t("errors.somethingWentWrong")}
				</h1>
				<p className="mt-4 max-w-2xl text-sm text-(--sea-ink-soft) sm:text-base">
					{description}
				</p>
			</div>

			{showDashboardBottomNav ? <DashboardBottomNav /> : null}
		</section>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	const { initialSession, initialTheme } = Route.useLoaderData();
	const router = useRouter();
	const location = useLocation();

	// Set language from URL BEFORE any translation-aware component renders.
	// $lang/route.tsx's beforeLoad runs too late — RootDocument's Header
	// uses useTranslation() before the child layout's beforeLoad fires.
	const urlLang = location.pathname.split("/")[1];
	if ((urlLang === "en" || urlLang === "de") && i18n.language !== urlLang) {
		i18n.changeLanguage(urlLang);
	}

	const [isOnline, setIsOnline] = useState(true);
	const [htmlLang, setHtmlLang] = useState(i18n.language);
	const showDashboardBottomNav =
		location.pathname.includes("/dashboard") ||
		location.pathname.includes("/admin");
	const allowOfflineContent =
		location.pathname.endsWith("/") || location.pathname.endsWith("/about");

	useEffect(() => {
		const handler = (lng: string) => {
			setHtmlLang(lng);
			z.setErrorMap(zodErrorMap);
		};
		i18n.on("languageChanged", handler);
		return () => i18n.off("languageChanged", handler);
	}, []);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		setIsOnline(window.navigator.onLine);

		const onOnline = () => {
			setIsOnline(true);
			void router.invalidate();
		};

		const onOffline = () => {
			setIsOnline(false);
		};

		window.addEventListener("online", onOnline);
		window.addEventListener("offline", onOffline);

		return () => {
			window.removeEventListener("online", onOnline);
			window.removeEventListener("offline", onOffline);
		};
	}, [router]);

	// Disable viewport zoom in PWA mode for a native app feel
	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const isPWA =
			window.matchMedia("(display-mode: standalone)").matches ||
			// @ts-expect-error - iOS standalone mode
			window.navigator.standalone === true;

		if (isPWA) {
			const viewport = document.querySelector('meta[name="viewport"]');
			if (viewport) {
				viewport.setAttribute(
					"content",
					"width=device-width, initial-scale=1, user-scalable=no, maximum-scale=1, minimum-scale=1",
				);
			}
		}
	}, []);

	return (
		<html
			lang={htmlLang}
			className={initialTheme}
			data-theme={initialTheme}
			style={{ colorScheme: initialTheme }}
			suppressHydrationWarning
		>
			<head>
				<HeadContent />
			</head>
			<body className="min-h-screen flex flex-col antialiased wrap-anywhere selection:bg-[rgba(79,184,178,0.24)]">
				<PwaRegistration />
				<Header initialSession={initialSession} />
				<main className="flex-1">
					{isOnline || allowOfflineContent ? (
						children
					) : (
						<OfflineState showDashboardBottomNav={showDashboardBottomNav} />
					)}
				</main>
				<div className={showDashboardBottomNav ? "lg:ml-[280px]" : undefined}>
					<Footer />
				</div>
				<Toaster position="top-right" richColors closeButton />
				<CookieNotice />
				<Scripts />
			</body>
		</html>
	);
}

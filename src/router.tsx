import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { RoutePendingSkeleton } from "#/components/RoutePendingSkeleton";
import { getQueryContext } from "./lib/query-context";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
	const context = getQueryContext();

	const router = createTanStackRouter({
		routeTree,
		context,
		scrollRestoration: true,
		defaultPendingComponent: RoutePendingSkeleton,
		defaultPendingMs: 0,
		defaultPendingMinMs: 150,
		defaultStaleTime: 5 * 60 * 1000,
		defaultPreload: "intent",
		defaultPreloadDelay: 0,
		defaultPreloadStaleTime: 5 * 60 * 1000,
	});

	setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient });

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}

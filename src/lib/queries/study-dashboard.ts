import { queryOptions } from "@tanstack/react-query";

import { getStudyDashboardSnapshot } from "#/lib/server/study-manager";

export const studyDashboardQueryKey = [
	"dashboard",
	"study-manager",
	"snapshot",
] as const;

function getRetryDelay(attempt: number): number {
	const baseDelay = 800;
	const maxDelay = 8_000;
	const exponentialDelay = baseDelay * 2 ** (attempt - 1);

	return Math.min(exponentialDelay, maxDelay);
}

export const studyDashboardQueryOptions = () =>
	queryOptions({
		queryKey: studyDashboardQueryKey,
		queryFn: () => getStudyDashboardSnapshot(),
		staleTime: 20_000,
		gcTime: 10 * 60 * 1000,
		refetchOnMount: false,
		refetchOnWindowFocus: "always",
		refetchOnReconnect: true,
		retry: 2,
		retryDelay: getRetryDelay,
		meta: {
			feature: "dashboard-study-manager",
			purpose: "hydrate planning, timer, and stats views from one source",
		},
	});

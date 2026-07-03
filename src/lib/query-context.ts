import { QueryClient } from "@tanstack/react-query";

function getDefaultRetryDelay(attempt: number): number {
	const baseDelay = 1_000;
	const maxDelay = 30_000;
	const exponentialDelay = baseDelay * 2 ** (attempt - 1);

	return Math.min(exponentialDelay, maxDelay);
}

export function getQueryContext() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				networkMode: "online",
				staleTime: 60 * 1000,
				gcTime: 30 * 60 * 1000,
				refetchOnWindowFocus: true,
				refetchOnReconnect: true,
				retry: 2,
				retryDelay: getDefaultRetryDelay,
			},
			mutations: {
				networkMode: "online",
				retry: 1,
				retryDelay: getDefaultRetryDelay,
			},
		},
	});

	return {
		queryClient,
	};
}

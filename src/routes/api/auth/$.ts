import { createFileRoute } from "@tanstack/react-router";
import { auth } from "#/lib/auth";
import { logServerError } from "#/lib/server/logger";

async function handleAuthRequest(request: Request) {
	try {
		return await auth.handler(request);
	} catch (error) {
		const requestUrl = new URL(request.url);

		logServerError("Authentication API request failed", error, {
			method: request.method,
			path: requestUrl.pathname,
		});

		return Response.json(
			{
				error: {
					code: "AUTH_SERVICE_UNAVAILABLE",
					message: "Authentication service is temporarily unavailable.",
				},
			},
			{ status: 500 },
		);
	}
}

export const Route = createFileRoute("/api/auth/$")({
	server: {
		handlers: {
			GET: ({ request }) => handleAuthRequest(request),
			POST: ({ request }) => handleAuthRequest(request),
		},
	},
});

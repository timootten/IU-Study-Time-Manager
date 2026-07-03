import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		DATABASE_URL: z.url(),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.url(),
		SMTP_HOST: z.string().min(1),
		SMTP_PORT: z.coerce.number().int().positive().default(587),
		SMTP_USER: z.string().min(1),
		SMTP_PASS: z.string().min(1),
		SMTP_FROM: z.string().min(1),
		VAPID_SUBJECT: z.string().min(1).default("mailto:admin@study-timer.app"),
		VAPID_PUBLIC_KEY: z.string().min(1),
		VAPID_PRIVATE_KEY: z.string().min(1),
		NOTIFICATION_POLL_INTERVAL_MS: z.coerce
			.number()
			.int()
			.positive()
			.default(60_000),
		NOTIFICATION_LOOKAHEAD_MS: z.coerce
			.number()
			.int()
			.positive()
			.default(90 * 60_000),
	},

	/**
	 * The prefix that client-side variables must have. This is enforced both at
	 * a type-level and at runtime.
	 */
	clientPrefix: "VITE_",

	client: {
		VITE_APP_URL: z.url(),
		VITE_VAPID_PUBLIC_KEY: z.string().min(1),
	},

	/**
	 * What object holds the environment variables at runtime. This is usually
	 * `process.env` or `import.meta.env`.
	 */
	runtimeEnv: { ...process.env, ...import.meta.env },

	/**
	 * By default, this library will feed the environment variables directly to
	 * the Zod validator.
	 *
	 * This means that if you have an empty string for a value that is supposed
	 * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
	 * it as a type mismatch violation. Additionally, if you have an empty string
	 * for a value that is supposed to be a string with a default value (e.g.
	 * `DOMAIN=` in an ".env" file), the default value will never be applied.
	 *
	 * In order to solve these issues, we recommend that all new projects
	 * explicitly specify this option as true.
	 */
	emptyStringAsUndefined: true,
});

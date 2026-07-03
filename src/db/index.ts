import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "#/env";
import { logger, logServerError } from "#/lib/server/logger";

import * as schema from "./schema.ts";

const pool = new Pool({
	connectionString: env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export interface DatabaseHealth {
	available: boolean;
	checkedAt: string;
	message: string;
}

const HEALTH_CHECK_CACHE_MS = 15_000;
const HEALTHY_MESSAGE = "Database connection is healthy.";
const UNAVAILABLE_MESSAGE =
	"Database is temporarily unavailable. Please try again shortly.";

let cachedHealth: DatabaseHealth | null = null;
let inFlightHealthCheck: Promise<DatabaseHealth> | null = null;

pool.on("error", (error) => {
	logServerError("Unexpected PostgreSQL pool error", error);
});

async function runDatabaseHealthCheck(source: "startup" | "request") {
	try {
		await db.execute(sql`select 1`);

		const healthyStatus: DatabaseHealth = {
			available: true,
			checkedAt: new Date().toISOString(),
			message: HEALTHY_MESSAGE,
		};

		cachedHealth = healthyStatus;
		return healthyStatus;
	} catch (error) {
		const unavailableStatus: DatabaseHealth = {
			available: false,
			checkedAt: new Date().toISOString(),
			message: UNAVAILABLE_MESSAGE,
		};

		cachedHealth = unavailableStatus;
		logServerError("Database health check failed", error, { source });
		return unavailableStatus;
	}
}

export async function getDatabaseHealth(options?: {
	force?: boolean;
	source?: "startup" | "request";
}) {
	const source = options?.source ?? "request";
	const forceCheck = options?.force ?? false;
	const now = Date.now();

	if (
		!forceCheck &&
		cachedHealth &&
		now - new Date(cachedHealth.checkedAt).getTime() < HEALTH_CHECK_CACHE_MS
	) {
		return cachedHealth;
	}

	if (inFlightHealthCheck) {
		return inFlightHealthCheck;
	}

	inFlightHealthCheck = runDatabaseHealthCheck(source).finally(() => {
		inFlightHealthCheck = null;
	});

	return inFlightHealthCheck;
}

void getDatabaseHealth({ force: true, source: "startup" }).then((health) => {
	if (health.available) {
		logger.info("Initial database connectivity check succeeded");
		return;
	}

	logger.warn(
		{ checkedAt: health.checkedAt },
		"Initial database connectivity check failed",
	);
});

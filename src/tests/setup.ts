import { vi } from "vitest";

// Mock database to prevent initialization during tests
vi.mock("#/db", () => ({
	db: {},
}));

// Set minimal environment variables to satisfy env validation
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.BETTER_AUTH_SECRET ??= "test-secret-key";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.SMTP_HOST ??= "localhost";
process.env.SMTP_USER ??= "test";
process.env.SMTP_PASS ??= "test";
process.env.SMTP_FROM ??= "test@example.com";
process.env.VAPID_PUBLIC_KEY ??= "test-key";
process.env.VAPID_PRIVATE_KEY ??= "test-key";

import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { and, count, eq, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "#/db";
import {
	achievements,
	goals,
	milestones,
	session,
	sessions,
	user,
} from "#/db/schema";
import { auth } from "#/lib/auth";
import { AppError, ErrorCode } from "#/lib/errors/app-error";
import {
	authMiddleware,
	errorLoggingMiddleware,
} from "#/lib/server/middleware";

// ── Helpers ───────────────────────────────────────────────────────────

function assertAdmin(context: {
	userId: string;
	user: { role?: string | null };
}) {
	if (context.user.role !== "admin") {
		throw new AppError(ErrorCode.FORBIDDEN);
	}
}

// ── getAdminKpis ──────────────────────────────────────────────────────

export const getAdminKpis = createServerFn({ method: "GET" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.handler(async ({ context }) => {
		assertAdmin(context);

		const [
			[userCount],
			[goalCounts],
			[sessionCount],
			[milestoneCount],
			[achievementCount],
			[trackedHours],
		] = await Promise.all([
			db.select({ total: count() }).from(user),
			db
				.select({
					total: count(),
					active: sql<number>`count(*) filter (where ${goals.status} = 'active')::int`,
					completed: sql<number>`count(*) filter (where ${goals.status} = 'completed')::int`,
				})
				.from(goals),
			db.select({ total: count() }).from(sessions),
			db.select({ total: count() }).from(milestones),
			db.select({ total: count() }).from(achievements),
			db
				.select({
					total: sql<number>`coalesce(sum(
            extract(epoch from (${sessions.endTime} - ${sessions.startTime})) / 3600
          ), 0)::float`,
				})
				.from(sessions)
				.where(and(isNotNull(sessions.startTime), isNotNull(sessions.endTime))),
		]);

		return {
			totalUsers: userCount.total,
			totalGoals: goalCounts.total,
			activeGoals: goalCounts.active,
			completedGoals: goalCounts.completed,
			totalSessions: sessionCount.total,
			totalMilestones: milestoneCount.total,
			totalAchievements: achievementCount.total,
			totalTrackedHours: Math.round((trackedHours.total as number) * 100) / 100,
		};
	});

// ── getAdminUsers ─────────────────────────────────────────────────────

export const getAdminUsers = createServerFn({ method: "GET" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.handler(async ({ context }) => {
		assertAdmin(context);

		const goalCounts = db
			.select({
				userId: goals.userId,
				cnt: count().as("goal_cnt"),
			})
			.from(goals)
			.groupBy(goals.userId)
			.as("goal_counts");

		const sessionCounts = db
			.select({
				userId: sessions.userId,
				cnt: count().as("session_cnt"),
			})
			.from(sessions)
			.groupBy(sessions.userId)
			.as("session_counts");

		const achievementCounts = db
			.select({
				userId: achievements.userId,
				cnt: count().as("achievement_cnt"),
			})
			.from(achievements)
			.groupBy(achievements.userId)
			.as("achievement_counts");

		const rows = await db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				emailVerified: user.emailVerified,
				createdAt: user.createdAt,
				role: user.role,
				banned: user.banned,
				banReason: user.banReason,
				goalCount: sql<number>`coalesce(${goalCounts.cnt}::int, 0)`,
				sessionCount: sql<number>`coalesce(${sessionCounts.cnt}::int, 0)`,
				achievementCount: sql<number>`coalesce(${achievementCounts.cnt}::int, 0)`,
			})
			.from(user)
			.leftJoin(goalCounts, eq(user.id, goalCounts.userId))
			.leftJoin(sessionCounts, eq(user.id, sessionCounts.userId))
			.leftJoin(achievementCounts, eq(user.id, achievementCounts.userId))
			.orderBy(sql`${user.createdAt} desc nulls last`);

		return rows.map((r) => ({
			id: r.id,
			name: r.name,
			email: r.email,
			emailVerified: r.emailVerified ?? false,
			createdAt: r.createdAt?.toISOString() ?? null,
			role: r.role ?? "user",
			banned: r.banned ?? false,
			banReason: r.banReason ?? null,
			goalCount: r.goalCount,
			sessionCount: r.sessionCount,
			achievementCount: r.achievementCount,
		}));
	});

// ── getAdminUserDetail ────────────────────────────────────────────────

export const getAdminUserDetail = createServerFn({ method: "GET" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(
		z.object({
			userId: z.string().min(1),
		}),
	)
	.handler(async ({ context, data }) => {
		assertAdmin(context);

		const [foundUser] = await db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				emailVerified: user.emailVerified,
				createdAt: user.createdAt,
				role: user.role,
				banned: user.banned,
				banReason: user.banReason,
			})
			.from(user)
			.where(eq(user.id, data.userId))
			.limit(1);

		if (!foundUser) {
			throw new AppError(ErrorCode.GOAL_NOT_FOUND);
		}

		const [userGoals, userSessions] = await Promise.all([
			db
				.select({
					id: goals.id,
					title: goals.title,
					status: goals.status,
					category: goals.category,
					targetHours: goals.targetHours,
					startDate: goals.startDate,
					endDate: goals.endDate,
					createdAt: goals.createdAt,
					actualHours: sql<number>`coalesce(sum(
            extract(epoch from (${sessions.endTime} - ${sessions.startTime})) / 3600
          ), 0)::float`,
				})
				.from(goals)
				.leftJoin(sessions, eq(sessions.goalId, goals.id))
				.where(eq(goals.userId, data.userId))
				.groupBy(goals.id)
				.orderBy(sql`${goals.createdAt} desc`),
			db
				.select({
					id: sessions.id,
					goalId: sessions.goalId,
					goalTitle: goals.title,
					startTime: sessions.startTime,
					endTime: sessions.endTime,
					category: sessions.category,
					status: goals.status,
				})
				.from(sessions)
				.leftJoin(goals, eq(goals.id, sessions.goalId))
				.where(eq(sessions.userId, data.userId))
				.orderBy(sql`${sessions.startTime} desc nulls last`)
				.limit(20),
		]);

		return {
			user: {
				id: foundUser.id,
				name: foundUser.name,
				email: foundUser.email,
				emailVerified: foundUser.emailVerified ?? false,
				createdAt: foundUser.createdAt?.toISOString() ?? null,
				role: foundUser.role ?? "user",
				banned: foundUser.banned ?? false,
				banReason: foundUser.banReason ?? null,
			},
			goals: userGoals.map((g) => {
				const completionRate =
					g.targetHours > 0
						? Math.min(Math.round((g.actualHours / g.targetHours) * 100), 100)
						: 0;
				return {
					id: g.id,
					title: g.title,
					status: g.status,
					category: g.category,
					targetHours: g.targetHours,
					startDate: g.startDate?.toISOString() ?? null,
					endDate: g.endDate?.toISOString() ?? null,
					createdAt: g.createdAt?.toISOString() ?? null,
					completionRate,
				};
			}),
			recentSessions: userSessions.map((s) => ({
				id: s.id,
				goalId: s.goalId,
				goalTitle: s.goalTitle ?? null,
				startIso: s.startTime?.toISOString() ?? null,
				endIso: s.endTime?.toISOString() ?? null,
				durationSec:
					s.startTime && s.endTime
						? Math.round((s.endTime.getTime() - s.startTime.getTime()) / 1000)
						: null,
				category: s.category,
				status: s.status ?? null,
			})),
		};
	});

// ── deleteAdminUser ───────────────────────────────────────────────────

export const deleteAdminUser = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(
		z.object({
			userId: z.string().min(1),
		}),
	)
	.handler(async ({ context, data }) => {
		assertAdmin(context);

		if (context.userId === data.userId) {
			throw new AppError(ErrorCode.FORBIDDEN);
		}

		// Delete the user — cascade will handle related records.
		await db.delete(user).where(eq(user.id, data.userId));

		return { success: true };
	});

// ── deleteAdminGoal ───────────────────────────────────────────────────

export const deleteAdminGoal = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(
		z.object({
			goalId: z.string().min(1),
		}),
	)
	.handler(async ({ context, data }) => {
		assertAdmin(context);

		const [existing] = await db
			.select({ id: goals.id })
			.from(goals)
			.where(eq(goals.id, data.goalId))
			.limit(1);

		if (!existing) {
			throw new AppError(ErrorCode.GOAL_NOT_FOUND);
		}

		await db.delete(goals).where(eq(goals.id, data.goalId));

		return { success: true };
	});

// ── deleteAdminSession ────────────────────────────────────────────────

export const deleteAdminSession = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(
		z.object({
			sessionId: z.string().min(1),
		}),
	)
	.handler(async ({ context, data }) => {
		assertAdmin(context);

		await db.delete(sessions).where(eq(sessions.id, data.sessionId));

		return { success: true };
	});

// ── updateAdminUser ──────────────────────────────────────────────────

export const updateAdminUser = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(
		z.object({
			userId: z.string().min(1),
			name: z.string().min(1).optional(),
			email: z.string().email().optional(),
			role: z.string().optional(),
			emailVerified: z.boolean().optional(),
			banned: z.boolean().optional(),
			banReason: z.string().nullable().optional(),
		}),
	)
	.handler(async ({ context, data }) => {
		assertAdmin(context);

		// Admins dürfen auch ihr eigenes Profil bearbeiten
		const headers = new Headers(getRequestHeaders());

		// Use the admin plugin's dedicated updateUser endpoint for fields
		// that better-auth handles properly (name, email, role, banned, banReason)
		const updateData: Record<string, unknown> = {};
		if (data.name !== undefined) updateData.name = data.name;
		if (data.email !== undefined) updateData.email = data.email;
		if (data.role !== undefined) updateData.role = data.role;
		if (data.banned !== undefined) updateData.banned = data.banned;
		if (data.banReason !== undefined) updateData.banReason = data.banReason;

		if (Object.keys(updateData).length > 0) {
			await auth.api.adminUpdateUser({
				body: {
					userId: data.userId,
					data: updateData,
				},
				headers,
			});
		}

		// emailVerified wird direkt per Drizzle gesetzt, da better-auth
		// dieses Feld nicht zuverlässig über die adminUpdateUser-API aktualisiert
		if (data.emailVerified !== undefined) {
			await db
				.update(user)
				.set({ emailVerified: data.emailVerified })
				.where(eq(user.id, data.userId));
		}

		// Beim Bannen alle aktiven Sessions des Users löschen,
		// damit er sofort ausgesperrt wird und sich nicht erst ausloggen muss
		if (data.banned === true) {
			await db.delete(session).where(eq(session.userId, data.userId));
		}

		return { success: true };
	});

// ── changeAdminUserPassword ──────────────────────────────────────────

export const changeAdminUserPassword = createServerFn({ method: "POST" })
	.middleware([errorLoggingMiddleware, authMiddleware])
	.inputValidator(
		z.object({
			userId: z.string().min(1),
			newPassword: z.string().min(8),
		}),
	)
	.handler(async ({ context, data }) => {
		assertAdmin(context);

		const headers = new Headers(getRequestHeaders());
		await auth.api.setUserPassword({
			body: {
				userId: data.userId,
				newPassword: data.newPassword,
			},
			headers,
		});

		return { success: true };
	});

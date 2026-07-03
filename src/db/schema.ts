import {
	boolean,
	index,
	integer,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

export * from "./auth-schema";

// ── Enums ─────────────────────────────────────────────────────────────

export const goalStatusEnum = pgEnum("goal_status", [
	"active",
	"completed",
	"failed",
	"paused",
]);

export const goalCategoryEnum = pgEnum("goal_category", [
	"exam",
	"project",
	"presentation",
	"other",
]);

export const sessionCategoryEnum = pgEnum("session_category", [
	"course",
	"learning",
	"other",
]);

export const sessionSourceEnum = pgEnum("session_source", ["manual", "ics"]);

export const notificationChannelEnum = pgEnum("notification_channel", [
	"email",
	"push",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
	"sent",
	"failed",
	"skipped",
]);

// ── Core application tables ───────────────────────────────────────────

export const goals = pgTable(
	"goals",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		color: text("color"),
		description: text("description"),
		category: goalCategoryEnum("category").notNull().default("other"),
		targetHours: integer("target_hours").notNull(),
		requiredCount: integer("required_count").notNull().default(1),
		status: goalStatusEnum("status").notNull().default("active"),
		startDate: timestamp("start_date", { withTimezone: true }).notNull(),
		endDate: timestamp("end_date", { withTimezone: true }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		userIdx: index("goals_user_id_idx").on(table.userId),
		statusIdx: index("goals_status_idx").on(table.status),
	}),
);

export const monthlyPlans = pgTable(
	"monthly_plans",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		goalId: uuid("goal_id")
			.notNull()
			.references(() => goals.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		month: text("month").notNull(),
		plannedHours: integer("planned_hours").notNull(),
		notes: text("notes"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		goalIdx: index("monthly_plans_goal_id_idx").on(table.goalId),
		userMonthUnique: uniqueIndex("monthly_plans_user_goal_month_unq").on(
			table.userId,
			table.goalId,
			table.month,
		),
	}),
);

export const calendarImports = pgTable(
	"calendar_imports",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		color: text("color").notNull(),
		visible: boolean("visible").notNull().default(true),
		notificationsEnabled: boolean("notifications_enabled")
			.notNull()
			.default(true),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		userIdx: index("calendar_imports_user_id_idx").on(table.userId),
	}),
);

export const sessions = pgTable(
	"sessions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		goalId: uuid("goal_id").references(() => goals.id, { onDelete: "cascade" }),
		importId: uuid("import_id").references(() => calendarImports.id, {
			onDelete: "cascade",
		}),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		name: text("name"),
		color: text("color"),
		startTime: timestamp("start_time", { withTimezone: true }),
		endTime: timestamp("end_time", { withTimezone: true }),
		category: sessionCategoryEnum("category").notNull().default("learning"),
		source: sessionSourceEnum("source").notNull().default("manual"),
		countsTowardGoal: boolean("counts_toward_goal").notNull().default(true),
		notes: text("notes"),
		notificationsEnabled: boolean("notifications_enabled")
			.notNull()
			.default(true),
		notificationSentAt: jsonb("notification_sent_at")
			.$type<Record<string, string>>()
			.default({}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		goalIdx: index("sessions_goal_id_idx").on(table.goalId),
		importIdx: index("sessions_import_id_idx").on(table.importId),
		userStartTimeIdx: index("sessions_user_start_time_idx").on(
			table.userId,
			table.startTime,
		),
	}),
);

export const milestones = pgTable(
	"milestones",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		goalId: uuid("goal_id")
			.notNull()
			.references(() => goals.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
		completedAt: timestamp("completed_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		goalIdx: index("milestones_goal_id_idx").on(table.goalId),
		userDueDateIdx: index("milestones_user_due_date_idx").on(
			table.userId,
			table.dueDate,
		),
	}),
);

export const achievements = pgTable(
	"achievements",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		goalId: uuid("goal_id").references(() => goals.id, {
			onDelete: "set null",
		}),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		category: goalCategoryEnum("category").notNull().default("other"),
		name: text("name"),
		achievedAt: timestamp("achieved_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		grade: numeric("grade", { precision: 2, scale: 1 }),
		points: integer("points"),
		notes: text("notes"),
	},
	(table) => ({
		goalIdx: index("achievements_goal_id_idx").on(table.goalId),
		userAchievedAtIdx: index("achievements_user_achieved_at_idx").on(
			table.userId,
			table.achievedAt,
		),
	}),
);

// ── Notification tables ───────────────────────────────────────────────

export const notificationPreferences = pgTable("notification_preferences", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id")
		.notNull()
		.unique()
		.references(() => user.id, { onDelete: "cascade" }),
	emailEnabled: boolean("email_enabled").notNull().default(true),
	pushEnabled: boolean("push_enabled").notNull().default(true),
	emailLeadMinutes: integer("email_lead_minutes").notNull().default(30),
	pushLeadMinutes: integer("push_lead_minutes").notNull().default(5),
	quietHourStart: integer("quiet_hour_start"), // 0-23 hour
	quietHourEnd: integer("quiet_hour_end"), // 0-23 hour
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const pushSubscriptions = pgTable(
	"push_subscriptions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		endpoint: text("endpoint").notNull(),
		p256dh: text("p256dh").notNull(),
		auth: text("auth").notNull(),
		userAgent: text("user_agent"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		userIdx: index("push_subscriptions_user_id_idx").on(table.userId),
		endpointUnique: uniqueIndex("push_subscriptions_endpoint_unq").on(
			table.endpoint,
		),
	}),
);

export const notificationLog = pgTable(
	"notification_log",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		sessionId: uuid("session_id").references(() => sessions.id, {
			onDelete: "set null",
		}),
		channel: notificationChannelEnum("channel").notNull(),
		status: notificationStatusEnum("status").notNull(),
		leadMinutes: integer("lead_minutes").notNull(),
		errorMessage: text("error_message"),
		sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => ({
		userIdx: index("notification_log_user_id_idx").on(table.userId),
		sessionIdx: index("notification_log_session_id_idx").on(table.sessionId),
	}),
);

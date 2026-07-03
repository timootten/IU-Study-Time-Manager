# IU Study Time Manager

A Progressive Web App for managing study time and goals. Plan your learning schedule with 6-month goals, monthly plans, and detailed session tracking with timer functionality.

## Features

- **Goal Management**: Create and track study goals with target hours, deadlines, and status
- **Monthly Planning**: Break down goals into monthly plans with hour estimates
- **Session Tracking**: Log study sessions with planned and actual times
- **Live Timer**: Track active study sessions in real-time
- **Milestones**: Set and complete milestones within goals
- **Achievements**: Earn achievements for completing modules, passing exams, and reaching milestones
- **Statistics**: Visualize progress with weekly trends and plan vs. actual comparisons
- **Offline Support**: PWA with service worker for offline functionality
- **Authentication**: Secure email/password authentication with Better Auth

## Tech Stack

| Layer         | Tool                             |
| ------------- | -------------------------------- |
| Framework     | TanStack Start (React, SSR)      |
| Routing       | TanStack Router                  |
| Auth          | Better Auth                      |
| ORM           | Drizzle ORM                      |
| Database      | PostgreSQL                       |
| UI            | shadcn/ui + Tailwind CSS v4      |
| Data Fetching | TanStack Query                   |
| Styling       | Tailwind CSS v4 + tw-animate-css |
| Forms         | Zod validation                   |
| Logging       | Pino + Pino Pretty               |
| Notifications | Sonner (toast)                   |
| Icons         | Lucide React                     |
| Code Quality  | Biome (linting + formatting)     |
| Runtime       | Bun                              |
| Language      | TypeScript (strict)              |

## Installation

### Prerequisites

- [Bun](https://bun.sh) (v1.0+)
- [Docker](https://docker.com) (for PostgreSQL)

### Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd IU-Study-Time-Manager
```

2. Copy environment template and configure:

```bash
cp .env.example .env
```

Edit `.env` and update:

- `BETTER_AUTH_SECRET`: Generate a random string (min 32 characters)
- Other URLs if not using defaults

3. Install dependencies:

```bash
bun install
```

4. Start PostgreSQL database (Docker Compose):

```bash
bun run db:up
```

5. Generate and apply database migrations:

```bash
bun run db:generate
bun run db:migrate
```

6. Start the development server:

```bash
bun dev
```

The app runs on `http://localhost:3000`.

## Available Scripts

### Development

```bash
bun dev              # Start development server on port 3000
bun build            # Build for production
bun preview          # Preview production build
```

### Database

```bash
bun run db:up        # Start PostgreSQL container
bun run db:down      # Stop PostgreSQL container
bun run db:reset     # Reset database (removes all data)
bun run db:generate  # Generate migrations from schema
bun run db:migrate   # Apply migrations to database
bun run db:push      # Push schema directly (dev only)
bun run db:studio    # Open Drizzle Studio (database GUI)
```

### Code Quality

```bash
bun run format       # Format code with Biome
bun run lint         # Lint code with Biome
bun run check        # Run all Biome checks
bun test             # Run tests with Vitest
```

### Authentication

```bash
bun run auth:generate  # Generate Better Auth tables
```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/study_time_manager

# Better Auth
BETTER_AUTH_SECRET=your-secret-here-min-32-characters
BETTER_AUTH_URL=http://localhost:3000

# Client
VITE_APP_URL=http://localhost:3000
```

## Project Structure

```
src/
├── routes/              # TanStack Router routes
│   ├── __root.tsx       # Root layout
│   ├── index.tsx        # Landing page
│   ├── about.tsx        # About page
│   ├── auth/            # Authentication pages
│   │   ├── index.tsx    # Auth layout
│   │   ├── login.tsx    # Login page
│   │   └── register.tsx # Registration page
│   ├── dashboard/       # Dashboard routes (protected)
│   │   ├── index.tsx    # Dashboard overview
│   │   ├── planner.tsx  # Goal planner & creation
│   │   ├── timer.tsx    # Active timer
│   │   └── stats.tsx    # Statistics & charts
│   ├── profile/         # User profile
│   │   ├── index.tsx    # Profile overview
│   │   └── settings.tsx # Settings page
│   └── api/             # API routes
│       └── auth/        # Better Auth endpoints
├── components/          # React components
│   ├── ui/              # shadcn/ui components
│   ├── auth/            # Auth-related components
│   └── dashboard/       # Dashboard-specific components
├── db/                  # Database
│   ├── schema.ts        # Drizzle schema
│   ├── auth-schema.ts   # Better Auth schema
│   └── index.ts         # Database connection
├── lib/                 # Utilities
│   ├── auth.ts          # Better Auth server config
│   ├── auth-client.ts   # Better Auth client config
│   ├── utils.ts         # Helper functions
│   ├── query-context.ts # React Query setup
│   └── server/          # Server-side utilities
│       ├── logger.ts    # Pino logger
│       ├── require-auth.ts      # Auth middleware
│       ├── study-manager.ts     # Study data functions
│       └── database-status.ts   # DB health checks
├── hooks/               # Custom React hooks
└── styles.css           # Global styles
```

## Routes

| Path                 | Description                        | Auth Required |
| -------------------- | ---------------------------------- | ------------- |
| `/`                  | Landing page                       | No            |
| `/about`             | About page                         | No            |
| `/auth/login`        | Login page                         | No            |
| `/auth/register`     | Registration page                  | No            |
| `/dashboard`         | Dashboard overview                 | Yes           |
| `/dashboard/planner` | Create and manage goals & plans    | Yes           |
| `/dashboard/timer`   | Active timer for tracking sessions | Yes           |
| `/dashboard/stats`   | Statistics and charts              | Yes           |
| `/profile`           | User profile                       | Yes           |
| `/profile/settings`  | User settings                      | Yes           |

## Database Schema

The application uses PostgreSQL with Drizzle ORM. The schema includes:

### Better Auth Tables (managed by Better Auth)

- `user` - User accounts
- `account` - OAuth accounts
- `session` - Active sessions
- `verification` - Email verification tokens

### Application Tables

#### Goals

```typescript
goals {
  id: UUID (primary key)
  userId: text (foreign key → user.id)
  title: text
  description: text (nullable)
  targetHours: integer
  status: enum ('active' | 'completed' | 'failed' | 'paused')
  startDate: timestamp with timezone
  endDate: timestamp with timezone
  createdAt: timestamp with timezone
}
```

#### Monthly Plans

```typescript
monthly_plans {
  id: UUID (primary key)
  goalId: UUID (foreign key → goals.id)
  userId: text (foreign key → user.id)
  month: text (format: YYYY-MM)
  plannedHours: integer
  notes: text (nullable)
  createdAt: timestamp with timezone

  unique: (userId, goalId, month)
}
```

#### Learn Sessions

```typescript
learn_sessions {
  id: UUID (primary key)
  goalId: UUID (foreign key → goals.id)
  userId: text (foreign key → user.id)
  plannedStart: timestamp with timezone (nullable)
  plannedEnd: timestamp with timezone (nullable)
  actualStart: timestamp with timezone (nullable)
  actualEnd: timestamp with timezone (nullable)
  durationSec: integer (nullable)
  interrupted: boolean (default: false)
  notes: text (nullable)
  createdAt: timestamp with timezone
}
```

#### Milestones

```typescript
milestones {
  id: UUID (primary key)
  goalId: UUID (foreign key → goals.id)
  userId: text (foreign key → user.id)
  title: text
  dueDate: timestamp with timezone
  completedAt: timestamp with timezone (nullable)
  createdAt: timestamp with timezone
}
```

#### Achievements

```typescript
achievements {
  id: UUID (primary key)
  goalId: UUID (foreign key → goals.id, nullable)
  userId: text (foreign key → user.id)
  type: enum ('module_completed' | 'exam_passed' | 'report_submitted' | 'milestone')
  title: text
  achievedAt: timestamp with timezone
  notes: text (nullable)
}
```

### Relationships

- Goals belong to users (cascade delete)
- Monthly plans belong to goals and users (cascade delete)
- Learn sessions belong to goals and users (cascade delete)
- Milestones belong to goals and users (cascade delete)
- Achievements belong to users, optionally linked to goals (set null on goal delete)

## Architecture & Patterns

### Server Functions

All database access goes through server functions created with `createServerFn()`. Never call Drizzle directly from client code.

Example:

```typescript
export const getStudyGoals = createServerFn().handler(async () => {
  const session = await requireAuthSession();
  return await db.query.goals.findMany({
    where: eq(goals.userId, session.user.id),
  });
});
```

### Authentication Middleware

Protected routes use `requireAuthSession()` in `beforeLoad`:

```typescript
export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const session = await requireAuthSession();
    return { session };
  },
});
```

### Data Fetching with React Query

- Uses TanStack Query for client-side caching
- `staleTime: 30_000` - cache data for 30 seconds
- Prefetching on hover with `defaultPreload: "intent"`
- Optimistic updates for mutations

### Router Configuration

```typescript
{
  defaultPendingMs: 0,           // Show skeleton immediately
  defaultPendingMinMs: 0,        // No minimum pending time
  defaultPreload: "intent",      // Prefetch on hover
  defaultPreloadDelay: 50,       // 50ms hover delay
  defaultStaleTime: 30_000       // Cache for 30 seconds
}
```

### Error Handling

Custom error boundaries for different error types:

- `NotFoundError` - 404 pages
- `ServiceUnavailableError` - Database unavailable
- Generic errors with retry functionality

### Mutations Pattern

Always use optimistic updates:

```typescript
const mutation = useMutation({
  mutationFn: updateGoal,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ["goals"] });

    // Snapshot previous value
    const previous = queryClient.getQueryData(["goals"]);

    // Optimistically update
    queryClient.setQueryData(["goals"], (old) => updateFn(old, newData));

    return { previous };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(["goals"], context.previous);
  },
  onSettled: () => {
    // Refetch after mutation
    queryClient.invalidateQueries({ queryKey: ["goals"] });
  },
});
```

## Development

### Database Management

**View database in GUI:**

```bash
bun run db:studio
```

**Reset database (caution: deletes all data):**

```bash
bun run db:reset
```

**Generate new migration after schema changes:**

```bash
bun run db:generate
bun run db:migrate
```

### Code Quality

The project uses Biome for fast linting and formatting:

```bash
bun run check    # Run all checks
bun run format   # Format all files
bun run lint     # Lint all files
```

### Testing

Run tests with Vitest:

```bash
bun test         # Run all tests
bun test --ui    # Run with UI
```

## Deployment

1. Build the application:

```bash
bun run build
```

2. Preview the build locally:

```bash
bun run preview
```

3. Set production environment variables:

- Update `DATABASE_URL` to production database
- Generate strong `BETTER_AUTH_SECRET`
- Set correct `BETTER_AUTH_URL` and `VITE_APP_URL`

4. Run migrations on production database:

```bash
bun run db:migrate
```

## License

[Add your license here]

## Contributing

[Add contribution guidelines if needed]

## PWA & Offline

Service worker caching strategy:

- Navigation requests (HTML): `NetworkFirst`, 3s timeout → cached shell fallback
- `/api/**`: `NetworkFirst`, 5s timeout → cached data fallback
- Fonts / CDN assets: `CacheFirst`
- Images: `StaleWhileRevalidate`
- JS/CSS build assets: precached by Serwist

`navigationPreload: false` is required — SSR + service worker conflict otherwise.

`<OfflineBanner />` is always mounted in `__root.tsx`. It listens to `window online/offline` events and shows a fixed bottom pill when the user is offline.

Register the service worker in `src/client.tsx`, production only:

```ts
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" });
  });
}
```

## Design

- **Fonts:** `Instrument Serif` (display, 24px+ only) + `Geist` (body, all UI)
- **Accent:** Teal (`#01696f`) — CTAs, active states, progress indicators only
- **Surfaces:** Warm beige neutrals — never pure white/black
- **Layout:** Fixed sidebar 240px (desktop) → bottom tab bar (mobile, < 1024px)
- **Dark mode:** Required. `data-theme="dark"` on `<html>`, defaults to `prefers-color-scheme`

## Inactivity Monitoring (No Notifications)

- Detect missed planned sessions directly in dashboard analytics
- Track overdue milestones and plan drift as operational alerts
- Keep users informed in-app without browser or push notification dependencies
